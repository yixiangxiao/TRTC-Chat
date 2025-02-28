'use strict';
const { Service } = require('egg');
const { transporter, config } = require('../utils/mail');
class YzmService extends Service {

  // 发送验证码
  async sendMail(email) {
    const code = await this.generateMail();
    // 存入数据库
    await this.app.model.Yzm.create({ yzm: code, email });
    const mail = {
      // 发件人
      from: `<${config.auth.user}>`, // 你的QQ号@qq.com，换成自己的QQ号即可

      // 主题
      subject: '验证码', // 邮箱主题
      // 收件人
      to: email, // 前台传过来的邮箱
      // 邮件内容，HTML格式
      // text: '验证码:' + code //发送验证码
      html:
          `
            <p>你好！</p>
            <p>您正在注册仿微信聊天平台</p>
            <p>你的验证码是：<strong style="color: #ff4e2a;">${code}</strong></p>
            <p>***该验证码5分钟内有效***</p>
          `, // html 内容
    };
    return await transporter.sendMail(mail);
  }

  // 刷新验证码表，时间超过5分钟删除
  async refreshMails() {
    const { Sequelize } = this.app;
    const { Op } = Sequelize;
    // this.app.model.Yzm.destroy({
    //     where:{ created_at:{[Op.lt]: Date.now()-300000}
    //     }
    // })
    await this.app.model.Yzm.destroy({
      where: {
        created_at: {
          [Op.lt]: Sequelize.literal('DATE_SUB(NOW(), INTERVAL 5 MINUTE)'),
        },
      },
    });
  }

  createSixNum() {
    let Num = '';
    for (let i = 0; i < 6; i++) {
      Num += Math.floor(Math.random() * 10);
    }
    return Num;
  }

  // 验证码生成
  async generateMail() {
    await this.refreshMails(); // 刷新
    const code = this.createSixNum();
    return code;
  }

  // 判断验证码
  async judgeMail(str, email) {
    await this.refreshMails(); // 刷新
    let result = false;
    if (!str) return false;
    const data = await this.app.model.Yzm.findOne({
      where: { yzm: str, email },
    });
    if (data) {
      result = true;
      await data.destroy();
    }
    return result;
  }
}
module.exports = YzmService;
