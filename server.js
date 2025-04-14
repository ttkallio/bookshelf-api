// server.js
require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise"); // Using the promise wrapper
const { v4: uuidv4 } = require("uuid"); // Import UUID generator

const app = express();
const port = process.env.API_PORT || 3001; // Use port from .env or default

// --- Database Connection Pool ---
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Ensure dates are handled correctly, especially if your DB/server are in different timezones
  // timezone: "+00:00", // Example: UTC
});

// --- Middleware ---
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable parsing JSON request bodies

// --- API Routes ---

// GET /api/books - Retrieve all books
app.get("/api/books", async (req, res) => {
  console.log("Received request: GET /api/books");
  try {
    const [rows] = await pool.query("SELECT * FROM books ORDER BY dateAdded DESC");
    console.log(`Found ${rows.length} books.`);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ error: "Error fetching books from database" });
  }
});

// POST /api/books - Add a new book
app.post("/api/books", async (req, res) => {
  console.log("Received request: POST /api/books");
  // Extract book data from request body
  const { title, author, listType, genre, yearPublished, rating, notes } = req.body;

  // --- Basic Input Validation ---
  if (!title || !author || !listType) {
    console.error("Validation Failed: Missing required fields (title, author, listType)");
    return res.status(400).json({ error: "Missing required fields: title, author, and listType are required." });
  }
  // Add more specific validation if needed (e.g., listType is 'owned' or 'want', rating is 1-5)
  if (!["owned", "want"].includes(listType)) {
      console.error(`Validation Failed: Invalid listType: ${listType}`);
      return res.status(400).json({ error: "Invalid listType. Must be 'owned' or 'want'." });
  }
  if (rating !== null && rating !== undefined && (typeof rating !== "number" || rating < 1 || rating > 5)) {
      console.error(`Validation Failed: Invalid rating: ${rating}`);
      return res.status(400).json({ error: "Invalid rating. Must be a number between 1 and 5." });
  }
  // --- End Validation ---

  // Generate a unique ID for the new book
  const newBookId = uuidv4();
  // Get current timestamp for dateAdded (MySQL handles this via DEFAULT, but good practice)
  const dateAdded = new Date();

  // SQL query to insert the new book - using placeholders (?) for security
  const insertSql = `
    INSERT INTO books
      (id, title, author, genre, yearPublished, rating, notes, listType, dateAdded)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  // Parameters array matching the placeholders
  const params = [
    newBookId,
    title,
    author,
    genre || null, // Use null for optional fields if not provided
    yearPublished || null,
    rating || null,
    notes || null,
    listType,
    dateAdded // Pass the generated timestamp
  ];

  try {
    // Execute the insert query
    const [result] = await pool.query(insertSql, params);
    console.log("Insert result:", result);

    // Check if the insert was successful (1 row affected)
    if (result.affectedRows === 1) {
      // Construct the newly created book object to send back
      // (combining generated ID/date with received data)
      const newBook = {
        id: newBookId,
        title,
        author,
        genre: genre || null,
        yearPublished: yearPublished || null,
        rating: rating || null,
        notes: notes || null,
        listType,
        dateAdded // Use the JS Date object here
      };
      console.log("Book added successfully:", newBookId);
      // Send 201 Created status and the new book object
      res.status(201).json(newBook);
    } else {
      // Should not happen with valid SQL, but handle just in case
      console.error("Error adding book: Insert query affected 0 rows.");
      res.status(500).json({ error: "Failed to add book to database." });
    }
  } catch (error) {
    console.error("Error adding book:", error);
    res.status(500).json({ error: "Error adding book to database" });
  }
});


// --- TODO: Add other API routes for books (GET by ID, PUT, DELETE) ---
// Example: app.get('/api/books/:id', async (req, res) => { ... });
// Example: app.put('/api/books/:id', async (req, res) => { ... });
// Example: app.delete('/api/books/:id', async (req, res) => { ... });


// --- Basic Root Route ---
app.get("/", (req, res) => {
  res.send("Bookshelf API is running!");
});

// --- Start Server ---
pool.query("SELECT 1")
  .then(() => {
    console.log("MySQL Database connected successfully.");
    app.listen(port, () => {
      console.log(`Bookshelf API server listening on port ${port}`);
    });
  })
  .catch(error => {
     console.error("Error connecting to MySQL Database:", error);
     process.exit(1);
  });

