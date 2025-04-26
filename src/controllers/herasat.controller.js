const pool = require('../config/db');
const axios = require('axios'); // For SMS sending


// Get Manufacturer Names
const getManufacturerNames = async (req, res) => {
    console.log('Request received for /manf/name');
    try {
        const query = 'SELECT manfName FROM xicorana.manf;';
        const [results] = await pool.query(query);

        if (results.length === 0) {
            return res.status(200).json({ success: true, data: [], message: 'سازنده ای یافت نشد' });
        }
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error('Database error fetching manufacturer names:', error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Get Orders Ready for Exit (Status = Gathered)
const getGatheredOrders = async (req, res) => {
    console.log('Request received for /gatheredexit');
    try {
        const query = `SELECT * FROM xicorana.order WHERE orderSituation = 'Gathered';`;
        const [results] = await pool.query(query);

        if (results.length === 0) {
            return res.status(200).json({ success: true, data: [], message: 'سفارشی جمع آوری شده و آماده خروج یافت نشد' });
        }
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error('Database error fetching gathered orders:', error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Get Sold Final Products for a Specific Order
const getSoldFinalProductsByOrder = async (req, res) => {
    const orderId = req.params.orderId;
    console.log(`Request received for /fporder/${orderId}`);

    if (!orderId) {
        return res.status(400).json({ success: false, error: 'Order ID parameter is required.' });
    }

    try {
        const query = `SELECT * FROM xicorana.sold_finalproduct WHERE orderid = ?;`;
        const [results] = await pool.query(query, [orderId]);

        if (results.length === 0) {
            // Might be a valid case, return empty data
            return res.status(200).json({ success: true, data: [], message: 'اطلاعاتی یافت نشد، وضعیت سفارش را بررسی کنید' });
        }
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error(`Database error fetching final products for order ${orderId}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Set Order Status to Security Checked
const setOrderSecurityChecked = async (req, res) => {
    const orderId = req.params.orderId;
    console.log(`Request received to set order ${orderId} to Security Checked`);

    if (!orderId) {
        return res.status(400).json({ success: false, error: 'Order ID parameter is required.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const query = `UPDATE xicorana.order SET orderSituation = 'Security Checked' WHERE ordId = ? AND orderSituation != 'Security Checked';`;
        const [result] = await connection.query(query, [orderId]);

        if (result.affectedRows === 0) {
            await connection.rollback(); // Rollback before checking status
            // Could be already checked, or order doesn't exist
            // Check if the order exists and is already checked to provide a more specific message
            const [checkResult] = await pool.query('SELECT orderSituation FROM xicorana.order WHERE ordId = ?', [orderId]);
            if (checkResult.length > 0 && checkResult[0].orderSituation === 'Security Checked') {
                 return res.status(409).json({ success: false, error: 'وضعیت سفارش از قبل تایید حراست شده است' }); // 409 Conflict
            } else if (checkResult.length === 0) {
                 return res.status(404).json({ success: false, error: 'سفارش با این شناسه یافت نشد' });
            }
             // Generic error if neither condition met
            return res.status(404).json({ success: false, error: 'تغییری انجام نپذیرفت، ممکن است وضعیت سفارش از قبل تعیین شده باشد یا سفارش موجود نباشد' });
        }

        await connection.commit(); // Commit the successful update
        res.status(200).json({ success: true, data: `وضغیت سفارش ${orderId} به <<تایید حراست>> تغییر کرد` });

    } catch (error) {
        if (connection) await connection.rollback(); // Rollback on error
        console.error(`Database error setting order ${orderId} to Security Checked:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    } finally {
        if (connection) connection.release(); // Always release connection
    }
};

// Check if Order is Security Checked
const isOrderSecurityChecked = async (req, res) => {
    const orderId = req.params.orderId;
    console.log(`Request received to check security status for order ${orderId}`);

    if (!orderId) {
        return res.status(400).json({ success: false, error: 'Order ID parameter is required.' });
    }

    try {
        const query = `SELECT orderSituation FROM xicorana.order WHERE ordId = ? AND orderSituation = 'Security Checked';`;
        const [results] = await pool.query(query, [orderId]);

        // Original code returned 404 with error '0' if not found, and 200 with data '1' if found.
        // Let's return a boolean for clarity.
        const isChecked = results.length > 0;
        res.status(200).json({ success: true, data: { isSecurityChecked: isChecked } });

    } catch (error) {
        console.error(`Database error checking security status for order ${orderId}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Create New Transport Record and Update Order Status
const createTransport = async (req, res) => {
    const { tpDriverName, orderId } = req.body;
    console.log(`Request received to create transport for order ${orderId} with driver ${tpDriverName}`);

    if (!tpDriverName || !orderId) {
        return res.status(400).json({ success: false, error: 'Parameters tpDriverName and orderId are required.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 1. Insert into transports table, ensuring order is 'Security Checked'
        const insertTransportQuery = `
            INSERT INTO transports (tpId, orderId, tpDriverName, tpSituation, custAddress, tpDate)
            SELECT 
                CONCAT('tp', FLOOR(RAND() * 1000000)) AS tpId,
                o.ordId AS orderId,
                ? AS tpDriverName,
                'در مسیر' AS tpSituation,
                c.custAddress AS custAddress,
                NOW() AS tpDate
            FROM xicorana.order o
            JOIN customer c ON o.custId = c.custId
            WHERE o.ordId = ?
            AND o.orderSituation = 'Security Checked';
        `;
        const [insertResult] = await connection.query(insertTransportQuery, [tpDriverName, orderId]);

        if (insertResult.affectedRows === 0) {
            await connection.rollback();
            // Check if order exists and its status
             const [checkResult] = await connection.query('SELECT orderSituation FROM xicorana.order WHERE ordId = ?', [orderId]);
             if (checkResult.length > 0 && checkResult[0].orderSituation !== 'Security Checked'){
                 return res.status(409).json({ success: false, error: 'عملیات انجام نشد. وضعیت سفارش تایید حراست نیست.'}); // 409 Conflict
             } else if (checkResult.length === 0) {
                 return res.status(404).json({ success: false, error: 'سفارش با این شناسه یافت نشد' });
             }
            // Generic error
            return res.status(400).json({ success: false, error: 'عملیات با موفقیت انجام نشد، از وضعیت تایید حراست سفارش اطلاع حاصل فرمایید' });
        }

        // 2. Update order status to 'exited'
        const updateOrderQuery = `UPDATE xicorana.order SET orderSituation = 'exited' WHERE ordId = ?;`;
        const [updateResult] = await connection.query(updateOrderQuery, [orderId]);

        if (updateResult.affectedRows === 0) {
             // This shouldn't happen if the first query succeeded, but good to check.
            console.error(`Failed to update order ${orderId} status to exited after transport creation.`);
            await connection.rollback();
            return res.status(500).json({ success: false, error: 'خطا در بروزرسانی وضعیت سفارش پس از ایجاد حمل و نقل' });
        }

        // 3. Commit transaction
        await connection.commit();

        // 4. Send SMS (outside transaction) - Consider moving to a background job later
        try {
            const getCustomerInfoQuery = `SELECT custAddress, custMPhone FROM xicorana.customer WHERE custId = (SELECT custId FROM xicorana.order WHERE ordId = ?);`;
            const [customerInfo] = await pool.query(getCustomerInfoQuery, [orderId]);

            if (customerInfo.length > 0) {
                const phoneNumber = String(customerInfo[0].custMPhone);
                const custAddress = String(customerInfo[0].custAddress);
                const smsText = `سفارش به شماره ${orderId} به مقصد ${custAddress} رهسپار شد. اطلاعات راننده به شرح زیر است:\n${tpDriverName}\nسامانه ردیابی افشان نگار آریا`;
                
                console.log("Attempting to send SMS to:", phoneNumber);
                // Replace placeholders with actual credentials/sender if needed
                const apiKey = process.env.SMS_API_KEY || '@@';
                const secretKey = process.env.SMS_SECRET_KEY || '@@';
                const sender = process.env.SMS_SENDER || '@number@';

                const axiosFullreq = `https://api.sms-webservice.com/api/V3/Send?ApiKey=${apiKey}&SecretKey=${secretKey}&Text=${encodeURIComponent(smsText)}&Sender=${sender}&Recipients=${phoneNumber}`;
                
                axios.get(axiosFullreq)
                    .then(response => console.log('SMS API Response:', response.status, response.data))
                    .catch(error => console.error('SMS API Error:', error.response ? error.response.data : error.message));
                    
                 res.status(200).json({ success: true, data: `وضعیت ارسال سفارش مشتری با موفقیت به "در مسیر" تغییر کرد` });
            } else {
                console.warn(`Could not find customer info for order ${orderId} to send SMS.`);
                 res.status(200).json({ success: true, data: `وضعیت ارسال سفارش مشتری با موفقیت به "در مسیر" تغییر کرد`, warning: 'اطلاعات مشتری برای ارسال پیامک یافت نشد' });
            }
        } catch (smsError) {
             console.error(`Error fetching customer info or sending SMS for order ${orderId}:`, smsError);
             // Send success response anyway, as the main operation succeeded
             res.status(200).json({ success: true, data: `وضعیت ارسال سفارش مشتری با موفقیت به "در مسیر" تغییر کرد`, warning: 'ارسال پیامک با مشکل مواجه شد' });
        }

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Database error during transport creation for order ${orderId}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    } finally {
        if (connection) connection.release();
    }
};

const getOrderCustomerInfo = async (req, res) => {
    const { orderId } = req.params;

    if (!orderId) {
        return res.status(400).json({ success: false, error: 'شناسه سفارش الزامی است' });
    }

    try {
        const getCustomerInfoQuery = `SELECT custAddress, custMPhone FROM xicorana.customer WHERE custId = (SELECT custId FROM xicorana.order WHERE ordId = ?);`;
        const [customerInfo] = await pool.query(getCustomerInfoQuery, [orderId]);

        if (customerInfo.length === 0) {
            return res.status(404).json({ success: false, error: 'اطلاعات مشتری برای این سفارش یافت نشد' });
        }

        const custAddress = String(customerInfo[0].custAddress);
        const custPhone = String(customerInfo[0].custMPhone);

        res.json({ 
            success: true, 
            custAddress, 
            custPhone 
        });

    } catch (error) {
        console.error('Error fetching customer info for order:', error);
        res.status(500).json({ success: false, error: 'خطا در بازیابی اطلاعات مشتری' });
    }
};

module.exports = {
    getManufacturerNames,
    getGatheredOrders,
    getSoldFinalProductsByOrder,
    setOrderSecurityChecked,
    isOrderSecurityChecked,
    createTransport,
    getOrderCustomerInfo,
}; 