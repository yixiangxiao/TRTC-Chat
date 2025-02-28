const Controller = require('egg').Controller;
const { v4: uuidv4 } = require('uuid');
class RtcController extends Controller {
  // 忙线请求
  async busyCall() {
    const { ctx, app } = this;
    const { targetId, callType } = ctx.request.body;
    // 通知拨打方未应答
    const Friend = await app.model.Friend.findOne({
      where: {
        user_id: ctx.authUser.id,
        friend_id: targetId,
        isblack: 0,
      },
      include: [
        {
          model: app.model.User,
          as: 'userInfo',
        },
        {
          model: app.model.User,
          as: 'friendInfo',
        },
      ],
    });
    let from_name = Friend.friendInfo.nickname
      ? Friend.friendInfo.nickname
      : Friend.friendInfo.username;
    if (Friend.nickname) {
      from_name = Friend.nickname;
    }
    const message = {
      message_id: uuidv4(), // 唯一id，后端生成唯一id
      msg: 'ok',
      from_avatar: Friend.friendInfo.avatar, // 发送者头像
      from_name, // 发送者昵称
      from_id: targetId, // 发送者id
      to_id: ctx.authUser.id, // 接收人/群 id
      to_name: Friend.userInfo.nickname
        ? Friend.userInfo.nickname
        : Friend.userInfo.username, // 接收人/群 名称
      to_avatar: Friend.userInfo.avatar, // 接收人/群 头像
      chat_type: 'user', // 接收类型
      type: callType, // 消息类型
      data: '忙线中', // 消息内容
      options: {}, // 其他参数
      create_time: new Date().getTime(), // 创建时间
      isremove: 0, // 是否撤回
      isread: 0, // 是否已读
    };
    ctx.sendAndSaveMessage(ctx.authUser.id, message);
    // 存入被拨打人离线call消息中
    ctx.sendAndSaveMessage(targetId, message, 'call');
    ctx.apiSuccess('ok');
  }
  // 返回聊天页面
  async rejectCall() {
    const { ctx, app } = this;
    const { targetId, callType } = ctx.request.body;
    // 通知拨打方未应答
    const Friend = await app.model.Friend.findOne({
      where: {
        user_id: ctx.authUser.id,
        friend_id: targetId,
        isblack: 0,
      },
      include: [
        {
          model: app.model.User,
          as: 'userInfo',
        },
        {
          model: app.model.User,
          as: 'friendInfo',
        },
      ],
    });
    let from_name = Friend.friendInfo.nickname
      ? Friend.friendInfo.nickname
      : Friend.friendInfo.username;
    if (Friend.nickname) {
      from_name = Friend.nickname;
    }
    const message = {
      message_id: uuidv4(), // 唯一id，后端生成唯一id
      msg: 'ok',
      from_avatar: Friend.friendInfo.avatar, // 发送者头像
      from_name, // 发送者昵称
      from_id: targetId, // 发送者id
      to_id: ctx.authUser.id, // 接收人/群 id
      to_name: Friend.userInfo.nickname
        ? Friend.userInfo.nickname
        : Friend.userInfo.username, // 接收人/群 名称
      to_avatar: Friend.userInfo.avatar, // 接收人/群 头像
      chat_type: 'user', // 接收类型
      type: callType, // 消息类型
      data: '已拒绝', // 消息内容
      options: {}, // 其他参数
      create_time: new Date().getTime(), // 创建时间
      isremove: 0, // 是否撤回
      isread: 0, // 是否已读
    };
    ctx.sendAndSaveMessage(ctx.authUser.id, message);
    // 存入被拨打人离线call消息中
    ctx.sendAndSaveMessage(targetId, message, 'call');
    ctx.apiSuccess('ok');
  }

