const pool = require('../config/db');
const axios = require('axios');

// Helper to check QC status (avoids code duplication)
const checkQC = async (uid) => {
    const itemType = uid.substring(0, 3);
    let qcQuery = '';
    let fieldToCheck = '';

    switch (itemType) {
        case 'wsp': qcQuery = 'SELECT wspQC FROM xicorana.wirespool WHERE wspId = ?'; fieldToCheck = 'wspQC'; break;
        case 'ins': qcQuery = 'SELECT insQC FROM xicorana.insul WHERE insId = ?'; fieldToCheck = 'insQC'; break;
        case 'car': qcQuery = 'SELECT cartQC FROM xicorana.cart WHERE cartId = ?'; fieldToCheck = 'cartQC'; break;
        case 'fip': return { qcPassed: true }; // Final product assumed QC passed or not applicable
        default: return { error: 'Invalid uid prefix' };
    }

    try {
        const [results] = await pool.query(qcQuery, [uid]);
        if (results.length === 0) {
            return { error: 'Item not found for QC check' };
        }
        return { qcPassed: results[0][fieldToCheck] == 1 }; // Check if QC is 1
    } catch (dbError) {
        console.error(`Database error during QC check for ${uid}:`, dbError);
        return { error: `Database error during QC check: ${dbError.message}` };
    }
};

// Helper to send SMS (avoids code duplication)
const sendSMS = (phoneNumber, text) => {
    if (!phoneNumber) {
        console.warn("SMS not sent: Phone number missing.");
        return;
    }
    const apiKey = process.env.SMS_API_KEY || '@@';
    const secretKey = process.env.SMS_SECRET_KEY || '@@';
    const sender = process.env.SMS_SENDER || '@number@';
    const axiosFullreq = `https://api.sms-webservice.com/api/V3/Send?ApiKey=${apiKey}&SecretKey=${secretKey}&Text=${encodeURIComponent(text)}&Sender=${sender}&Recipients=${phoneNumber}`;

    console.log("Attempting to send SMS to:", phoneNumber);
    axios.get(axiosFullreq)
        .then(response => console.log('SMS API Response:', response.status, response.data))
        .catch(error => console.error('SMS API Error:', error.response ? error.response.data : error.message));
};

