// 最小化的服务器测试文件
import express from 'express';

const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'Minimal server is running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 添加错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`Minimal server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('Failed to start server:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.log('Port is already in use. Try a different port.');
  }
});