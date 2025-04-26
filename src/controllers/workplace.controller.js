const pool = require('../config/db');

// Get workplace details by ID
const getWorkplaceById = async (req, res) => {
    const wpId = req.params.wpId;
    console.log(`Request received for /workplace/${wpId}`);

    if (!wpId) {
        return res.status(400).json({ success: false, error: 'Workplace ID (wpId) parameter is required.' });
    }

    try {
        const query = `
            SELECT wpName, wpType, wpAddress, wpPhoneNumber 
            FROM xicorana.workplace 
            WHERE wpId = ?;
        `;
        const [results] = await pool.query(query, [wpId]);

        if (results.length === 0) {
            return res.status(404).json({ success: false, error: 'اسم مکان کار یافت نشد' });
        }

        res.status(200).json({ success: true, data: results[0] }); // Return the single object

    } catch (error) {
        console.error(`Database error fetching workplace ${wpId}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Get workplace details by Name (reverse lookup)
const getWorkplaceByName = async (req, res) => {
    const wpName = req.params.wpName;
    console.log(`Request received for /workplace/reverse/${wpName}`);

     if (!wpName) {
        return res.status(400).json({ success: false, error: 'Workplace Name (wpName) parameter is required.' });
    }

    try {
        const query = `
            SELECT wpId, wpName, wpType, wpAddress, wpPhoneNumber 
            FROM xicorana.workplace 
            WHERE wpName = ?;
        `;
        const [results] = await pool.query(query, [wpName]);

        if (results.length === 0) {
            return res.status(404).json({ success: false, error: 'مکان کار یافت نشد' });
        }

        res.status(200).json({ success: true, data: results[0] }); // Return the single object

    } catch (error) {
        console.error(`Database error fetching workplace by name ${wpName}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Get all workplaces
const getAllWorkplaces = async (req, res) => {
    console.log('Request received for /workplace (all)');

    try {
        const query = `
            SELECT wpId, wpName, wpType, wpAddress, wpPhoneNumber 
            FROM xicorana.workplace;
        `;
        const [results] = await pool.query(query);

        if (results.length === 0) {
             // It's okay if there are no workplaces, return empty array
            return res.status(200).json({ success: true, data: [] });
        }

        res.status(200).json({ success: true, data: results });

    } catch (error) {
        console.error('Database error fetching all workplaces:', error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};


module.exports = {
    getWorkplaceById,
    getWorkplaceByName,
    getAllWorkplaces,
}; 