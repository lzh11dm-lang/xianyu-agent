/**
 * Express 服务入口
 */

import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat';
import browserRouter from './routes/browser';
import dayuRouter from './routes/dayu';
import xianyuRouter from './routes/xianyu';
import sopRouter from './routes/sop';
import analyticsRouter from './routes/analytics';
import accountsRouter from './routes/accounts';
import configRouter from './routes/config';

const app = express();
const PORT = process.env.PORT || 9091;

// 中间件
app.use(cors());
app.use(express.json());

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 健康检查
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// 路由
app.use('/api/v1/chat', chatRouter);
app.use('/api/v1/browser', browserRouter);
app.use('/api/v1/dayu', dayuRouter);
app.use('/api/v1/xianyu', xianyuRouter);
app.use('/api/v1/sop', sopRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/accounts', accountsRouter);
app.use('/api/v1/config', configRouter);

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    msg: '接口不存在',
    path: req.path,
  });
});

// 错误处理
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    msg: '服务器内部错误',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 API Base: http://localhost:${PORT}/api/v1`);
});
