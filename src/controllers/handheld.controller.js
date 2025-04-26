const pool = require('../config/db');
const axios = require('axios');

// Helper function to send SMS (avoids repetition)
const sendSms = (phoneNumber, smsText) => {
    if (!phoneNumber || !smsText) return;
    try {
        const axiosFullreq = `https://api.sms-webservice.com/api/V3/Send?ApiKey=@@&SecretKey=@@&Text=${encodeURIComponent(smsText)}&Sender=@number@&Recipients=${phoneNumber}`;
        console.log("Attempting to send SMS to:", phoneNumber);
        axios.get(axiosFullreq)
            .then(response => console.log("SMS API Response:", response.status))
            .catch(error => console.error('SMS sending failed:', error.response ? error.response.data : error.message));
    } catch (err) {
         console.error('Error constructing or sending SMS request:', err);
    }
};

// Controller for handling item entry
const handleEntry = async (req, res) => {
    const { wpId } = req.body;
    const uid = req.params.uid;
    console.log(`Handling entry for uid: ${uid} into wpId: ${wpId}`);

    if (!wpId || !uid) {
        return res.status(400).json({ success: false, error: 'wpId and uid are required.' });
    }

    const itemType = uid.substring(0, 3);
    let qcQuery = '';
    let qcField = '';
    let updateQuery = '';
    let tableName = '';
    let idField = '';
    let llField = '';

    // Define queries and fields based on item type
    switch (itemType) {
        case 'wsp':
            tableName = 'wirespool'; idField = 'wspId'; llField = 'wspLL'; qcField = 'wspQC';
            qcQuery = `SELECT ${qcField} FROM xicorana.${tableName} WHERE ${idField} = ?`;
            updateQuery = `UPDATE xicorana.${tableName} SET wpId = ?, ${llField} = 'ورود' WHERE ${idField} = ? AND wpId != ? AND ${llField} != 'ورود';`;
            break;
        case 'ins':
             tableName = 'insul'; idField = 'insId'; llField = 'insLL'; qcField = 'insQC';
             qcQuery = `SELECT ${qcField} FROM xicorana.${tableName} WHERE ${idField} = ?`;
             updateQuery = `UPDATE xicorana.${tableName} SET wpId = ?, ${llField} = 'ورود' WHERE ${idField} = ? AND wpId != ? AND ${llField} != 'ورود';`;
            break;
        case 'car':
            tableName = 'cart'; idField = 'cartId'; llField = 'cartLL'; qcField = 'cartQC';
            qcQuery = `SELECT ${qcField} FROM xicorana.${tableName} WHERE ${idField} = ?`;
            updateQuery = `UPDATE xicorana.${tableName} SET wpId = ?, ${llField} = 'ورود' WHERE ${idField} = ? AND wpId != ? AND ${llField} != 'ورود';`;
            break;
        case 'fip':
            tableName = 'finalproduct'; idField = 'fpId'; llField = 'fpLL';
            qcQuery = null; // No QC check for final product entry
            updateQuery = `UPDATE xicorana.${tableName} SET wpId = ?, ${llField} = 'ورود' WHERE ${idField} = ? AND wpId != ? AND ${llField} != 'ورود';`;
            break;
        default:
            return res.status(400).json({ success: false, error: 'Invalid uid prefix' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        let aghayeQC = 0; // Default QC status (0 = Not OK or N/A)
        
        // 1. Check QC status if applicable
        if (qcQuery) {
            const [qcResults] = await connection.query(qcQuery, [uid]);
            if (qcResults.length > 0 && qcResults[0][qcField] == 1) {
                aghayeQC = 1; // QC is OK
            }
             console.log(`QC check for ${uid}: Status = ${aghayeQC}`);
        }

        // 2. Update item location and status
        console.log('Executing update query:', updateQuery);
        const [updateResult] = await connection.query(updateQuery, [wpId, uid, wpId]);

        if (updateResult.affectedRows === 0) {
             await connection.rollback();
             return res.status(404).json({ success: false, error: `محصولی برای ورود ثبت نشد. وضعیت کنترل کیفیت، مکان فعلی، یا تکراری بودن عملیات را بررسی کنید.` });
        }
        
        // 3. Get workplace details for SMS (don't fail transaction if this lookup fails)
        let wpName = 'نامشخص';
        let phoneNumber = null;
        try {
            const [wpResults] = await connection.query('SELECT wpName, wpPhoneNumber FROM xicorana.workplace WHERE wpId = ?', [wpId]);
            if (wpResults.length > 0) {
                wpName = wpResults[0].wpName;
                phoneNumber = wpResults[0].wpPhoneNumber;
            }
        } catch (wpError) {
            console.error('Error fetching workplace details for SMS:', wpError);
            // Continue without SMS details
        }

        // 4. Commit the transaction
        await connection.commit();
        console.log(`Entry transaction successful for uid: ${uid}`);

        // 5. Send SMS (after successful commit)
        if (phoneNumber) {
            const smsText = `ورود کالای ${uid} به انبار ${wpName} صورت گرفت\nسامانه ردیابی افشان نگار آریا`;
            sendSms(phoneNumber, smsText);
        }

        // 6. Send response
        let response = { success: true, data: 'محصول وارد شد' };
        if (phoneNumber === null) {
             response.warning = 'ارسال پیامک به سرپرست انبار با مشکل مواجه شد (عدم یافتن اطلاعات انبار).';
        }
        if (aghayeQC === 0 && itemType !== 'fip') { // Add QC alert if applicable and QC wasn't OK
            response.alert = 'محصول مورد نظر دارایی تاییدیه کنترل کیفی نیست!';
            response.success = 'alert'; // Keep success as 'alert' to match original logic
        }
        res.status(200).json(response);

    } catch (error) {
        console.error(`Error during entry transaction for uid: ${uid}:`, error);
        if (connection) await connection.rollback(); // Rollback on any error
        res.status(500).json({ success: false, error: `خطای داخلی سرور: ${String(error.message)}` });
    } finally {
        if (connection) connection.release(); // Always release connection
    }
};

// Controller for handling item exit
const handleExit = async (req, res) => {
    const { wpId } = req.body;
    const uid = req.params.uid;
     console.log(`Handling exit for uid: ${uid} from wpId: ${wpId}`);

     if (!wpId || !uid) {
        return res.status(400).json({ success: false, error: 'wpId and uid are required.' });
    }

    const itemType = uid.substring(0, 3);
    let qcQuery = '';
    let qcField = '';
    let updateQuery = '';
    let tableName = '';
    let idField = '';
    let llField = '';

     // Define queries and fields based on item type
    switch (itemType) {
        case 'wsp':
            tableName = 'wirespool'; idField = 'wspId'; llField = 'wspLL'; qcField = 'wspQC';
            qcQuery = `SELECT ${qcField} FROM xicorana.${tableName} WHERE ${idField} = ?`;
            updateQuery = `UPDATE xicorana.${tableName} SET ${llField}='خروج' WHERE ${idField} = ? AND wpId = ? AND ${llField} != 'خروج';`;
            break;
        case 'ins':
             tableName = 'insul'; idField = 'insId'; llField = 'insLL'; qcField = 'insQC';
             qcQuery = `SELECT ${qcField} FROM xicorana.${tableName} WHERE ${idField} = ?`;
             updateQuery = `UPDATE xicorana.${tableName} SET ${llField}='خروج' WHERE ${idField} = ? AND wpId = ? AND ${llField} != 'خروج';`;
            break;
        case 'car':
            tableName = 'cart'; idField = 'cartId'; llField = 'cartLL'; qcField = 'cartQC';
            qcQuery = `SELECT ${qcField} FROM xicorana.${tableName} WHERE ${idField} = ?`;
             updateQuery = `UPDATE xicorana.${tableName} SET ${llField}='خروج' WHERE ${idField} = ? AND wpId = ? AND ${llField} != 'خروج';`;
            break;
        case 'fip':
            tableName = 'finalproduct'; idField = 'fpId'; llField = 'fpLL';
            qcQuery = null; // No QC check for final product exit
            updateQuery = `UPDATE xicorana.${tableName} SET ${llField} = 'خروج' WHERE ${idField} = ? AND wpId = ? AND ${llField} != 'خروج';`;
            break;
        default:
            return res.status(400).json({ success: false, error: 'Invalid uid prefix' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        let aghayeQC = 0; // Default QC status
        
         // 1. Check QC status if applicable
        if (qcQuery) {
            const [qcResults] = await connection.query(qcQuery, [uid]);
            if (qcResults.length > 0 && qcResults[0][qcField] == 1) {
                aghayeQC = 1; // QC is OK
            }
             console.log(`QC check for ${uid}: Status = ${aghayeQC}`);
        }

        // 2. Update item status to 'خروج'
        console.log('Executing update query:', updateQuery);
        const [updateResult] = await connection.query(updateQuery, [uid, wpId]);

        if (updateResult.affectedRows === 0) {
             await connection.rollback();
             // Provide a more informative error message
             return res.status(404).json({ success: false, error: `محصولی برای خروج ثبت نشد. محصول در این انبار نیست یا قبلاً خارج شده است.` });
        }
        
         // 3. Get workplace details for SMS (don't fail transaction if this lookup fails)
        let wpName = 'نامشخص';
        let phoneNumber = null;
        try {
            const [wpResults] = await connection.query('SELECT wpName, wpPhoneNumber FROM xicorana.workplace WHERE wpId = ?', [wpId]);
            if (wpResults.length > 0) {
                wpName = wpResults[0].wpName;
                phoneNumber = wpResults[0].wpPhoneNumber;
            }
        } catch (wpError) {
            console.error('Error fetching workplace details for SMS:', wpError);
             // Continue without SMS details
        }

        // 4. Commit the transaction
        await connection.commit();
         console.log(`Exit transaction successful for uid: ${uid}`);

         // 5. Send SMS (after successful commit)
        if (phoneNumber) {
             const smsText = `خروج کالای ${uid} از انبار ${wpName} صورت گرفت\nسامانه ردیابی افشان نگار آریا`; // Corrected typo in original
            sendSms(phoneNumber, smsText);
        }

        // 6. Send response
        let response = { success: true, data: 'محصول خارج شد' };
         if (phoneNumber === null) {
             response.warning = 'ارسال پیامک به سرپرست انبار با مشکل مواجه شد (عدم یافتن اطلاعات انبار).';
        }
         if (aghayeQC === 0 && itemType !== 'fip') { // Add QC alert if applicable
            response.alert = 'محصول مورد نظر دارایی تاییدیه کنترل کیفی نیست!';
            response.success = 'alert'; // Keep success as 'alert' to match original logic
        }
        res.status(200).json(response);

    } catch (error) {
        console.error(`Error during exit transaction for uid: ${uid}:`, error);
        if (connection) await connection.rollback();
        res.status(500).json({ success: false, error: `خطای داخلی سرور: ${String(error.message)}` });
    } finally {
        if (connection) connection.release();
    }
};

// Controller for handling item placement
const handlePlacement = async (req, res) => {
    const { sectorNew, wpId } = req.body;
    const uid = req.params.uid;
     console.log(`Handling placement for uid: ${uid} to sector: ${sectorNew} in wpId: ${wpId}`);

    if (!sectorNew || !wpId || !uid) {
        return res.status(400).json({ success: false, error: 'sectorNew, wpId, and uid are required.' });
    }

    const itemType = uid.substring(0, 3);
    let updateQuery = '';
    let tableName = '';
    let idField = '';
    let sectorField = '';

    // Define queries and fields based on item type
    switch (itemType) {
        case 'wsp':
            tableName = 'wirespool'; idField = 'wspId'; sectorField = 'wspSector';
            updateQuery = `UPDATE xicorana.${tableName} SET ${sectorField} = ? WHERE ${idField} = ? AND ${sectorField} != ? AND wpId = ?;`;
            break;
        case 'ins':
             tableName = 'insul'; idField = 'insId'; sectorField = 'insSector';
             // Note: Original query had table name 'insul', corrected here
             updateQuery = `UPDATE xicorana.${tableName} SET ${sectorField} = ? WHERE ${idField} = ? AND ${sectorField} != ? AND wpId = ?;`; 
            break;
        case 'fip': // Assuming final products can also be placed
             tableName = 'finalproduct'; idField = 'fpId'; sectorField = 'fpSector';
             updateQuery = `UPDATE xicorana.${tableName} SET ${sectorField} = ? WHERE ${idField} = ? AND ${sectorField} != ? AND wpId = ?;`;
            break;
         // case 'car': // Carts don't have a sector field in the original code
        default:
             // If 'car' or other types shouldn't be placeable, handle here or return error
            return res.status(400).json({ success: false, error: 'Invalid or non-placeable uid prefix' });
    }

    try {
        console.log('Executing placement query:', updateQuery);
        const [result] = await pool.query(updateQuery, [sectorNew, uid, sectorNew, wpId]);

        if (result.affectedRows === 0) {
            // Changed status to 400 as it might be a client error (wrong wpId, already in sector)
            return res.status(400).json({ success: false, error: `محصول به سکتور منتقل نشد. از تطابق انبار و عدم وجود کالا در سکتور مقصد اطمینان حاصل فرمایید.` });
        } else {
            console.log(`Placement successful for uid: ${uid}`);
            res.status(200).json({ success: true, data: `محصول به سکتور ${sectorNew} منتقل شد` });
        }
    } catch (error) {
        console.error(`Error during placement for uid: ${uid}:`, error);
        res.status(500).json({ success: false, error: `خطای داخلی سرور: ${String(error.message)}` });
    }
    // No transaction needed for single update usually, but could be added for consistency if desired.
};

module.exports = {
    handleEntry,
    handleExit,
    handlePlacement,
}; 