  // 无响应
  async noResponseCall() {
    const { ctx, app } = this;
    const { targetId, callType } = ctx.request.body;
    // 通知拨打方未应答
    const Friend = await app.model.Friend.findOne({
      where: {
        user_id: ctx.authUser.id,
        friend_id: targetId,
        isblack: 0,
      },
      include: [
        {
          model: app.model.User,
          as: 'userInfo',
        },
        {
          model: app.model.User,
          as: 'friendInfo',
        },
      ],
    });
    let from_name = Friend.friendInfo.nickname
      ? Friend.friendInfo.nickname
      : Friend.friendInfo.username;
    if (Friend.nickname) {
      from_name = Friend.nickname;
    }
    const message = {
      message_id: uuidv4(), // 唯一id，后端生成唯一id
      msg: 'ok',
      from_avatar: Friend.friendInfo.avatar, // 发送者头像
      from_name, // 发送者昵称
      from_id: targetId, // 发送者id
      to_id: ctx.authUser.id, // 接收人/群 id
      to_name: Friend.userInfo.nickname
        ? Friend.userInfo.nickname
        : Friend.userInfo.username, // 接收人/群 名称
      to_avatar: Friend.userInfo.avatar, // 接收人/群 头像
      chat_type: 'user', // 接收类型
      type: callType, // 消息类型
      data: '无响应', // 消息内容
      options: {}, // 其他参数
      create_time: new Date().getTime(), // 创建时间
      isremove: 0, // 是否撤回
      isread: 0, // 是否已读
    };
    ctx.sendAndSaveMessage(ctx.authUser.id, message);
    // 存入被拨打人离线call消息中
    ctx.sendAndSaveMessage(targetId, message, 'call');
    ctx.apiSuccess('ok');
  }
  // 多人通话请求
  async groupCall() {
    const { ctx, app } = this;
    const { groupId, callType } = ctx.request.body;
    const current_user_id = ctx.authUser.id;
    // 是否存在
    const group = await app.model.Group.findOne({
      where: {
        id: groupId,
        status: 1,
      },
      include: [{
        model: app.model.GroupUser,
        attributes: [ 'user_id', 'nickname' ],
        include: [{
          model: app.model.User,
          attributes: [ 'username', 'nickname' ],
        }],
      }],
    });
    if (!group) {
      return ctx.apiFail('该群聊不存在或者已被封禁');
    }
    // 构建消息格式
    const from_name = ctx.authUser.nickname || ctx.authUser.username;
    const _message = {
      message_id: uuidv4(), // 唯一id，后端生成唯一id
      msg: 'ok',
      from_avatar: ctx.authUser.avatar, // 发送者头像
      from_name, // 发送者昵称
      from_id: current_user_id, // 发送者id
      to_id: group.id, // 接收人/群 id
      to_name: group.name, // 接收人/群 名称
      to_avatar: group.avatar, // 接收人/群 头像
      chat_type: 'group', // 接收类型
      type: 'system', // 消息类型
      data: `${from_name} 发起了${callType === 'callVoice' ? '语音' : '视频'}通话`, // 消息内容
      options: '{}', // 其他参数
      create_time: (new Date()).getTime(), // 创建时间
      isremove: 0, // 是否撤回
      isread: 0, // 是否已读
      group,
    };
    // 消息推送
    group.group_users.forEach(item => {
      ctx.sendAndSaveMessage(item.user_id, _message);
      ctx.sendAndSaveMessage(item.user_id, { message_id: uuidv4() }, 'group_call_start');
    });
    ctx.apiSuccess('ok');
  }

  // 结束
  async groupCallEnd() {
    const { app, ctx } = this;
    const { groupId, callType } = ctx.request.body;
    const group = await app.model.Group.findOne({
      where: {
        id: groupId,
      },
      include: [{
        model: app.model.GroupUser,
        attributes: [ 'user_id', 'nickname' ],
        include: [{
          model: app.model.User,
          attributes: [ 'username', 'nickname' ],
        }],
      }],
    });
    // 构建消息格式
    const from_name = ctx.authUser.nickname || ctx.authUser.username;
    const _message = {
      message_id: uuidv4(), // 唯一id，后端生成唯一id
      msg: 'ok',
      from_avatar: ctx.authUser.avatar, // 发送者头像
      from_name, // 发送者昵称
      from_id: ctx.authUser.id, // 发送者id
      to_id: group.id, // 接收人/群 id
      to_name: group.name, // 接收人/群 名称
      to_avatar: group.avatar, // 接收人/群 头像
      chat_type: 'group', // 接收类型
      type: 'system', // 消息类型
      data: `${callType === 'callVoice' ? '语音' : '视频'}通话已结束`, // 消息内容
      options: '{}', // 其他参数
      create_time: (new Date()).getTime(), // 创建时间
      isremove: 0, // 是否撤回
      isread: 0, // 是否已读
      group,
    };
      // 消息推送
    group.group_users.forEach(item => {
      ctx.sendAndSaveMessage(item.user_id, _message);
    });
    ctx.apiSuccess('ok');
  }

