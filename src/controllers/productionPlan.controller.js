const pool = require('../config/db');

// Get all Production Plan IDs
const getProductionPlanIds = async (req, res) => {
    console.log('Request received for /pp (get IDs)');

    try {
        const query = 'SELECT ppId FROM xicorana.productionplan;';
        const [results] = await pool.query(query);

        if (results.length === 0) {
            // Changed status to 200 with empty data, as 404 might imply the resource doesn't exist
            return res.status(200).json({ success: true, data: [], message: 'شماره برنامه ای یافت نشد' });
        }

        res.status(200).json({ success: true, data: results });

    } catch (error) {
        console.error('Database error fetching production plan IDs:', error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Assign a UID (wsp or ins) to a Production Plan
const assignToProductionPlan = async (req, res) => {
    const ppId = req.params.ppId;
    const { uid, ppDevice } = req.body;
    console.log(`Request received to assign UID ${uid} with device ${ppDevice} to PP ${ppId}`);

    if (!ppId || !uid || !ppDevice) {
        return res.status(400).json({ success: false, error: 'Missing required parameters: ppId, uid, ppDevice.' });
    }

    const uid_dash = uid + '-'; // Add dash as in original logic
    const itemType = uid.substring(0, 3);

    let updatePpQuery = '';
    let updateItemQuery = '';
    let itemTable = '';
    let itemIdField = '';
    let itemStatusField = ''; // e.g., wspLL or insLL
    let ppItemField = ''; // e.g., wspId or insId

    // Determine queries based on item type
    switch (itemType) {
        case 'wsp':
            itemTable = 'wireSpool';
            itemIdField = 'wspId';
            itemStatusField = 'wspLL';
            ppItemField = 'wspId';
            updatePpQuery = `
                UPDATE xicorana.productionplan 
                SET ${ppItemField} = CONCAT(IFNULL(${ppItemField}, ''), ?), ppDevice = ?
                WHERE ppId = ? AND (SELECT ${itemStatusField} FROM xicorana.${itemTable} WHERE ${itemIdField} = ?) = 'ورود';
            `;
            updateItemQuery = `UPDATE xicorana.${itemTable} SET ${itemStatusField} = 'مصرف شده' WHERE ${itemIdField} = ?;`;
            break;
        case 'ins':
            itemTable = 'insul';
            itemIdField = 'insId';
            itemStatusField = 'insLL';
            ppItemField = 'insId';
             updatePpQuery = `
                UPDATE xicorana.productionplan 
                SET ${ppItemField} = CONCAT(IFNULL(${ppItemField}, ''), ?), ppDevice = ?
                WHERE ppId = ? AND (SELECT ${itemStatusField} FROM xicorana.${itemTable} WHERE ${itemIdField} = ?) = 'ورود';
            `;
            updateItemQuery = `UPDATE xicorana.${itemTable} SET ${itemStatusField} = 'مصرف شده' WHERE ${itemIdField} = ?;`;
            break;
        default:
            return res.status(400).json({ success: false, error: 'Invalid uid prefix' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        console.log('Executing PP update query:', updatePpQuery);
        const [updatePpResult] = await connection.query(updatePpQuery, [uid_dash, ppDevice, ppId, uid]);

        if (updatePpResult.affectedRows === 0) {
            await connection.rollback(); // Rollback if PP wasn't updated
            return res.status(404).json({ success: false, error: 'محصولی به برنامه تولید اضافه نشد، از وضعیت کالای تخصیص داده شده (باید در وضعیت ورود باشد) اطمینان حاصل فرمایید' });
        }

        console.log('Executing item status update query:', updateItemQuery);
        const [updateItemResult] = await connection.query(updateItemQuery, [uid]);

        // Check if item status update was successful (though the original code didn't explicitly check this result)
        if (updateItemResult.affectedRows === 0) {
             console.warn(`Item status for ${uid} was not updated, possibly already 'مصرف شده'. Proceeding with PP assignment.`);
             // Original code didn't rollback here, so we won't either, but we'll log a warning.
             // await connection.rollback();
             // return res.status(500).json({ success: false, error: 'خطا در بروزرسانی وضعیت کالا پس از تخصیص به برنامه تولید رخ داد' });
        }

        await connection.commit(); // Commit both changes if successful
        res.status(200).json({ success: true, data: 'محصول به برنامه تولید اضافه شد' });

    } catch (error) {
        if (connection) await connection.rollback(); // Rollback on any error
        console.error(`Error assigning UID ${uid} to PP ${ppId}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    } finally {
        if (connection) connection.release(); // Always release the connection
    }
};

module.exports = {
    getProductionPlanIds,
    assignToProductionPlan,
}; 