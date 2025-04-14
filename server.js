// server.js
require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise"); // Using the promise wrapper

const app = express();
const port = process.env.API_PORT || 3001; // Use port from .env or default

// --- Database Connection Pool ---
// Use a connection pool for better performance and management
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10, // Adjust as needed
  queueLimit: 0,
});

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing for frontend requests
app.use(express.json()); // Enable parsing JSON request bodies

// --- Basic Routes ---
app.get("/", (req, res) => {
  res.send("Bookshelf API is running!");
});

// --- TODO: Add API routes for books ---
// Example: app.get('/api/books', async (req, res) => { ... });

// --- Start Server ---
// Test DB connection before starting server (optional but good practice)
pool.query("SELECT 1")
  .then(() => {
    console.log("MySQL Database connected successfully.");
    app.listen(port, () => {
      console.log(`Bookshelf API server listening on port ${port}`);
    });
  })
  .catch(error => {
     console.error("Error connecting to MySQL Database:", error);
     // Exit if DB connection fails on startup
     process.exit(1);
  });

// Export pool for potential use in other modules (e.g., route handlers)
module.exports = { pool };