  // 加入群通话
  async joinGroupCall() {
    const { ctx, app } = this;
    const { groupId } = ctx.request.body;
    // 拿到当前群在通话的人数
    let count = await this.service.cache.get('group_call' + groupId) || 1;
    count = count + 1;
    await this.service.cache.set('group_call' + groupId, count);
    const group = await app.model.Group.findOne({
      where: {
        id: groupId,
      },
      include: [{
        model: app.model.GroupUser,
        attributes: [ 'user_id', 'nickname' ],
        include: [{
          model: app.model.User,
          attributes: [ 'username', 'nickname' ],
        }],
      }],
    });
    // 构建消息格式
    const from_name = ctx.authUser.nickname || ctx.authUser.username;
    const _message = {
      message_id: uuidv4(), // 唯一id，后端生成唯一id
      msg: 'ok',
      from_avatar: ctx.authUser.avatar, // 发送者头像
      from_name, // 发送者昵称
      from_id: ctx.authUser.id, // 发送者id
      to_id: group.id, // 接收人/群 id
      to_name: group.name, // 接收人/群 名称
      to_avatar: group.avatar, // 接收人/群 头像
      chat_type: 'group', // 接收类型
      type: 'system', // 消息类型
      data: count, // 消息内容
      options: '{}', // 其他参数
      create_time: (new Date()).getTime(), // 创建时间
      isremove: 0, // 是否撤回
      isread: 0, // 是否已读
      group,
    };
      // 消息推送
    group.group_users.forEach(item => {
      ctx.sendAndSaveMessage(item.user_id, _message, 'call_count');
    });
    ctx.apiSuccess('ok');
  }

  // 离开群通话
  async leaveGroupCall() {
    const { ctx, app } = this;
    const { groupId } = ctx.request.body;
    // 拿到当前群在通话的人数
    let count = await this.service.cache.get('group_call' + groupId) || 1;
    count = count - 1;
    await this.service.cache.set('group_call' + groupId, count);
    const group = await app.model.Group.findOne({
      where: {
        id: groupId,
      },
      include: [{
        model: app.model.GroupUser,
        attributes: [ 'user_id', 'nickname' ],
        include: [{
          model: app.model.User,
          attributes: [ 'username', 'nickname' ],
        }],
      }],
    });
    // 构建消息格式
    const from_name = ctx.authUser.nickname || ctx.authUser.username;
    const _message = {
      message_id: uuidv4(), // 唯一id，后端生成唯一id
      msg: 'ok',
      from_avatar: ctx.authUser.avatar, // 发送者头像
      from_name, // 发送者昵称
      from_id: ctx.authUser.id, // 发送者id
      to_id: group.id, // 接收人/群 id
      to_name: group.name, // 接收人/群 名称
      to_avatar: group.avatar, // 接收人/群 头像
      chat_type: 'group', // 接收类型
      type: 'system', // 消息类型
      data: count, // 消息内容
      options: '{}', // 其他参数
      create_time: (new Date()).getTime(), // 创建时间
      isremove: 0, // 是否撤回
      isread: 0, // 是否已读
      group,
    };
      // 消息推送
    group.group_users.forEach(item => {
      ctx.sendAndSaveMessage(item.user_id, _message, 'call_count');
    });
    ctx.apiSuccess('ok');
  }

  // 结束通话
  async endGroupCall() {
    const { ctx, app } = this;
    const { groupId } = ctx.request.body;
    await this.service.cache.remove('group_call' + groupId);
    const group = await app.model.Group.findOne({
      where: {
        id: groupId,
      },
      include: [{
        model: app.model.GroupUser,
        attributes: [ 'user_id', 'nickname' ],
        include: [{
          model: app.model.User,
          attributes: [ 'username', 'nickname' ],
        }],
      }],
    });
    // 构建消息格式
    const from_name = ctx.authUser.nickname || ctx.authUser.username;
    const _message = {
      message_id: uuidv4(), // 唯一id，后端生成唯一id
      msg: 'ok',
      from_avatar: ctx.authUser.avatar, // 发送者头像
      from_name, // 发送者昵称
      from_id: ctx.authUser.id, // 发送者id
      to_id: group.id, // 接收人/群 id
      to_name: group.name, // 接收人/群 名称
      to_avatar: group.avatar, // 接收人/群 头像
      chat_type: 'group', // 接收类型
      type: 'system', // 消息类型
      data: 0, // 消息内容
      options: '{}', // 其他参数
      create_time: (new Date()).getTime(), // 创建时间
      isremove: 0, // 是否撤回
      isread: 0, // 是否已读
      group,
    };
      // 消息推送
    group.group_users.forEach(item => {
      ctx.sendAndSaveMessage(item.user_id, _message, 'call_count');
      ctx.sendAndSaveMessage(item.user_id, { message_id: uuidv4() }, 'group_call_end');
    });
    ctx.apiSuccess('ok');
  }

  // 查询群通话人数
  async getGroupCallCount() {
    const { ctx } = this;
    const { groupId } = ctx.query;
    const count = await this.service.cache.get('group_call' + groupId) || 0;
    ctx.apiSuccess(count);
  }
}
module.exports = RtcController;
