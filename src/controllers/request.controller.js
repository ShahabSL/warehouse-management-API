const pool = require('../config/db');
const axios = require('axios'); // For SMS sending

// Get Pending Requests for a User (Receiver)
const getPendingRequests = async (req, res) => {
    const { userId } = req.query;
    console.log(`Request received for pending requests for receiver userId: ${userId}`);

    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID (userId) query parameter is required.' });
    }

    try {
        const query = `
            SELECT reqId, reqDate, reqType, reqDetail, reqSender 
            FROM xicorana.request 
            WHERE reqOk = 'pending' AND reqReciever = ?;
        `;
        const [results] = await pool.query(query, [userId]);

        if (results.length === 0) {
            return res.status(200).json({ success: true, data: [], message: 'درخواستی یافت نشد' });
        }
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error(`Database error fetching pending requests for receiver ${userId}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Update Request Status (Approve/Reject)
const updateRequestStatus = async (req, res) => {
    const reqId = req.params.reqId;
    const { reqOk, reqReciever } = req.body;
    console.log(`Request received to update request ${reqId} status to ${reqOk} for receiver ${reqReciever}`);

    if (!reqId || !reqOk || !reqReciever || (reqOk !== 'approved' && reqOk !== 'rejected')) {
        return res.status(400).json({ success: false, error: 'Missing or invalid parameters: reqId, reqOk (approved/rejected), reqReciever.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const query = `UPDATE xicorana.request SET reqOk = ? WHERE reqId = ? AND reqReciever = ? AND reqOk = 'pending';`;
        const [result] = await connection.query(query, [reqOk, reqId, reqReciever]);

        if (result.affectedRows === 0) {
            await connection.rollback(); // Rollback before checking
            const [checkResult] = await pool.query('SELECT reqOk FROM xicorana.request WHERE reqId = ? AND reqReciever = ?', [reqId, reqReciever]);
            if (checkResult.length > 0 && checkResult[0].reqOk !== 'pending') {
                return res.status(409).json({ success: false, error: 'تغییری انجام نپذیرفت، وضعیت درخواست از قبل تعیین شده است' });
            } else if (checkResult.length === 0) {
                return res.status(404).json({ success: false, error: 'درخواست با این شناسه برای این کاربر یافت نشد' });
            }
            return res.status(404).json({ success: false, error: 'تغییری انجام نپذیرفت، وضعیت درخواست از قبل تعیین شده و یا ارتباط شما با سرور دچار مشکل شده است' });
        }

        await connection.commit(); // Commit the change
        let reqOkPersian = reqOk === "approved" ? "تایید شده" : "رد شده";
        res.status(200).json({ success: true, data: `وضعیت درخواست به ${reqOkPersian} تغییر کرد` });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Database error updating status for request ${reqId}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    } finally {
        if (connection) connection.release();
    }
};

// Get Pending Requests Sent By a User
const getSentPendingRequests = async (req, res) => {
    const { userId } = req.query;
    console.log(`Request received for pending requests sent by userId: ${userId}`);

    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID (userId) query parameter is required.' });
    }

    try {
        const query = `
            SELECT reqId, reqDate, reqType, reqDetail, reqReciever, reqOk 
            FROM xicorana.request 
            WHERE reqOk = 'pending' AND reqSender = ?;
        `;
        const [results] = await pool.query(query, [userId]);

        if (results.length === 0) {
            return res.status(200).json({ success: true, data: [], message: 'درخواست در حال انتظاری یافت نشد' });
        }
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error(`Database error fetching sent pending requests for sender ${userId}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Create a New Request
const createRequest = async (req, res) => {
    const { reqType, reqDetail, userId, reqReciever } = req.body;
    console.log(`Request received to create new request: Type=${reqType}, Sender=${userId}, Receiver=${reqReciever}`);

    if (!reqType || !reqDetail || !userId || !reqReciever) {
        return res.status(400).json({ success: false, error: 'Missing required body parameters: reqType, reqDetail, userId, reqReciever.' });
    }

    let connection;
    const newReqId = `req${Math.floor(Math.random() * 1000000)}`; // Generate random ID outside transaction

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const query = `
            INSERT INTO xicorana.request (reqId, reqDate, reqType, reqDetail, reqSender, reqReciever, reqOk)
            VALUES (?, NOW(), ?, ?, ?, ?, 'pending');
        `;
        const [result] = await connection.query(query, [newReqId, reqType, reqDetail, userId, reqReciever]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            console.error('Failed to insert new request (affectedRows=0).', req.body);
            return res.status(500).json({ success: false, error: 'مشکلی در ایجاد درخواست پیش آمد، لطفا دوباره تلاش کنید' });
        }
        
        await connection.commit(); // Commit the insertion
        console.log(`Successfully created request ${newReqId}`);

        // Send SMS notification (outside transaction)
        try {
            const [userInfo] = await pool.query('SELECT phoneNumber FROM xicorana.user WHERE userId = ?', [reqReciever]);
            if (userInfo.length > 0 && userInfo[0].phoneNumber) {
                const phoneNumber = String(userInfo[0].phoneNumber);
                 const smsText = `در خواستی مبنی بر ورود کالا به محیط کارخانه به پنل شما ارسال شده است. با ورود به لینک زیر اقدام به تایید یا رد درخواست ثبت شده فرمایید\nhttps://admin.xikode.lol/\nسامانه ردیابی افشان نگار آریا`;
                
                console.log("Attempting to send request creation SMS to:", phoneNumber);
                const apiKey = process.env.SMS_API_KEY || '@@';
                const secretKey = process.env.SMS_SECRET_KEY || '@@';
                const sender = process.env.SMS_SENDER || '@number@';
                const axiosFullreq = `https://api.sms-webservice.com/api/V3/Send?ApiKey=${apiKey}&SecretKey=${secretKey}&Text=${encodeURIComponent(smsText)}&Sender=${sender}&Recipients=${phoneNumber}`;

                axios.get(axiosFullreq)
                    .then(response => console.log('SMS API Response (Request Creation):', response.status, response.data))
                    .catch(error => console.error('SMS API Error (Request Creation):', error.response ? error.response.data : error.message));
                
                res.status(201).json({ success: true, data: "درخواست به کاربر ارسال شد", reqId: newReqId }); // 201 Created
            } else {
                 console.warn(`Could not find phone number for receiver ${reqReciever} to send SMS.`);
                 res.status(201).json({ success: true, data: "درخواست ایجاد شد اما ارسال پیامک با مشکل مواجه شد", reqId: newReqId, warning: 'شماره تلفن گیرنده برای ارسال پیامک یافت نشد'});
            }
        } catch (smsError) {
            console.error(`Error fetching user info or sending SMS for new request ${newReqId}:`, smsError);
             res.status(201).json({ success: true, data: "درخواست ایجاد شد اما ارسال پیامک با مشکل مواجه شد", reqId: newReqId, warning: 'ارسال پیامک با مشکل مواجه شد'});
        }

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Database error creating new request:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: 'خطای سیستمی: شناسه درخواست تکراری ایجاد شد. لطفا دوباره تلاش کنید.' });
        }
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    } finally {
        if (connection) connection.release();
    }
};

