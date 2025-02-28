'use strict';
const { Controller } = require('egg');
const { v4: uuidv4 } = require('uuid');
class ChatController extends Controller {
  // 连接socket
  async connect() {
    const { ctx, app } = this;
    if (!ctx.websocket) {
      ctx.throw(400, '非法访问');
    }

    console.log(`clients: ${app.ws.clients.size}`);
    // 监听接收消息和关闭socket
    ctx.websocket
      .on('message', msg => {
        console.log('接收消息', msg);
      })
      .on('close', async (code, reason) => {
        console.log('websocket 关闭', code, reason);
        const user_id = ctx.websocket.user_id;
        const _deviceId = await this.service.cache.get('device_' + user_id);
        // 因为用户在其它设备登录时，上线记录是一样的为(user_id)，所以不能移除,如果移除了，则不能接收到消息需要重新打开app才能接收到消息
        // 如果不是同一个设备
        if (reason !== _deviceId || reason !== '你的账号在其他设备登录') {
          // 移除redis中的用户上线记录
          ctx.service.cache.remove('online_' + user_id);
          if (app.ws.user && app.ws.user[user_id]) {
            delete app.ws.user[user_id];
          }
        }
      });
  }

  // 发送消息
  async send() {
    const { ctx, app } = this;
    // 参数验证
    ctx.validate({
      to_id: {
        type: 'int',
        required: true,
        desc: '接收人/群id',
      },
      chat_type: {
        type: 'string',
        required: true,
        range: {
          in: [ 'user', 'group' ],
        },
        desc: '接收类型',
      },
      type: {
        type: 'string',
        required: true,
        range: {
          in: [ 'text', 'notice', 'reply', 'image', 'video', 'audio', 'emoji', 'card', 'position', 'callVoice', 'callVideo' ],
        },
        desc: '消息类型',
      },
      data: {
        type: 'string',
        required: true,
        desc: '消息内容',
      },
      options: {
        type: 'string',
        required: true,
        desc: '其它',
      },
    });
    // 获取参数
    const { to_id, chat_type, type, data, options, from_id, reverse } = ctx.request.body;
    // 拿到当前用户id
    const current_user_id = reverse ? from_id : ctx.authUser.id;
    // 单聊
    if (chat_type === 'user') {
      // 验证好友是否存在，并且对方没有把你拉黑 (对方的好友中有没有我)
      const Friend = await app.model.Friend.findOne({
        where: {
          user_id: to_id,
          friend_id: current_user_id,
          isblack: 0,
        },
        include: [{
          model: app.model.User,
          as: 'userInfo', // 接收者
        }, {
          model: app.model.User,
          as: 'friendInfo', // 发送者 你自己 关联friend_id 对应 current_user_id
        }],
      });
      const User = await app.model.Friend.findOne({ where: { user_id: current_user_id, friend_id: to_id, isblack: 0 } });
      if (!Friend) {
        return ctx.apiFail('对方不存在或者已经把你拉黑');
      }
      // 验证好友是否被禁用
      if (!Friend.userInfo.status) {
        return ctx.apiFail('对方已被禁用');
      }
      // 构建消息格式
      let from_name = Friend.friendInfo.nickname ? Friend.friendInfo.nickname : Friend.friendInfo.username;
      let to_name = Friend.userInfo.nickname ? Friend.userInfo.nickname : Friend.userInfo.username;
      if (Friend.nickname) { // 自己在朋友那的备注
        from_name = Friend.nickname;
      }
      if (User.nickname) { // 朋友在我这的备注
        to_name = User.nickname;
      }
      const message = {
        message_id: uuidv4(), // 唯一id，后端生成唯一id
        from_avatar: Friend.friendInfo.avatar, // 发送者头像
        from_name, // 发送者昵称
        from_id: current_user_id, // 发送者id
        to_id, // 接收人/群 id
        to_name, // 接收人/群 名称
        to_avatar: Friend.userInfo.avatar, // 接收人/群 头像
        chat_type: 'user', // 接收类型
        type, // 消息类型
        data, // 消息内容
        options: options || '{}', // 其他参数
        create_time: (new Date()).getTime(), // 创建时间
        isremove: 0, // 是否撤回
        isread: 0, // 是否已读
      };
      // // 拿到对方的socket
      // const socket = app.ws.user[to_id];
      // if (!socket) {
      //   // 离线消息
      //   service.cache.setList(`getmessage_${to_id}`, message);
      // } else {
      //   // 发送消息
      //   socket.send(JSON.stringify({
      //     message: 'ok',
      //     data: message,
      //   }));

      //   // 存到对方的聊天记录中
      //   service.cache.setList(`chatlog_${to_id}_${message.chat_type}_${current_user_id}`, message);
      // }
      ctx.sendAndSaveMessage(to_id, message);
      // 存储到自己的聊天记录中 chatlog_当前用户id_user_对方用户id
      // service.cache.setList(`chatlog_${current_user_id}_${message.chat_type}_${to_id}`, message);
      // 返回成功
      return ctx.apiSuccess(message);
    }

    // 群聊
    // 验证群聊是否存在，且你是否在该群中
    const group = await app.model.Group.findOne({
      where: {
        status: 1,
        id: to_id,
      },
      include: [{
        model: app.model.GroupUser,
        attributes: [ 'user_id', 'nickname' ],
      }],
    });
    if (!group) {
      return ctx.apiFail('该群聊不存在或者已被封禁');
    }
    const index = group.group_users.findIndex(item => item.user_id === current_user_id);
    if (index === -1) {
      return ctx.apiFail('你不是该群的成员');
    }

    // 拿到所有的群成员id,排除自己
    const user_ids = group.group_users.map(item => item.user_id).filter(v => v !== current_user_id);

    // 在好友表中查询所有群成员信息
    const friends = await app.model.Friend.findAll({
      where: {
        user_id: { [app.Sequelize.Op.in]: user_ids },
        friend_id: current_user_id,
      },
      attributes: [ 'user_id', 'nickname' ],
    });
    // 做映射
    const friendsMap = friends.reduce((acc, obj) => {
      const item = obj.toJSON();
      acc[item.user_id] = item;
      return acc;
    }, {});

    // 组织数据格式
    const from_name = group.group_users[index].nickname;
    const message = {
      message_id: uuidv4(), // 唯一id，后端生成唯一id
      from_avatar: ctx.authUser.avatar, // 发送者头像
      from_name: from_name || ctx.authUser.nickname || ctx.authUser.username, // 发送者昵称
      from_id: current_user_id, // 发送者id
      to_id, // 接收人/群 id
      to_name: group.name, // 接收人/群 名称
      to_avatar: group.avatar, // 接收人/群 头像
      chat_type: 'group', // 接收类型
      type, // 消息类型
      data, // 消息内容
      options: options || '{}', // 其他参数
      create_time: (new Date()).getTime(), // 创建时间
      isremove: 0, // 是否撤回
      isread: 0, // 是否已读
      group,
    };
    // 推送消息
    group.group_users.forEach(item => {
      if (item.user_id !== current_user_id) {
        const name = message.from_name;
        const from_name = friendsMap[item.user_id]?.nickname || name;
        ctx.sendAndSaveMessage(item.user_id, { ...message, from_name });
      }
    });
    ctx.apiSuccess(message);
  }

