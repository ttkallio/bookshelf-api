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

// GET /api/books/:id - Retrieve a single book by ID
app.get("/api/books/:id", async (req, res) => {
  // Extract the book ID from the route parameters
  const { id } = req.params;
  console.log(`Received request: GET /api/books/${id}`);

  // Basic validation for ID format if needed (e.g., check if it's a valid UUID)
  // if (!isValidUUID(id)) { // Assuming isValidUUID function exists
  //   return res.status(400).json({ error: "Invalid book ID format." });
  // }

  try {
    // SQL query to select a book by its ID - use placeholder
    const sql = "SELECT * FROM books WHERE id = ?";
    const params = [id];

    // Execute the query
    const [rows] = await pool.query(sql, params);

    // Check if a book was found
    if (rows.length === 0) {
      // If no rows returned, send a 404 Not Found response
      console.log(`Book not found for ID: ${id}`);
      res.status(404).json({ error: "Book not found" });
    } else {
      // If a book was found, send it back as JSON
      console.log(`Book found for ID: ${id}`);
      res.json(rows[0]); // Send the first (and only) row
    }
  } catch (error) {
    console.error(`Error fetching book with ID ${id}:`, error);
    res.status(500).json({ error: "Error fetching book from database" });
  }
});


// POST /api/books - Add a new book
app.post("/api/books", async (req, res) => {
  console.log("Received request: POST /api/books");
  const { title, author, listType, genre, yearPublished, rating, notes } = req.body;

  // Validation
  if (!title || !author || !listType) {
    console.error("Validation Failed: Missing required fields (title, author, listType)");
    return res.status(400).json({ error: "Missing required fields: title, author, and listType are required." });
  }
  if (!["owned", "want"].includes(listType)) {
      console.error(`Validation Failed: Invalid listType: ${listType}`);
      return res.status(400).json({ error: "Invalid listType. Must be 'owned' or 'want'." });
  }
  if (rating !== null && rating !== undefined && (typeof rating !== "number" || rating < 1 || rating > 5)) {
      console.error(`Validation Failed: Invalid rating: ${rating}`);
      return res.status(400).json({ error: "Invalid rating. Must be a number between 1 and 5." });
  }

  const newBookId = uuidv4();
  const dateAdded = new Date();
  const insertSql = `
    INSERT INTO books
      (id, title, author, genre, yearPublished, rating, notes, listType, dateAdded)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    newBookId, title, author, genre || null, yearPublished || null,
    rating || null, notes || null, listType, dateAdded
  ];

  try {
    const [result] = await pool.query(insertSql, params);
    if (result.affectedRows === 1) {
      const newBook = {
        id: newBookId, title, author, genre: genre || null,
        yearPublished: yearPublished || null, rating: rating || null,
        notes: notes || null, listType, dateAdded
      };
      console.log("Book added successfully:", newBookId);
      res.status(201).json(newBook);
    } else {
      console.error("Error adding book: Insert query affected 0 rows.");
      res.status(500).json({ error: "Failed to add book to database." });
    }
  } catch (error) {
    console.error("Error adding book:", error);
    res.status(500).json({ error: "Error adding book to database" });
  }
});


// --- TODO: Add other API routes for books (PUT, DELETE) ---
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
