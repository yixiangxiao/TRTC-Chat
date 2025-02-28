const nodemailer = require('nodemailer');
exports.config = {
  host: 'smtp.qq.com',
  port: 465,
  auth: {
    user: '', // 你的qq邮箱账号
    pass: '', // 邮箱的授权码，不是注册时的密码,等你开启的stmp服务自然就会知道了
  },
};

// 创建一个SMTP客户端对象
exports.transporter = nodemailer.createTransport(config);
