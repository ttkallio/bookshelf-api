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
  // Add timezone setting if needed to ensure dates are handled consistently
  // timezone: "+00:00",
});

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing for frontend requests
app.use(express.json()); // Enable parsing JSON request bodies

// --- API Routes ---

// GET /api/books - Retrieve all books
app.get("/api/books", async (req, res) => {
  console.log("Received request: GET /api/books");
  try {
    // Execute query directly on the pool
    // Fetch all columns (*) from the books table
    // Order by dateAdded descending so newest books appear first
    const [rows] = await pool.query("SELECT * FROM books ORDER BY dateAdded DESC");

    console.log(`Found ${rows.length} books.`);
    // Send the retrieved rows back as a JSON response
    res.json(rows);
  } catch (error) {
    // Log the error to the console for debugging
    console.error("Error fetching books:", error);
    // Send a generic server error response
    res.status(500).json({ error: "Error fetching books from database" });
  }
});

// --- TODO: Add other API routes for books (POST, GET by ID, PUT, DELETE) ---
// Example: app.post('/api/books', async (req, res) => { ... });
// Example: app.get('/api/books/:id', async (req, res) => { ... });
// Example: app.put('/api/books/:id', async (req, res) => { ... });
// Example: app.delete('/api/books/:id', async (req, res) => { ... });


// --- Basic Root Route ---
app.get("/", (req, res) => {
  res.send("Bookshelf API is running!");
});

// --- Start Server ---
// Test DB connection before starting server
pool.query("SELECT 1")
  .then(() => {
    console.log("MySQL Database connected successfully.");
    app.listen(port, () => {
      console.log(`Bookshelf API server listening on port ${port}`);
    });
  })
  .catch(error => {
     console.error("Error connecting to MySQL Database:", error);
     process.exit(1); // Exit if DB connection fails on startup
  });

// Export pool for potential use in other modules (optional for this structure)
// module.exports = { pool }; // Not strictly needed if all routes are in this file
