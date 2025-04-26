# Warehouse Management API

This project provides the backend API for a warehouse management system.

## ✨ Project Structure (Post-Refactor)

This project was **recently refactored** from a single monolithic JavaScript file (~2400 lines) into a modular structure following common Express.js conventions. The goal of this refactoring was to improve maintainability, scalability, and code organization.

The main application logic now resides within the `src/` directory:

- **`src/`**: Contains all the core application code.
  - **`config/`**: Database configuration (`db.js`).
  - **`controllers/`**: Handles incoming requests, interacts with database logic (via the pool), and sends responses (e.g., `auth.controller.js`, `product.controller.js`).
  - **`middleware/`**: Contains middleware functions, such as authentication (`auth.js`).
  - **`routes/`**: Defines the API endpoints and links them to the appropriate controller functions (e.g., `auth.routes.js`, `product.routes.js`).
  - **`app.js`**: The main Express application setup file. Configures middleware and mounts the various route modules.
- **`server.js`**: Initializes and starts the Express server.
- **`.env`**: Stores environment variables (database credentials, JWT secret, etc.). *Not committed to Git.*
- **`package.json`**: Project dependencies and scripts.
- **`README.md`**: This file.

## 🚀 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <project-directory>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up the Database:**

    *   **Prerequisites:** Ensure you have a MySQL server installed and running.
    *   **Create Schema:** Use a MySQL client (like MySQL Workbench or the `mysql` command line) to connect to your server and run the schema definition file to create the necessary tables:
        ```bash
        # Example using mysql command line (replace <user>):
        mysql -u <user> -p < database/schema.sql
        ```
        *(The `schema.sql` file already contains `CREATE DATABASE IF NOT EXISTS xicorana;` and `USE xicorana;`)*
    *   **(Optional) Load Sample Data:** To populate the database with non-sensitive sample data for testing, run the sample data script:
        ```bash
        # Example using mysql command line (replace <user>):
        mysql -u <user> -p xicorana < database/sample_data.sql
        ```

4.  **Create a `.env` file:**
    Copy the `.env.example` (if provided) or create a `.env` file in the project root. Populate it with your specific environment variables, especially the database credentials (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) and a strong `JWT_SECRET`.

    ```dotenv
    NODE_ENV=development
    PORT=5000
    DB_HOST=your_db_host
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_NAME=xicorana
    # DB_CONNECTION_LIMIT=10 # Optional
    JWT_SECRET=your_very_secret_jwt_key 
    # SMS_API_KEY=your_sms_api_key # Optional for SMS features
    # SMS_SECRET_KEY=your_sms_secret_key # Optional for SMS features
    # SMS_SENDER=your_sms_sender_number # Optional for SMS features
    ```
    **Important:** Ensure `.env` is listed in your `.gitignore` file and is never committed to version control.

5.  **Run the server:**
    ```bash
    npm start 
    # Or for development with nodemon (if configured):
    # npm run dev
    ```

## 📝 API Endpoints

The API routes are defined in the `src/routes/` directory and mounted under `/api/v1` in `src/app.js`.
Refer to the individual route files for specific endpoints related to:
- Authentication (`auth.routes.js`)
- Handheld Operations (`handheld.routes.js`)
- Products & UIDs (`product.routes.js`)
- Workplaces (`workplace.routes.js`)
- Production Plans (`productionPlan.routes.js`)
- Reports (`report.routes.js`)
- Security/Herasat (`herasat.routes.js`)
- Requests (`request.routes.js`)
- Users (`user.routes.js`)

## 🔧 Development Notes (Previous Structure)

*Originally*, this project was implemented in a single JavaScript file (`warehouse-management-API/mainserver.js`) due to specific production team requirements at the time. While functional, this structure lacked the modularity and maintainability benefits of standard backend architectures.
The recent refactoring addressed these points by moving to the structure described above.

