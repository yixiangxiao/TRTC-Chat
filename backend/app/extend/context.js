const qr = require('qr-image');
module.exports = {
  // 成功提示
  apiSuccess(data = '', msg = 'ok', code = 200) {
    this.body = { msg, data };
    this.status = code;
  },
  // 失败提示
  apiFail(data = '', msg = 'fail', code = 400) {
    this.body = { msg, data };
    this.status = code;
  },
  // 生成token { a:1, b:2 }
  getToken(value) {
    return this.app.jwt.sign(value, this.app.config.jwt.secret);
  },

  // 校验token 解析结果为{ a:1, b:2 }
  verifyToken(token) {
    return this.app.jwt.verify(token, this.app.config.jwt.secret);
  },

  // 发送或者存到消息队列中
  async sendAndSaveMessage(to_id, message, msg = 'ok') {
    const { app, service } = this;
    // const current_user_id = this.authUser.id;
    // 拿到接受用户所在子进程
    const pid = await service.cache.get('online_' + to_id);
    // 存到丢失消息表当中
    service.chat.saveOfflineMessage({ message: { ...message, msg }, user_id: to_id, msg });
    // 如果子进程存在
    if (pid) {
      // 消息推送
      app.messenger.sendTo(pid, 'send', { to_id, message: { ...message, msg }, msg });
    }
  },

  // 发送消息
  async send(to_id, message, msg = 'ok') {
    const { app, service } = this;
    // 拿到接受用户所在子进程
    const pid = await service.cache.get('online_' + to_id);
    if (pid) {
      // 消息推送
      app.messenger.sendTo(pid, 'send', {
        to_id, message, msg,
      });
    }
  },

  // 生成二维码
  qrcode(data) {
    const image = qr.image(data, { size: 10 });
    this.response.type = 'image/png';
    this.body = image;
  },

  // 用户上线 登录时
  async loginOnline(user_id) {
    const { service, app } = this;
    // 下线其他设备
    const opid = await service.cache.get('online_' + user_id);
    if (opid) {
      // 通知对应进程用户下线
      app.messenger.sendTo(opid, 'offline', user_id);
    }
  },

  // 用户上线 路由连接时
  async online(user_id) {
    const { service } = this;
    const pid = process.pid;
    // 存储上线状态
    service.cache.set('online_' + user_id, pid);
  },

  // 新增用户上线记录
  async addLoginLog(user_id) {
    const { app } = this;
    // 删除
    await app.model.LoginLog.destroy({
      where: { user_id },
    });
    // 新增
    await app.model.LoginLog.create({ user_id });
  },
};
