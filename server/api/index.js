module.exports = (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: '咸鱼运营 Agent 服务运行中',
    timestamp: new Date().toISOString()
  });
};
