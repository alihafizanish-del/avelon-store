const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(express.json());

// Serve static frontend files if needed
app.use(express.static(path.join(__dirname, '../frontend')));

function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { products: [], catalogs: [], couriers: [], orders: [], settings: {} };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// API Endpoints
app.get('/api/store', (req, res) => {
  res.json(readDB());
});

app.post('/api/store', (req, res) => {
  const db = req.body;
  writeDB(db);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`AVELON Backend Server running on http://localhost:${PORT}`);
});