/**
 * Vercel Serverless Function 入口
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import chatRouter from '../src/routes/chat';
import browserRouter from '../src/routes/browser';
import dayuRouter from '../src/routes/dayu';
import xianyuRouter from '../src/routes/xianyu';
import sopRouter from '../src/routes/sop';
import analyticsRouter from '../src/routes/analytics';
import accountsRouter from '../src/routes/accounts';
import configRouter from '../src/routes/config';

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 请求日志
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 健康检查
app.get('/api/v1/health', (req: Request, res: Response) => {
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
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    msg: '接口不存在',
    path: req.path,
  });
});

// 错误处理
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    msg: '服务器内部错误',
  });
});

// 导出 Vercel Serverless Function handler
module.exports = app;
