'use strict';
const { Service } = require('egg');
class ChatService extends Service {
  // 存入丢失消息表
  async saveOfflineMessage(OfflineMessage) {
    const { ctx } = this;
    const { message, user_id, msg } = OfflineMessage;
    const { message_id } = message;
    const _message = JSON.stringify(message);
    // 处理离线消息
    if (message_id && msg === 'recall') {
      const a = await ctx.model.OfflineMessage.findOne({ where: { message_id, user_id } });
      if (a) {
        const item = JSON.parse(a.message);
        item.isremove = 1;
        await ctx.model.OfflineMessage.update({ message: JSON.stringify(item) }, { where: { message_id, user_id } });
      }
      return;
    }
    if (message_id) {
      await ctx.model.OfflineMessage.create({ message: _message, message_id, user_id, msg });
    }
  }

  // 删除丢失消息表某条数据
  async deleteOfflineMessage(OfflineMessage) {
    const { ctx } = this;
    const { message_id, msg } = OfflineMessage;
    const current_user_id = ctx.authUser.id;
    await ctx.model.OfflineMessage.destroy({ where: { message_id, user_id: current_user_id, msg } });
  }

  // 获取当前用户丢失消息
  async getOfflineMessage() {
    const { ctx } = this;
    const current_user_id = ctx.authUser.id;
    // 时间小的在前面
    const list = await ctx.model.OfflineMessage.findAll({ where: { user_id: current_user_id }, order: [['created_at', 'ASC']] });
    return list;
  }
}
module.exports = ChatService;