// Handle Item Entry
const handleEntry = async (req, res) => {
    const { wpId } = req.body;
    const uid = req.params.uid;
    console.log(`Request received for ENTRY: UID=${uid}, WP=${wpId}`);

    if (!wpId || !uid) {
        return res.status(400).json({ success: false, error: 'Missing wpId or uid parameters.' });
    }

    const itemType = uid.substring(0, 3);
    let queryToRun = '';
    let idField = '';
    let statusField = '';
    let tableName = '';

    switch (itemType) {
        case 'wsp': tableName = 'wirespool'; idField = 'wspId'; statusField = 'wspLL'; queryToRun = `UPDATE xicorana.${tableName} SET wpId = ?, ${statusField} = 'ورود' WHERE ${idField} = ? AND wpId != ? AND ${statusField} != 'ورود';`; break;
        case 'ins': tableName = 'insul'; idField = 'insId'; statusField = 'insLL'; queryToRun = `UPDATE xicorana.${tableName} SET wpId = ?, ${statusField} = 'ورود' WHERE ${idField} = ? AND wpId != ? AND ${statusField} != 'ورود';`; break;
        case 'car': tableName = 'cart'; idField = 'cartId'; statusField = 'cartLL'; queryToRun = `UPDATE xicorana.${tableName} SET wpId = ?, ${statusField} = 'ورود' WHERE ${idField} = ? AND wpId != ? AND ${statusField} != 'ورود';`; break;
        case 'fip': tableName = 'finalproduct'; idField = 'fpId'; statusField = 'fpLL'; queryToRun = `UPDATE xicorana.${tableName} SET wpId = ?, ${statusField} = 'ورود' WHERE ${idField} = ? AND wpId != ? AND ${statusField} != 'ورود';`; break;
        default:
            return res.status(400).json({ success: false, error: 'Invalid uid prefix' });
    }

    // 1. Check QC status first
    const qcResult = await checkQC(uid);
    if (qcResult.error) {
        // Handle QC check error (e.g., item not found, DB error)
        const status = qcResult.error.includes('not found') ? 404 : 500;
        return res.status(status).json({ success: false, error: qcResult.error });
    }

    let connection;
    try {
        // 2. Perform the update within a transaction
        connection = await pool.getConnection();
        await connection.beginTransaction();

        console.log('Executing entry update query:', queryToRun);
        const [updateResult] = await connection.query(queryToRun, [wpId, uid, wpId]);

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, error: `محصولی برای ورود ثبت نشد. از وضعیت کنترل کیفیت و یا مکان فعلی محصول (${statusField} باید مخالف 'ورود' و wpId مخالف ${wpId} باشد) اطمینان حاصل کنید.` });
        }
        
        await connection.commit();
        console.log(`Entry successful for UID ${uid} to WP ${wpId}`);

        // 3. Send SMS (outside transaction, after successful commit)
        try {
            const [wpInfo] = await pool.query('SELECT wpName, wpPhoneNumber FROM xicorana.workplace WHERE wpId = ?', [wpId]);
            if (wpInfo.length > 0) {
                const smsText = `ورود کالای ${uid} به انبار ${wpInfo[0].wpName} صورت گرفت\nسامانه ردیابی افشان نگار آریا`;
                sendSMS(wpInfo[0].wpPhoneNumber, smsText);
            } else {
                console.warn(`Workplace info not found for ${wpId}, cannot send entry SMS.`);
            }
        } catch (smsRelatedError) {
            console.error(`Error fetching workplace info or sending SMS for entry ${uid}:`, smsRelatedError);
             // Log the error but don't fail the main response as the entry was successful
        }

        // 4. Send Response (include QC alert if needed)
        const responseData = { success: true, data: `محصول وارد شد` };
        if (!qcResult.qcPassed) {
            responseData.success = 'alert'; // Use 'alert' status as per original code
            responseData.alert = 'محصول مورد نظر دارایی تاییدیه کنترل کیفی نیست!';
        }
        res.status(200).json(responseData);

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Error handling entry for UID ${uid}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده در هنگام ثبت ورود: ${String(error.message)}` });
    } finally {
        if (connection) connection.release();
    }
};

// Handle Item Exit
const handleExit = async (req, res) => {
    const { wpId } = req.body;
    const uid = req.params.uid;
    console.log(`Request received for EXIT: UID=${uid}, WP=${wpId}`);

     if (!wpId || !uid) {
        return res.status(400).json({ success: false, error: 'Missing wpId or uid parameters.' });
    }

    const itemType = uid.substring(0, 3);
    let queryToRun = '';
    let idField = '';
    let statusField = '';
    let tableName = '';

     switch (itemType) {
        case 'wsp': tableName = 'wirespool'; idField = 'wspId'; statusField = 'wspLL'; queryToRun = `UPDATE xicorana.${tableName} SET ${statusField} = 'خروج' WHERE ${idField} = ? AND wpId = ? AND ${statusField} != 'خروج';`; break;
        case 'ins': tableName = 'insul'; idField = 'insId'; statusField = 'insLL'; queryToRun = `UPDATE xicorana.${tableName} SET ${statusField} = 'خروج' WHERE ${idField} = ? AND wpId = ? AND ${statusField} != 'خروج';`; break;
        case 'car': tableName = 'cart'; idField = 'cartId'; statusField = 'cartLL'; queryToRun = `UPDATE xicorana.${tableName} SET ${statusField} = 'خروج' WHERE ${idField} = ? AND wpId = ? AND ${statusField} != 'خروج';`; break;
        case 'fip': tableName = 'finalproduct'; idField = 'fpId'; statusField = 'fpLL'; queryToRun = `UPDATE xicorana.${tableName} SET ${statusField} = 'خروج' WHERE ${idField} = ? AND wpId = ? AND ${statusField} != 'خروج';`; break;
        default:
            return res.status(400).json({ success: false, error: 'Invalid uid prefix' });
    }

    // 1. Check QC status first
    const qcResult = await checkQC(uid);
     if (qcResult.error) {
        // Handle QC check error
        const status = qcResult.error.includes('not found') ? 404 : 500;
        return res.status(status).json({ success: false, error: qcResult.error });
    }

    let connection;
    try {
        // 2. Perform the update within a transaction
        connection = await pool.getConnection();
        await connection.beginTransaction();

        console.log('Executing exit update query:', queryToRun);
        const [updateResult] = await connection.query(queryToRun, [uid, wpId]);

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
             // Check if the item exists at the workplace but is already 'خروج'
             const checkQuery = `SELECT ${statusField} FROM xicorana.${tableName} WHERE ${idField} = ? AND wpId = ?`;
             const [checkStatus] = await connection.query(checkQuery, [uid, wpId]);
             if (checkStatus.length > 0 && checkStatus[0][statusField] === 'خروج') {
                 return res.status(409).json({ success: false, error: 'محصول از قبل خارج شده است.' }); // 409 Conflict
             } else if (checkStatus.length === 0) {
                  return res.status(404).json({ success: false, error: 'محصول در این مکان یافت نشد.' });
             }
            // Fallback error
            return res.status(404).json({ success: false, error: `محصولی برای خروج ثبت نشد. از وضعیت مکان و وضعیت خروج (${statusField} باید مخالف 'خروج' باشد) اطمینان حاصل کنید.` });
        }

        await connection.commit();
         console.log(`Exit successful for UID ${uid} from WP ${wpId}`);

        // 3. Send SMS (outside transaction, after successful commit)
         try {
            const [wpInfo] = await pool.query('SELECT wpName, wpPhoneNumber FROM xicorana.workplace WHERE wpId = ?', [wpId]);
            if (wpInfo.length > 0) {
                const smsText = `خروج کالای ${uid} از انبار ${wpInfo[0].wpName} صورت گرفت\nسامانه ردیابی افشان نگار آریا`;
                sendSMS(wpInfo[0].wpPhoneNumber, smsText);
            } else {
                 console.warn(`Workplace info not found for ${wpId}, cannot send exit SMS.`);
            }
        } catch (smsRelatedError) {
            console.error(`Error fetching workplace info or sending SMS for exit ${uid}:`, smsRelatedError);
        }

        // 4. Send Response (include QC alert if needed)
        const responseData = { success: true, data: `محصول خارج شد` };
        if (!qcResult.qcPassed) {
            responseData.success = 'alert'; // Use 'alert' status as per original code
            responseData.alert = 'محصول مورد نظر دارایی تاییدیه کنترل کیفی نیست!';
        }
        res.status(200).json(responseData);

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Error handling exit for UID ${uid}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده در هنگام ثبت خروج: ${String(error.message)}` });
    } finally {
        if (connection) connection.release();
    }
};