  // 撤回
  async recall() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    const { message } = ctx.request.body;
    const { to_id, chat_type } = message;
    // 单聊
    if (chat_type === 'user') {
      ctx.sendAndSaveMessage(to_id, message, 'recall');
      return ctx.apiSuccess(message);
    }
    // 群聊
    const group = await app.model.Group.findOne({
      where: {
        id: to_id,
        status: 1,
      },
      include: [{
        model: app.model.GroupUser,
        attributes: [ 'user_id', 'nickname' ],
      }],
    });
    if (group) {
      group.group_users.forEach(item => {
        if (item.user_id !== current_user_id) {
          ctx.sendAndSaveMessage(item.user_id, message, 'recall');
        }
      });
    }
    return ctx.apiSuccess(message);
  }
  // 删除聊天消息
  async deleteChatMessage() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    const { to_id, chat_type } = ctx.request.body;
    const message_id = uuidv4();
    // 单聊
    if (chat_type === 'user') {
      ctx.sendAndSaveMessage(to_id, { ...ctx.request.body, message_id }, 'delete_chat_message');
      return ctx.apiSuccess({ ...ctx.request.body, message_id });
    }
    // 群聊
    const group = await app.model.Group.findOne({
      where: {
        id: to_id,
        status: 1,
      },
      include: [{
        model: app.model.GroupUser,
        attributes: [ 'user_id', 'nickname' ],
      }],
    });
    if (group) {
      group.group_users.forEach(item => {
        if (item.user_id !== current_user_id) {
          ctx.sendAndSaveMessage(item.user_id, { ...ctx.request.body, message_id }, 'delete_chat_message');
        }
      });
    }
    return ctx.apiSuccess({ ...ctx.request.body, message_id });
  }

  // 客户端接收到消息
  async receiveMessage() {
    const { ctx, service } = this;
    const { message } = ctx.request.body;
    // 在丢失消息表中删除掉该条消息
    await service.chat.deleteOfflineMessage(message);
  }

  // 获取离线消息
  async getOfflineMessage() {
    const { ctx, service } = this;
    const current_user_id = ctx.authUser.id;
    const list = await service.chat.getOfflineMessage();
    for (const item of list) {
      const message = JSON.parse(item.message);
      if (message.message_id) {
        // 增加离线消息标识
        message.offline = true
        await ctx.send(current_user_id, message, message.msg);
      }
    }
    ctx.apiSuccess('ok');
  }

}
module.exports = ChatController;
