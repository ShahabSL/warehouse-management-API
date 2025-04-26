const pool = require('../config/db');

// Get all product names and IDs
const getProductNames = async (req, res) => {
    console.log('Request received for /prod/name');
    try {
        const [results] = await pool.query('SELECT prodName, prodId FROM xicorana.product;');
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, error: 'محصولی یافت نشد' });
        }
        
        res.status(200).json({ success: true, data: results });

    } catch (error) {
        console.error('Database error fetching product names:', error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Get high-demand product names
const getHighDemandProducts = async (req, res) => {
     console.log('Request received for /prod/highdemand');
    try {
        const [results] = await pool.query('SELECT prodName FROM xicorana.highdemand;');
        
        if (results.length === 0) {
            // Changed to 200 with empty data as 404 might be misleading if table exists but is empty
            return res.status(200).json({ success: true, data: [], message: 'کالای پر استفاده ای یافت نشد' }); 
        }
        
        res.status(200).json({ success: true, data: results });

    } catch (error) {
        console.error('Database error fetching high-demand products:', error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Get details for a specific UID (wsp, ins, car, fip)
const getUidDetails = async (req, res) => {
    const uid = req.params.uid;
    console.log(`Request received for /uidDetails/${uid}`);

    if (!uid) {
         return res.status(400).json({ success: false, error: 'UID parameter is required.' });
    }

    const itemType = uid.substring(0, 3);
    let queryToRun = '';
    let tableName = '';
    let idField = '';

    // Determine the correct table and query based on the UID prefix
    switch (itemType) {
        case 'wsp':
            tableName = 'wirespool'; idField = 'wspId';
            queryToRun = `SELECT * FROM xicorana.${tableName} WHERE ${idField} = ?;`;
            break;
        case 'ins':
            tableName = 'insul'; idField = 'insId';
            queryToRun = `SELECT * FROM xicorana.${tableName} WHERE ${idField} = ?;`;
            break;
        case 'car':
            tableName = 'cart'; idField = 'cartId';
            queryToRun = `SELECT * FROM xicorana.${tableName} WHERE ${idField} = ?;`;
            break;
        case 'fip':
            tableName = 'finalproduct'; idField = 'fpId';
            queryToRun = `SELECT * FROM xicorana.${tableName} WHERE ${idField} = ?;`;
            break;
        default:
            return res.status(400).json({ success: false, error: 'Invalid uid prefix' });
    }

    try {
        console.log('Executing UID details query:', queryToRun);
        const [results] = await pool.query(queryToRun, [uid]);

        if (results.length === 0) { 
            // Use length check for SELECT results, not affectedRows
            return res.status(404).json({ success: false, error: 'اطلاعاتی از چنین محصولی یافت نشد. از درست بودن شناسه اطلاع حاصل فرمایید.' });
        } else {
            res.status(200).json({ success: true, data: results[0] }); // Return the single object
        }

    } catch (error) {
        console.error(`Error fetching details for UID ${uid}:`, error);
        res.status(500).json({ success: false, error: `خطای داخلی سرور: ${String(error.message)}` });
    }
};

module.exports = {
    getProductNames,
    getHighDemandProducts,
    getUidDetails,
}; 