// --- Admin Request Endpoints --- 

// Admin: Get All Requests Sent By a User
const adminGetSentRequests = async (req, res) => {
    const { userId } = req.query;
    console.log(`Admin request for requests sent by userId: ${userId}`);

    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID (userId) query parameter is required.' });
    }

    try {
        // Get all requests, regardless of status
        const query = `SELECT * FROM xicorana.request WHERE reqSender = ? ORDER BY reqDate DESC;`;
        const [results] = await pool.query(query, [userId]);

        if (results.length === 0) {
            return res.status(200).json({ success: true, data: [], message: 'درخواست ارسالی ای یافت نشد' });
        }
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error(`Database error fetching sent requests for admin ${userId}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Admin: Get Pending Requests Received By a User
const adminGetReceivedPendingRequests = async (req, res) => {
    const { userId } = req.query;
    console.log(`Admin request for pending requests received by userId: ${userId}`);

    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID (userId) query parameter is required.' });
    }

    try {
        const query = `SELECT * FROM xicorana.request WHERE reqReciever = ? AND reqOk = 'pending' ORDER BY reqDate DESC;`;
        const [results] = await pool.query(query, [userId]);

        // Empty is okay
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error(`Database error fetching received pending requests for admin ${userId}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Admin: Delete a Sent Request
const adminDeleteSentRequest = async (req, res) => {
    const reqId = req.params.reqId;
    console.log(`Admin request to delete sent request ${reqId}`);

    if (!reqId) {
        return res.status(400).json({ success: false, error: 'Request ID (reqId) parameter is required.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const query = `DELETE FROM xicorana.request WHERE reqId = ?;`;
        const [result] = await connection.query(query, [reqId]);

        if (result.affectedRows === 0) {
            await connection.rollback(); // Nothing deleted, rollback (though likely unnecessary)
            return res.status(404).json({ success: false, error: 'درخواست ارسالی یافت نشد یا از پیش حذف شده است' });
        }

        await connection.commit(); // Commit deletion
        res.status(200).json({ success: true, data: 'درخواست ارسالی حذف شد' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Database error deleting sent request ${reqId}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    } finally {
        if (connection) connection.release();
    }
};

// Admin: Approve a Received Request
const adminApproveReceivedRequest = async (req, res) => {
    const reqId = req.params.reqId;
    console.log(`Admin request to approve received request ${reqId}`);

    if (!reqId) {
        return res.status(400).json({ success: false, error: 'Request ID (reqId) parameter is required.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        // Setting reqOk to '1' as per original code
        const query = `UPDATE xicorana.request SET reqOk = '1' WHERE reqId = ? AND reqOk = 'pending';`;
        const [result] = await connection.query(query, [reqId]);

        if (result.affectedRows === 0) {
            await connection.rollback(); // Rollback before checking
            const [checkResult] = await pool.query('SELECT reqOk FROM xicorana.request WHERE reqId = ?', [reqId]);
            if (checkResult.length > 0 && checkResult[0].reqOk !== 'pending') {
                return res.status(409).json({ success: false, error: 'درخواست از پیش پردازش شده است (تایید یا رد شده)' });
            } else if (checkResult.length === 0) {
                return res.status(404).json({ success: false, error: 'درخواست با این شناسه یافت نشد' });
            }
            return res.status(404).json({ success: false, error: "درخواست یافت نشد یا وضعیت آن 'pending' نیست" });
        }

        await connection.commit(); // Commit approval
        res.status(200).json({ success: true, data: 'درخواست با موفقیت تایید شد' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Database error approving request ${reqId}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    } finally {
        if (connection) connection.release();
    }
};

// Admin: Deny a Received Request
const adminDenyReceivedRequest = async (req, res) => {
    const reqId = req.params.reqId;
    console.log(`Admin request to deny received request ${reqId}`);

    if (!reqId) {
        return res.status(400).json({ success: false, error: 'Request ID (reqId) parameter is required.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        // Setting reqOk to '0' as per original code
        const query = `UPDATE xicorana.request SET reqOk = '0' WHERE reqId = ? AND reqOk = 'pending';`;
        const [result] = await connection.query(query, [reqId]);

        if (result.affectedRows === 0) {
            await connection.rollback(); // Rollback before checking
            const [checkResult] = await pool.query('SELECT reqOk FROM xicorana.request WHERE reqId = ?', [reqId]);
            if (checkResult.length > 0 && checkResult[0].reqOk !== 'pending') {
                return res.status(409).json({ success: false, error: 'درخواست از پیش پردازش شده است (تایید یا رد شده)' });
            } else if (checkResult.length === 0) {
                return res.status(404).json({ success: false, error: 'درخواست با این شناسه یافت نشد' });
            }
            return res.status(404).json({ success: false, error: "درخواست یافت نشد یا وضعیت آن 'pending' نیست" });
        }

        await connection.commit(); // Commit denial
        res.status(200).json({ success: true, data: 'درخواست با موفقیت رد شد' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Database error denying request ${reqId}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getPendingRequests,
    updateRequestStatus,
    getSentPendingRequests,
    createRequest,
    adminGetSentRequests,
    adminGetReceivedPendingRequests,
    adminDeleteSentRequest,
    adminApproveReceivedRequest,
    adminDenyReceivedRequest,
}; 