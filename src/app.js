const express = require('express');
const cors = require('cors');
const path = require('path');
// Import route files
const authRoutes = require('./routes/auth.routes');
const handheldRoutes = require('./routes/handheld.routes'); // Import handheld routes
const productRoutes = require('./routes/product.routes'); // Import product routes
const workplaceRoutes = require('./routes/workplace.routes'); // Import workplace routes
const productionPlanRoutes = require('./routes/productionPlan.routes'); // Import production plan routes
const reportRoutes = require('./routes/report.routes'); // Import report routes
const herasatRoutes = require('./routes/herasat.routes'); // Import herasat routes
const requestRoutes = require('./routes/request.routes'); // Import request routes
const userRoutes = require('./routes/user.routes'); // Import user routes
// We will add other route imports here later
// const apiRoutes = require('./routes/api');

const app = express();

// Middleware
app.use(cors()); // Configure CORS options as needed: app.use(cors({ origin: 'your-frontend-url' }));
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: false })); // for parsing application/x-www-form-urlencoded

// Serve static files (if any) - adjust the path if your public folder is elsewhere
// Assuming 'public' is in the root directory alongside 'src'
app.use(express.static(path.join(__dirname, '../public')));

// Mount Routers
app.use('/api/v1', authRoutes); // Mount auth routes under /api/v1
app.use('/api/v1', handheldRoutes); // Mount handheld routes under /api/v1
app.use('/api/v1', productRoutes); // Mount product routes under /api/v1
app.use('/api/v1', workplaceRoutes); // Mount workplace routes under /api/v1
app.use('/api/v1', productionPlanRoutes); // Mount production plan routes under /api/v1
app.use('/api/v1', reportRoutes); // Mount report routes under /api/v1
app.use('/api/v1', herasatRoutes); // Mount herasat routes under /api/v1
app.use('/api/v1', requestRoutes); // Mount request routes under /api/v1
app.use('/api/v1', userRoutes); // Mount user routes under /api/v1
// Other routers will be mounted here later

// Simple Base Route for testing
app.get('/', (req, res) => {
  res.send('Warehouse API is running!');
});

// Basic Error Handling (Add more specific error handling as needed)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app; 