// Handle Item Placement (Sector Change)
const handlePlacement = async (req, res) => {
    const { sectorNew, wpId } = req.body;
    const uid = req.params.uid;
    console.log(`Request received for PLACEMENT: UID=${uid}, NewSector=${sectorNew}, WP=${wpId}`);

     if (!sectorNew || !wpId || !uid) {
        return res.status(400).json({ success: false, error: 'Missing sectorNew, wpId, or uid parameters.' });
    }

    const itemType = uid.substring(0, 3);
    let queryToRun = '';
    let idField = '';
    let sectorField = '';
    let tableName = '';

    switch (itemType) {
        case 'wsp': tableName = 'wirespool'; idField = 'wspId'; sectorField = 'wspSector'; queryToRun = `UPDATE xicorana.${tableName} SET ${sectorField} = ? WHERE ${idField} = ? AND ${sectorField} != ? AND wpId = ?;`; break;
        // Original code had typo 'insul' instead of 'xicorana.insul'?
        case 'ins': tableName = 'insul'; idField = 'insId'; sectorField = 'insSector'; queryToRun = `UPDATE xicorana.${tableName} SET ${sectorField} = ? WHERE ${idField} = ? AND ${sectorField} != ? AND wpId = ?;`; break;
        // Original code had typo 'finalproduct ' instead of 'xicorana.finalproduct'?
        case 'fip': tableName = 'finalproduct'; idField = 'fpId'; sectorField = 'fpSector'; queryToRun = `UPDATE xicorana.${tableName} SET ${sectorField} = ? WHERE ${idField} = ? AND ${sectorField} != ? AND wpId = ?;`; break;
        default:
            return res.status(400).json({ success: false, error: 'Invalid uid prefix' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        console.log('Executing placement update query:', queryToRun);
        const [updateResult] = await connection.query(queryToRun, [sectorNew, uid, sectorNew, wpId]);

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
             // Check if item exists at the workplace but already has the target sector
             const checkQuery = `SELECT ${sectorField} FROM xicorana.${tableName} WHERE ${idField} = ? AND wpId = ?`;
             const [checkSector] = await connection.query(checkQuery, [uid, wpId]);
             if (checkSector.length > 0 && checkSector[0][sectorField] === sectorNew) {
                 return res.status(409).json({ success: false, error: `محصول از قبل در سکتور ${sectorNew} قرار دارد.` }); // 409 Conflict
             } else if (checkSector.length === 0) {
                  return res.status(404).json({ success: false, error: 'محصول در این مکان یافت نشد.' });
             }
            // Fallback error
            return res.status(404).json({ success: false, error: `محصولی به جایی منتقل نشد. از تطبیق مکان کاری (${wpId}) با مکان محصول و عدم تکراری بودن سکتور (${sectorNew}) اطمینان حاصل فرمایید.` });
        }

        await connection.commit();
        console.log(`Placement successful for UID ${uid} to Sector ${sectorNew} in WP ${wpId}`);
        res.status(200).json({ success: true, data: `محصول به سکتور ${sectorNew} منتقل شد` });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Error handling placement for UID ${uid}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده در هنگام ثبت جابجایی: ${String(error.message)}` });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    handleEntry,
    handleExit,
    handlePlacement,
}; 