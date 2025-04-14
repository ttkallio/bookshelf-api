// db_init.js
require("dotenv").config();
const mysql = require("mysql2/promise");

const createTableQuery = `
CREATE TABLE IF NOT EXISTS books (
    id VARCHAR(36) PRIMARY KEY, -- Using VARCHAR for potential UUIDs
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    yearPublished INT,
    rating INT,
    notes TEXT,
    listType ENUM('owned', 'want') NOT NULL,
    dateAdded TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
// Note: VARCHAR(36) is suitable for UUIDs. If using auto-increment INT, change to:
// id INT AUTO_INCREMENT PRIMARY KEY,

async function initializeDatabase() {
  let connection;
  try {
    // Create a single connection for initialization
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });

    console.log("Connected to MySQL database for initialization.");

    // Execute the CREATE TABLE query
    await connection.query(createTableQuery);
    console.log("Table 'books' checked/created successfully.");

  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    // Ensure the connection is closed
    if (connection) {
      await connection.end();
      console.log("Initialization connection closed.");
    }
  }
}

// Run the initialization function
initializeDatabase();
