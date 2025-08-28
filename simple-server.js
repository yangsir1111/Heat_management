import express from 'express';

const app = express();
const PORT = 3005;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Simple server is running!' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.listen(PORT, () => {
  console.log(`Simple server is running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
});