require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = process.env.API_PORT || 3306;

// Database Connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Middleware
app.use(cors());
app.use(express.json());

// APIs

// GET
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

app.get("/api/books/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`Received request: GET /api/books/${id}`);
  try {
    const sql = "SELECT * FROM books WHERE id = ?";
    const params = [id];
    const [rows] = await pool.query(sql, params);

    if (rows.length === 0) {
      console.log(`Book not found for ID: ${id}`);
      res.status(404).json({ error: "Book not found" });
    } else {
      console.log(`Book found for ID: ${id}`);
      res.json(rows[0]);
    }
  } catch (error) {
    console.error(`Error fetching book with ID ${id}:`, error);
    res.status(500).json({ error: "Error fetching book from database" });
  }
});


// POST
app.post("/api/books", async (req, res) => {
  console.log("Received request: POST /api/books");
  const { title, author, listType, genre, yearPublished, rating, notes } = req.body;

  if (!title || !author || !listType) {
    return res.status(400).json({ error: "Missing required fields: title, author, and listType are required." });
  }
  if (!["owned", "want"].includes(listType)) {
      return res.status(400).json({ error: "Invalid listType. Must be 'owned' or 'want'." });
  }
  if (rating !== null && rating !== undefined && (typeof rating !== "number" || rating < 1 || rating > 5)) {
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
      throw new Error("Insert query affected 0 rows.");
    }
  } catch (error) {
    console.error("Error adding book:", error);
    res.status(500).json({ error: "Error adding book to database" });
  }
});

// PUT
app.put("/api/books/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`Received request: PUT /api/books/${id}`);
  const { title, author, listType, genre, yearPublished, rating, notes } = req.body;

  if (!title || !author || !listType) {
    return res.status(400).json({ error: "Missing required fields: title, author, and listType are required." });
  }
  if (!["owned", "want"].includes(listType)) {
      return res.status(400).json({ error: "Invalid listType. Must be 'owned' or 'want'." });
  }
  if (rating !== null && rating !== undefined && (typeof rating !== "number" || rating < 1 || rating > 5)) {
      return res.status(400).json({ error: "Invalid rating. Must be a number between 1 and 5." });
  }

  const updateSql = `
    UPDATE books SET
      title = ?, author = ?, genre = ?, yearPublished = ?,
      rating = ?, notes = ?, listType = ?
    WHERE id = ?
  `;
  const params = [
    title, author, genre || null, yearPublished || null,
    rating || null, notes || null, listType, id
  ];

  try {
    const [result] = await pool.query(updateSql, params);
    if (result.affectedRows === 0) {
      console.log(`Book not found for update with ID: ${id}`);
      return res.status(404).json({ error: "Book not found" });
    }

    const [updatedBookRows] = await pool.query("SELECT * FROM books WHERE id = ?", [id]);
    if (updatedBookRows.length === 0) {
        console.error(`Failed to fetch updated book after update for ID: ${id}`);
        return res.status(500).json({ error: "Failed to retrieve updated book data." });
    }
    console.log("Book updated successfully:", id);
    res.json(updatedBookRows[0]);

  } catch (error) {
    console.error(`Error updating book with ID ${id}:`, error);
    res.status(500).json({ error: "Error updating book in database" });
  }
});

// DELETE
app.delete("/api/books/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`Received request: DELETE /api/books/${id}`);

  const sql = "DELETE FROM books WHERE id = ?";
  const params = [id];

  try {
    const [result] = await pool.query(sql, params);
    console.log("Delete result:", result);

    if (result.affectedRows === 0) {
      console.log(`Book not found for delete with ID: ${id}`);
      return res.status(404).json({ error: "Book not found" });
    }

    console.log("Book deleted successfully:", id);
    res.status(204).send();

  } catch (error) {
    console.error(`Error deleting book with ID ${id}:`, error);
    res.status(500).json({ error: "Error deleting book from database" });
  }
});


// Root Route
app.get("/", (req, res) => {
  res.send("Bookshelf API is running!");
});

// Start the server
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
