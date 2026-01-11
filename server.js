const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// API Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/lists', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lists ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lists' });
  }
});

app.post('/api/lists', async (req, res) => {
  try {
    const result = await pool.query('INSERT INTO lists (name) VALUES ($1) RETURNING *', [req.body.name]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create list' });
  }
});

app.put('/api/lists/:id', async (req, res) => {
  try {
    const result = await pool.query('UPDATE lists SET name = $1 WHERE id = $2 RETURNING *', [req.body.name, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update list' });
  }
});

app.delete('/api/lists/:id', async (req, res) => {
  try {
    await pool.query('UPDATE tasks SET list_id = (SELECT id FROM lists WHERE name = $1 LIMIT 1) WHERE list_id = $2', ['Personal', req.params.id]);
    await pool.query('DELETE FROM lists WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete list' });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT t.*, l.name as list_name FROM tasks t LEFT JOIN lists l ON t.list_id = l.id ORDER BY t.created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, list_id, status, priority, timeframe, completed } = req.body;
    const result = await pool.query(
      'INSERT INTO tasks (title, list_id, status, priority, timeframe, completed) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, list_id, status || 'not-started', priority || 'Tier 2', timeframe || 'today', completed || false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { title, status, priority, timeframe, completed } = req.body;
    const result = await pool.query(
      'UPDATE tasks SET title = COALESCE($1, title), status = COALESCE($2, status), priority = COALESCE($3, priority), timeframe = COALESCE($4, timeframe), completed = COALESCE($5, completed) WHERE id = $6 RETURNING *',
      [title, status, priority, timeframe, completed, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM notes WHERE task_id = $1', [req.params.id]);
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

app.get('/api/tasks/:taskId/notes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notes WHERE task_id = $1 ORDER BY created_at ASC', [req.params.taskId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const result = await pool.query('INSERT INTO notes (task_id, text, completed) VALUES ($1, $2, $3) RETURNING *', 
      [req.body.task_id, req.body.text, req.body.completed || false]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  try {
    const result = await pool.query('UPDATE notes SET text = COALESCE($1, text), completed = COALESCE($2, completed) WHERE id = $3 RETURNING *', 
      [req.body.text, req.body.completed, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update note' });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM notes WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => console.log(`Server running on port ${port}`));
