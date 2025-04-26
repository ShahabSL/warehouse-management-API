const pool = require('../config/db');

// Handheld Report Query
const queryHandheldReport = async (req, res) => {
    let { wpId, date, sector, material, color, type } = req.query;
    console.log('Received handheld report query with params:', req.query);

    // Prepare parameters with wildcard defaults and LIKE syntax
    wpId = wpId ? `${wpId}%` : '%';
    date = date ? `${date}%` : '%';
    sector = sector ? `${sector}%` : '%';
    material = material ? `${material}%` : '%';
    color = color ? `${color}%` : '%';
    type = type ? `${type}%` : '%'; // Assuming 'type' relates to finalproduct

    // Flags to determine which results to combine based on provided filters
    const materialProvided = req.query.material !== undefined;
    const colorProvided = req.query.color !== undefined;
    const typeProvided = req.query.type !== undefined; // Likely for final products

    try {
        let finalResults = [];
        let totalLength = 0;

        // Fetch Wire Spools if no color/type filter or if material filter is provided
        if ((!colorProvided && !typeProvided) || materialProvided) {
            const wspQuery = `SELECT * FROM xicorana.wirespool WHERE wpId LIKE ? AND wspDate LIKE ? AND WspSector LIKE ? AND wspLL='ورود' AND wspMaterial LIKE ?;`;
            const [wspResults] = await pool.query(wspQuery, [wpId, date, sector, material]);
            if (wspResults.length > 0) {
                finalResults.push(...wspResults.map(item => ({ ...item, itemType: 'wirespool' }))); // Add type indicator
                totalLength += wspResults.length;
            }
        }

        // Fetch Insulation if no material/type filter or if color filter is provided
        if ((!materialProvided && !typeProvided) || colorProvided) {
            const insQuery = `SELECT * FROM xicorana.insul WHERE wpId LIKE ? AND insEntryDate LIKE ? AND insSector LIKE ? AND insLL='ورود' AND insColor LIKE ?;`;
            const [insResults] = await pool.query(insQuery, [wpId, date, sector, color]);
             if (insResults.length > 0) {
                finalResults.push(...insResults.map(item => ({ ...item, itemType: 'insulation' }))); // Add type indicator
                totalLength += insResults.length;
            }
        }

        // Fetch Final Products if no material/color filter or if type filter is provided
        // Note: Original query for finalproduct didn't use date filter. Adding fpDate might be useful.
        if ((!materialProvided && !colorProvided) || typeProvided) {
            const fipQuery = `SELECT * FROM xicorana.finalproduct WHERE wpId LIKE ? AND fpSector LIKE ? AND fpLL='ورود' AND fpType LIKE ?;`; 
            const [fipResults] = await pool.query(fipQuery, [wpId, sector, type]);
            if (fipResults.length > 0) {
                finalResults.push(...fipResults.map(item => ({ ...item, itemType: 'finalproduct' }))); // Add type indicator
                totalLength += fipResults.length;
            }
        }

        if (totalLength === 0) {
            return res.status(404).json({ success: false, error: 'کالایی یافت نشد' });
        }

        res.status(200).json({ success: true, data: finalResults });

    } catch (error) {
        console.error('Database error during handheld report query:', error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Admin Report - Generic Item Search by Workplace
const getAdminReportByWorkplace = async (req, res) => {
    const { searchType, wpId } = req.query;
    console.log(`Admin report request: Type=${searchType}, Workplace=${wpId}`);

    if (!searchType || !wpId) {
        return res.status(400).json({ success: false, error: 'Parameters searchType and wpId are required.' });
    }

    let queryToRun = '';
    let tableName = '';
    let idField = ''; // Not strictly needed for SELECT *, but good practice

    switch (searchType) {
        case 'wsp': tableName = 'wirespool'; idField = 'wspId'; break;
        case 'ins': tableName = 'insul'; idField = 'insId'; break;
        case 'car': tableName = 'cart'; idField = 'cartId'; break;
        case 'fip': tableName = 'finalproduct'; idField = 'fpId'; break;
        default:
            return res.status(400).json({ success: false, error: 'Invalid searchType' });
    }

    queryToRun = `SELECT * FROM xicorana.${tableName} WHERE wpId = ?;`;

    try {
        console.log('Executing Admin Report query:', queryToRun);
        const [results] = await pool.query(queryToRun, [wpId]);

        // Original code checked affectedRows which is for UPDATE/DELETE/INSERT.
        // Check length for SELECT.
        if (results.length === 0) {
             // Return 200 with empty data instead of 404
            return res.status(200).json({ success: true, data: [], message: 'مقداری یافت نشد از درست بودن مکان کار اطمینان حاصل نمایید' });
        } else {
            res.status(200).json({ success: true, data: results });
        }

    } catch (error) {
        console.error(`Error fetching admin report for ${searchType} at ${wpId}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Admin Report - Production Plans by Date Range
const getAdminReportProductionPlansByDate = async (req, res) => {
    const { startDate, endDate } = req.query;
    console.log(`Admin report PP request: Start=${startDate}, End=${endDate}`);

    if (!startDate || !endDate) {
        return res.status(400).json({ success: false, error: 'Parameters startDate and endDate are required.' });
    }

    try {
        const query = `SELECT * FROM xicorana.productionplan WHERE ppMFG BETWEEN ? AND ? ORDER BY ppMFG DESC;`;
        const [results] = await pool.query(query, [startDate, endDate]);

        if (results.length === 0) {
            return res.status(200).json({ success: true, data: [], message: 'برنامه تولیدی یافت نشد' });
        }

        res.status(200).json({ success: true, data: results });

    } catch (error) {
        console.error(`Error fetching admin report for PP between ${startDate} and ${endDate}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Admin Report - Production Plans (Default Days Before)
const getAdminReportProductionPlansDefault = async (req, res) => {
    const { daysBefore } = req.query;
    console.log(`Admin report PP default request: DaysBefore=${daysBefore}`);

    if (!daysBefore || isNaN(parseInt(daysBefore))) {
        return res.status(400).json({ success: false, error: 'Parameter daysBefore (numeric) is required.' });
    }

    try {
        const query = `SELECT * FROM xicorana.productionplan WHERE ppMFG BETWEEN DATE_SUB(CURDATE(), INTERVAL ? DAY) AND NOW() ORDER BY ppMFG DESC;`;
        const [results] = await pool.query(query, [parseInt(daysBefore)]);

        // Empty result is okay
        res.status(200).json({ success: true, data: results });

    } catch (error) {
        console.error(`Error fetching default admin report for PP (${daysBefore} days):`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Admin Report - Default Item Search (Last 7 Days)
const getAdminReportItemsDefault = async (req, res) => {
    const { searchType } = req.query;
    console.log(`Admin report default items request: Type=${searchType}`);

    if (!searchType) {
        return res.status(400).json({ success: false, error: 'Parameter searchType is required.' });
    }

    let queryToRun = '';
    const intervalDays = 7; // Default interval

    switch (searchType) {
        case 'wsp':
            queryToRun = `SELECT * FROM xicorana.wirespool WHERE wspDate BETWEEN DATE_SUB(CURDATE(), INTERVAL ? DAY) AND NOW() ORDER BY wspDate DESC;`;
            break;
        case 'ins':
            queryToRun = `SELECT * FROM xicorana.insul WHERE insEntryDate BETWEEN DATE_SUB(CURDATE(), INTERVAL ? DAY) AND NOW() ORDER BY insEntryDate DESC;`;
            break;
        case 'car':
            queryToRun = `SELECT * FROM xicorana.cart WHERE cartMFG BETWEEN DATE_SUB(CURDATE(), INTERVAL ? DAY) AND NOW() ORDER BY cartMFG DESC;`;
            break;
        case 'fip': // Original code had limit 10, keeping it but maybe date filter is better?
            queryToRun = `SELECT * FROM xicorana.finalproduct ORDER BY fpDate DESC LIMIT 10;`; // Assuming fpDate exists
            break;
        default:
            return res.status(400).json({ success: false, error: 'Invalid searchType' });
    }

    try {
        console.log('Executing Admin Default Report query:', queryToRun);
        // Only pass intervalDays if the query includes a placeholder for it
        const queryParams = queryToRun.includes('?') ? [intervalDays] : [];
        const [results] = await pool.query(queryToRun, queryParams);

        // Empty result is okay
        res.status(200).json({ success: true, data: results });

    } catch (error) {
        console.error(`Error fetching default admin report for ${searchType}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Helper function for counter queries
const getCount = async (res, query, queryDesc) => {
    try {
        console.log(`Executing count query: ${queryDesc}`);
        const [results] = await pool.query(query);
        // Ensure we return 0 if the count is null (no rows matched)
        const count = results[0]?.counted ?? 0;
        res.status(200).json({ success: true, data: { count } }); // Return object with count property
    } catch (error) {
        console.error(`Error executing count query (${queryDesc}):`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Admin Report - Order Submitted Counter
const getOrderSubmittedCount = async (req, res) => {
    await getCount(res, `SELECT COUNT(ordId) AS counted FROM xicorana.order WHERE orderSituation='submitted';`, 'Order Submitted Count');
};

// Admin Report - Order Gathered Counter
const getOrderGatheredCount = async (req, res) => {
    await getCount(res, `SELECT COUNT(ordId) AS counted FROM xicorana.order WHERE orderSituation='Gathered';`, 'Order Gathered Count');
};

// Admin Report - Order Exited Counter (Last Week)
const getOrderExitedCountLastWeek = async (req, res) => {
    await getCount(res, `SELECT COUNT(ordId) AS counted FROM xicorana.order WHERE orderSituation = 'exited' AND orderDate >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK);`, 'Order Exited Count (Last Week)');
};

// Admin Report - Cart Length Sum (Last Week)
const getCartLengthSumLastWeek = async (req, res) => {
    console.log('Admin report cart length sum request (last week)');
    try {
        const query = `SELECT SUM(cartLenght) AS totalLength FROM xicorana.cart WHERE cartMFG >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK);`;
        const [results] = await pool.query(query);
        const totalLength = results[0]?.totalLength ?? 0; // Default to 0 if sum is null
        res.status(200).json({ success: true, data: { totalLength } }); // Return object
    } catch (error) {
        console.error('Error fetching cart length sum (last week):', error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Admin Report - Warehouse Stock Counts by wpId
const getWarehouseStock = async (req, res) => {
    let { wpId } = req.query;
    wpId = wpId || 'wp1'; // Default to wp1 if not provided
    console.log(`Admin report warehouse stock request: wpId=${wpId}`);

    try {
        const query = `
            SELECT 
                (SELECT COUNT(wspId) FROM xicorana.wirespool WHERE wpId = ? AND wspLL = 'ورود') AS wireSpoolCount,
                (SELECT COUNT(insId) FROM xicorana.insul WHERE wpId = ? AND insLL = 'ورود') AS insulCount,
                (SELECT COUNT(cartId) FROM xicorana.cart WHERE wpId = ? AND cartLL = 'ورود') AS cartCount,
                (SELECT COUNT(fpId) FROM xicorana.finalproduct WHERE wpId = ? AND fpLL = 'ورود') AS finalProductCount; 
        `; // Added finalProduct and LL='ورود' check
        const [results] = await pool.query(query, [wpId, wpId, wpId, wpId]);
        res.status(200).json({ success: true, data: results[0] }); // Returns object with counts
    } catch (error) {
        console.error(`Error fetching warehouse stock for ${wpId}:`, error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Admin Report - Items without QC
const getNoQCCounts = async (req, res) => {
    console.log('Admin report No QC counts request');
    try {
        const query = `
            SELECT 
                (SELECT COUNT(wspId) FROM xicorana.wirespool WHERE wspQC = '0') AS wireSpoolCount,
                (SELECT COUNT(insId) FROM xicorana.insul WHERE insQC = '0') AS insulCount,
                (SELECT COUNT(cartId) FROM xicorana.cart WHERE cartQc = '0') AS cartCount; 
        `; // Assuming finalproduct always has QC or doesn't have a QC field
        const [results] = await pool.query(query);
        res.status(200).json({ success: true, data: results[0] }); // Returns object with counts
    } catch (error) {
        console.error('Error fetching No QC counts:', error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Admin Report - Last 5 Orders
const getLast5Orders = async (req, res) => {
    console.log('Admin report last 5 orders request');
    try {
        const query = `SELECT * FROM xicorana.order ORDER BY orderDate DESC LIMIT 5;`;
        const [results] = await pool.query(query);
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error('Error fetching last 5 orders:', error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Admin Report - Last 5 Exited Orders
const getLast5ExitedOrders = async (req, res) => {
    console.log('Admin report last 5 exited orders request');
    try {
        const query = `SELECT * FROM xicorana.order WHERE orderSituation = 'exited' ORDER BY orderDate DESC LIMIT 5;`;
        const [results] = await pool.query(query);
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error('Error fetching last 5 exited orders:', error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

// Admin Report - High Demand Product Chart Data
const getHighDemandChartData = async (req, res) => {
    console.log('Admin report high demand chart data request');
    try {
        const query = `
            SELECT 
                p.prodName,
                SUM(c.contCount) AS totalCount
            FROM 
                xicorana.contain c
            JOIN 
                xicorana.product p ON c.prodId = p.prodId
            GROUP BY 
                c.prodId, p.prodName
             ORDER BY totalCount DESC; 
        `; // Added GROUP BY p.prodName and ORDER BY
        const [results] = await pool.query(query);
        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error('Error fetching high demand chart data:', error);
        res.status(500).json({ success: false, error: `خطای پایگاه داده: ${String(error.message)}` });
    }
};

module.exports = {
    queryHandheldReport,
    getAdminReportByWorkplace,
    getAdminReportProductionPlansByDate,
    getAdminReportProductionPlansDefault,
    getAdminReportItemsDefault,
    getOrderSubmittedCount,
    getOrderGatheredCount,
    getOrderExitedCountLastWeek,
    getCartLengthSumLastWeek,
    getWarehouseStock,
    getNoQCCounts,
    getLast5Orders,
    getLast5ExitedOrders,
    getHighDemandChartData,
}; 