const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// PostgreSQL database connection pool
const pool = new Pool({
  user: 'postgres',     // Adjust these based on your Postgres setup
  host: 'localhost',
  database: 'xss_demo',
  password: 'bazepodataka', // Replace with your PostgreSQL password
  port: 5432,
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));

// Serve static HTML files
app.use(express.static('views'));

// Route to display comments with potential Stored XSS vulnerability
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM comments');
    const comments = result.rows.map(row => row.content).join('<br>');

    // Render the page with comments directly (no sanitization)
    res.send(`
      <h1>XSS Demo</h1>
      <form action="/add_comment" method="POST">
        <input type="text" name="comment" placeholder="Add a comment">
        <button type="submit">Submit</button>
      </form>
      <h2>Comments</h2>
      <div>${comments}</div>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving comments');
  }
});

// Route to add a comment (Stored XSS vulnerability)
app.post('/add_comment', async (req, res) => {
  const { comment } = req.body;

  try {
    await pool.query('INSERT INTO comments (content) VALUES ($1)', [comment]);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding comment');
  }
});

// Route with a Reflected XSS vulnerability
app.get('/search', (req, res) => {
  const query = req.query.query || '';

  // Reflects the query back without sanitization (vulnerable to XSS)
  res.send(`
    <h1>Search</h1>
    <form action="/search" method="GET">
      <input type="text" name="query" placeholder="Search" value="${query}">
      <button type="submit">Search</button>
    </form>
    <p>Search results for: ${query}</p>
  `);
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
