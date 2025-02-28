'use strict';
const { Controller } = require('egg');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { Api } = require('../utils/tlssig-api');
class GroupController extends Controller {
  // 创建群聊
  async createGroup() {
    const { ctx } = this;
    const current_user_id = ctx.authUser.id;
    // 参数验证
    ctx.validate({
      ids: {
        type: 'array',
        required: true,
        desc: '用户id',
      },
    });
    const { ids } = ctx.request.body;
    // 验证是否为我的好友
    const friends = await this.ctx.model.Friend.findAll({
      where: {
        user_id: current_user_id,
        friend_id: ids,
      },
      include: [{
        model: this.ctx.model.User,
        as: 'friendInfo',
        attributes: [ 'nickname', 'username', 'avatar' ],
      }],
    });
    if (friends.length === 0) {
      ctx.throw('请选择需要添加的好友');
    }
    // 拿到名称
    const names = friends.map(item => item.friendInfo.nickname || item.friendInfo.username);
    // 加入自己的名字
    names.push(ctx.authUser.nickname || ctx.authUser.username);
    const groupName = names.join(',');

    // 拿到所有用户的头像
    let avatars = friends.map(item => item.friendInfo.avatar);
    // 加入自己的头像
    avatars.push(ctx.authUser.avatar);
    // 过滤有效的头像
    avatars = avatars.filter(item => item);
    // 如果大于9张则随机取9张
    if (avatars.length > 9) {
      avatars = avatars.sort(() => Math.random() - 0.5).slice(0, 9);
    }
    // 生成头像
    let avatar = '';
    if (avatars.length > 2) {
      avatar = await this.ctx.service.groupAvatar.generateGridImage(avatars);
    }
    // 创建群聊
    const group = await this.ctx.model.Group.create({
      name: groupName,
      avatar,
      user_id: current_user_id,
    });

    // 加入群聊用户
    const groupUser = friends.map(v => {
      return {
        user_id: v.friend_id,
        group_id: group.id,
      };
    });
    // 加入自己
    groupUser.unshift({ user_id: current_user_id, group_id: group.id });
    // 创建
    await this.ctx.model.GroupUser.bulkCreate(groupUser);
    // 获取群成员头像
    const avatarList = friends.map(v => {
      return {
        user_id: v.friend_id,
        avatar: v.friendInfo.avatar,
      };
    });
    // 加入自己
    avatarList.unshift({ user_id: current_user_id, avatar: ctx.authUser.avatar });
    // 消息推送
    const message = {
      message_id: uuidv4(), // 唯一id，后端生成唯一id
      from_avatar: ctx.authUser.avatar, // 发送者头像
      from_name: ctx.authUser.nickname || ctx.authUser.username, // 发送者昵称
      from_id: current_user_id, // 发送者id
      to_id: group.id, // 接收人/群 id
      to_name: group.name, // 接收人/群 名称
      to_avatar: group.avatar, // 接收人/群 头像
      chat_type: 'group', // 接收类型
      type: 'system', // 消息类型
      data: '创建群聊成功，可以开始聊天啦', // 消息内容
      options: '{}', // 其他参数
      create_time: (new Date()).getTime(), // 创建时间
      isremove: 0, // 是否撤回
      isread: 0, // 是否已读
      group,
      avatarList,
    };
    groupUser.forEach(item => {
      ctx.sendAndSaveMessage(item.user_id, message);
    });
    // 注册成功需要把人员加入腾讯IM用户中
    // https://cloud.tencent.com/document/product/269/1608
    const host = this.app.config.im.hostname;
    const sdkappid = this.app.config.im.SDKAppID;
    // 随机的32位无符号整数，取值范围0 - 4294967295
    const random = Math.floor(Math.random() * 4294967295);
    // 必须为 App 管理员账号
    const identifier = 'administrator';
    // 生成腾讯IM usersign
    const api = new Api(this.app.config.im.SDKAppID, this.app.config.im.SDKSecretKey);
    const usersig = api.genUserSig(identifier, 5 * 1000);
    const path = 'v4/group_open_http_svc/create_group';
    const url = `https://${host}/${path}?sdkappid=${sdkappid}&identifier=${identifier}&usersig=${usersig}&random=${random}&contenttype=json`;
    const res = await axios.post(url, {
      Owner_Account: ctx.authUser.username, // 群主的 UserId（选填）
      Type: 'Public', // 群组类型：Private/Public/ChatRoom/AVChatRoom/Community
      Name: group.name, // 群名称（必填）
    });
    if (res.data.ErrorCode === 0) {
      ctx.apiSuccess('ok');
      await group.update({
        group_id: res.data.GroupId,
      }, {
        where: {
          id: group.id,
        },
      });
      // 加入群成员
      const path2 = 'v4/group_open_http_svc/add_group_member';
      const url = `https://${host}/${path2}?sdkappid=${sdkappid}&identifier=${identifier}&usersig=${usersig}&random=${random}&contenttype=json`;
      const MemberList = friends.map(v => {
        return {
          Member_Account: v.friendInfo.username,
        };
      });
      const res2 = await axios.post(url, {
        GroupId: res.data.GroupId, // 要操作的群组（必填）
        MemberList, // 一次最多添加100个成员
      });
      if (res2.data.ErrorCode !== 0) ctx.throw('腾讯IM添加群成员失败');
    } else {
      ctx.throw('创建腾讯IM群组失败');
    }
    // ctx.apiSuccess('ok');
  }
  // 获取群聊列表
  async getGroupList() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    let { page = 1, limit = 10 } = ctx.query;
    // 注意类型 limit offset需为number类型
    page = page ? parseInt(page) : 1;
    limit = limit ? parseInt(limit) : 1;
    const offset = (page - 1) * limit;
    const rows = await app.model.Group.findAll({
      where: {
        status: 1,
      },
      include: [{
        model: app.model.GroupUser,
        where: {
          user_id: current_user_id,
        },
      }],
      offset,
      limit,
    });

    return ctx.apiSuccess(rows);
  }
  // 查看群资料
  async getGroupInfo() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    // 验证参数
    ctx.validate({
      id: {
        required: true,
        type: 'int',
        desc: '群组id',
      },
    });
    const { id } = ctx.params;
    // 群组是否存在
    const group = await app.model.Group.findOne({
      where: {
        status: 1,
        id,
      },
      include: [{
        model: app.model.GroupUser,
        attributes: [ 'user_id', 'nickname' ],
        include: [{
          model: app.model.User,
          attributes: [ 'id', 'nickname', 'avatar', 'username' ],
        }],
      }],
    });

    if (!group) {
      return ctx.apiFail('该群聊不存在或者已被封禁');
    }

    // 当前用户是否是该群成员
    const index = group.group_users.findIndex(item => item.user_id === current_user_id);
    if (index === -1) {
      return ctx.apiFail('你不是该群成员，没有权限');
    }

    ctx.apiSuccess(group);
  }

  // 修改群名称
  async rename() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    // 参数验证
    ctx.validate({
      id: {
        required: true,
        type: 'int',
        desc: '群组id',
      },
      name: {
        required: true,
        type: 'string',
        desc: '群名称',
      },
    });
    const { id, name } = ctx.request.body;
    // 是否存在
    const group = await app.model.Group.findOne({
      where: {
        id,
        status: 1,
      },
      include: [{
        model: app.model.GroupUser,
        attributes: [ 'user_id', 'nickname' ],
      }],
    });
    if (!group) {
      return ctx.apiFail('该群聊不存在或者已被封禁');
    }
    // 你是否是该群成员
    const index = group.group_users.findIndex(item => item.user_id === current_user_id);
    if (index === -1) {
      return ctx.apiFail('你不是该群成员');
    }
    // 验证是否是群主
    if (group.user_id !== current_user_id) {
      return ctx.apiFail('你不是管理员，没有权限');
    }
    // 修改群名称
    group.name = name;
    await group.save();
    // 消息推送
    const from_name = group.group_users[index].nickname || ctx.authUser.nickname || ctx.authUser.username;
    const message = {
      message_id: uuidv4(), // 唯一id，后端生成唯一id
      from_avatar: ctx.authUser.avatar, // 发送者头像
      from_name, // 发送者昵称
      from_id: current_user_id, // 发送者id
      to_id: group.id, // 接收人/群 id
      to_name: group.name, // 接收人/群 名称
      to_avatar: group.avatar, // 接收人/群 头像
      chat_type: 'group', // 接收类型
      type: 'system', // 消息类型
      data: `${from_name} 修改群名称为 ${name}`, // 消息内容
      options: '{}', // 其他参数
      create_time: (new Date()).getTime(), // 创建时间
      isremove: 0, // 是否撤回
      isread: 0, // 是否已读
      group,
    };
    // 推送消息
    group.group_users.forEach(item => {
      ctx.sendAndSaveMessage(item.user_id, message);
    });
    ctx.apiSuccess('ok');
  }

  // 推送群公告
  async remark() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    // 参数验证
    ctx.validate({
      id: {
        required: true,
        type: 'int',
        desc: '群组id',
      },
      remark: {
        required: true,
        type: 'string',
        desc: '群公告',
      },
    });
    const { id, remark } = ctx.request.body;
    // 是否存在
    const group = await app.model.Group.findOne({
      where: {
        id,
        status: 1,
      },
      include: [{
        model: app.model.GroupUser,
        attributes: [ 'user_id', 'nickname' ],
      }],
    });
    if (!group) {
      return ctx.apiFail('该群聊不存在或者已被封禁');
    }
    // 你是否是该群成员
    const index = group.group_users.findIndex(item => item.user_id === current_user_id);
    if (index === -1) {
      return ctx.apiFail('你不是该群成员');
    }
    // 验证是否是群主
    if (group.user_id !== current_user_id) {
      return ctx.apiFail('你不是管理员，没有权限');
    }
    // 修改群公告
    group.remark = remark;
    await group.save();
    // 消息推送
    const from_name = group.group_users[index].nickname || ctx.authUser.nickname || ctx.authUser.username;
    const message = {
      message_id: uuidv4(), // 唯一id，后端生成唯一id
      from_avatar: ctx.authUser.avatar, // 发送者头像
      from_name, // 发送者昵称
      from_id: current_user_id, // 发送者id
      to_id: group.id, // 接收人/群 id
      to_name: group.name, // 接收人/群 名称
      to_avatar: group.avatar, // 接收人/群 头像
      chat_type: 'group', // 接收类型
      type: 'system', // 消息类型
      data: `[新公告] ${remark}`, // 消息内容
      options: '{}', // 其他参数
      create_time: (new Date()).getTime(), // 创建时间
      isremove: 0, // 是否撤回
      isread: 0, // 是否已读
      group,
    };
    // 推送消息
    group.group_users.forEach(item => {
      ctx.sendAndSaveMessage(item.user_id, message);
    });
    ctx.apiSuccess('ok');
  }

  // 修改我在本群中的昵称
  async updateNickname() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    // 参数验证
    ctx.validate({
      id: {
        required: true,
        type: 'int',
        desc: '群组id',
      },
      nickname: {
        required: false,
        type: 'string',
        desc: '昵称',
        defValue: '',
      },
    });
    const { id, nickname } = ctx.request.body;
    // 是否存在
    const group = await app.model.Group.findOne({
      where: {
        id,
        status: 1,
      },
      include: [{
        model: app.model.GroupUser,
        attributes: [ 'user_id', 'nickname' ],
      }],
    });
    if (!group) {
      return ctx.apiFail('该群聊不存在或者已被封禁');
    }
    // 你是否是该群成员
    const index = group.group_users.findIndex(item => item.user_id === current_user_id);
    if (index === -1) {
      return ctx.apiFail('你不是该群成员');
    }
    // 修改昵称
    const group_user = await app.model.GroupUser.findOne({
      where: {
        user_id: current_user_id,
        group_id: group.id,
      },
    });
    if (group_user) {
      await group_user.update({
        nickname,
      });
    }
    return ctx.apiSuccess('ok');
  }

  // 解散或退出群聊
  async quitGroup() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    // 参数验证
    ctx.validate({
      id: {
        required: true,
        type: 'int',
        desc: '群组id',
      },
    });
    const { id } = ctx.request.body;
    // 是否存在
    const group = await app.model.Group.findOne({
      where: {
        id,
      },
      include: [{
        model: app.model.GroupUser,
        attributes: [ 'user_id', 'nickname' ],
      }],
    });
    if (!group) {
      return ctx.apiFail('该群聊不存在');
    }
    // 你是否是该群成员
    const index = group.group_users.findIndex(item => item.user_id === current_user_id);
    if (index === -1) {
      return ctx.apiFail('你不是该群成员');
    }

    const from_name = group.group_users[index].nickname || ctx.authUser.nickname || ctx.authUser.username;

    const message = {
      message_id: uuidv4(), // 唯一id，后端生成唯一id
      from_avatar: ctx.authUser.avatar, // 发送者头像
      from_name, // 发送者昵称
      from_id: current_user_id, // 发送者id
      to_id: group.id, // 接收人/群 id
      to_name: group.name, // 接收人/群 名称
      to_avatar: group.avatar, // 接收人/群 头像
      chat_type: 'group', // 接收类型
      type: 'system', // 消息类型
      data: '', // 消息内容
      options: '{}', // 其他参数
      create_time: (new Date()).getTime(), // 创建时间
      isremove: 0, // 是否撤回
      isread: 0, // 是否已读
      group,
    };

    if (group.user_id === current_user_id) {
      // 解散群
      await app.model.Group.destroy({
        where: {
          id: group.id,
        },
      });
      // 解散群组
      // https://cloud.tencent.com/document/product/269/1608
      const host = this.app.config.im.hostname;
      const sdkappid = this.app.config.im.SDKAppID;
      // 随机的32位无符号整数，取值范围0 - 4294967295
      const random = Math.floor(Math.random() * 4294967295);
      // 必须为 App 管理员账号
      const identifier = 'administrator';
      // 生成腾讯IM usersign
      const api = new Api(this.app.config.im.SDKAppID, this.app.config.im.SDKSecretKey);
      const usersig = api.genUserSig(identifier, 5 * 1000);
      const path = 'v4/group_open_http_svc/destroy_group';
      const url = `https://${host}/${path}?sdkappid=${sdkappid}&identifier=${identifier}&usersig=${usersig}&random=${random}&contenttype=json`;
      const res = await axios.post(url, {
        GroupId: group.group_id,
      });
      if (res.data.ErrorCode !== 0) {
        ctx.throw('解散群组失败');
      }
      message.data = '该群已被解散';
    } else {
      // 退出群
      await app.model.GroupUser.destroy({
        where: {
          user_id: current_user_id,
          group_id: group.id,
        },
      });
      // 踢出群成员
      // https://cloud.tencent.com/document/product/269/1608
      const host = this.app.config.im.hostname;
      const sdkappid = this.app.config.im.SDKAppID;
      // 随机的32位无符号整数，取值范围0 - 4294967295
      const random = Math.floor(Math.random() * 4294967295);
      // 必须为 App 管理员账号
      const identifier = 'administrator';
      // 生成腾讯IM usersign
      const api = new Api(this.app.config.im.SDKAppID, this.app.config.im.SDKSecretKey);
      const usersig = api.genUserSig(identifier, 5 * 1000);
      const path = 'v4/group_open_http_svc/delete_group_member';
      const url = `https://${host}/${path}?sdkappid=${sdkappid}&identifier=${identifier}&usersig=${usersig}&random=${random}&contenttype=json`;
      const res = await axios.post(url, {
        GroupId: group.group_id,
        MemberToDel_Account: [ ctx.authUser.username ], // 群主的 UserId（选填）
      });
      if (res.data.ErrorCode !== 0) {
        ctx.throw('腾讯IM移除群成员失败');
      }
      message.data = `${from_name} 退出该群聊`;
    }

    // 推送消息
    group.group_users.forEach(item => {
      // 如果是群主则是解散群聊
      if (group.user_id === current_user_id) {
        ctx.sendAndSaveMessage(item.user_id, message, 'destory_group');
      } else {
        ctx.sendAndSaveMessage(item.user_id, message);
      }
    });
    // 删除之前的旧头像
    if (group.avatar) {
      await ctx.app.minio.removeObject('group-info', this.getFileName(group.avatar));
    }
    return ctx.apiSuccess('ok');
  }

  // 踢出某个群成员
  async kickoff() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    // 参数验证
    ctx.validate({
      id: {
        required: true,
        type: 'int',
        desc: '群组id',
      },
      user_id: {
        required: true,
        type: 'int',
        desc: '用户id',
      },
    });
    const { id, user_id } = ctx.request.body;
    // 是否存在
    const group = await app.model.Group.findOne({
      where: {
        id,
        status: 1,
      },
      include: [{
        model: app.model.GroupUser,
        attributes: [ 'user_id', 'nickname' ],
        include: [{
          model: app.model.User,
          attributes: [ 'username', 'nickname', 'avatar' ],
        }],
      }],
    });
    if (!group) {
      return ctx.apiFail('该群聊不存在或者已被封禁');
    }
    // 你是否是该群成员
    const index = group.group_users.findIndex(item => item.user_id === current_user_id);
    if (index === -1) {
      return ctx.apiFail('你不是该群成员');
    }
    // 验证是否是群主
    if (group.user_id !== current_user_id) {
      return ctx.apiFail('你不是管理员，没有权限');
    }
    // 不能踢自己
    if (user_id === current_user_id) {
      return ctx.apiFail('不能踢自己');
    }
    // 对方不是该群成员
    const index2 = group.group_users.findIndex(item => item.user_id === user_id);
    if (index2 === -1) {
      return ctx.apiFail('对方不是该群成员');
    }
    const kickname = group.group_users[index2].nickname || group.group_users[index2].user.nickname || group.group_users[index2].user.username;
    // 踢出该群
    await app.model.GroupUser.destroy({
      where: {
        user_id,
        group_id: group.id,
      },
    });
    // 返回成功
    ctx.apiSuccess('ok');

    // 踢出群成员
    // https://cloud.tencent.com/document/product/269/1608
    const host = this.app.config.im.hostname;
    const sdkappid = this.app.config.im.SDKAppID;
    // 随机的32位无符号整数，取值范围0 - 4294967295
    const random = Math.floor(Math.random() * 4294967295);
    // 必须为 App 管理员账号
    const identifier = 'administrator';
    // 生成腾讯IM usersign
    const api = new Api(this.app.config.im.SDKAppID, this.app.config.im.SDKSecretKey);
    const usersig = api.genUserSig(identifier, 5 * 1000);
    const path = 'v4/group_open_http_svc/delete_group_member';
    const url = `https://${host}/${path}?sdkappid=${sdkappid}&identifier=${identifier}&usersig=${usersig}&random=${random}&contenttype=json`;
    const res = await axios.post(url, {
      GroupId: group.group_id,
      MemberToDel_Account: [ group.group_users[index2].user.username ], // 群主的 UserId（选填）
    });
    if (res.data.ErrorCode !== 0) {
      ctx.throw('腾讯IM移除群成员失败');
    }

    // 拿到所有用户的头像
    let avatars = group.group_users.map(item => item.user.avatar);
    // 找到被踢那个人的头像
    const _avatar = group.group_users.find(item => item.user_id === user_id).user.avatar;
    // 移除被踢那个人的头像
    avatars = avatars.filter(item => item !== _avatar);
    // 过滤有效的头像
    avatars = avatars.filter(item => item);
    // 如果大于9张则随机取9张
    if (avatars.length > 9) {
      avatars = avatars.sort(() => Math.random() - 0.5).slice(0, 9);
    }
    let avatar = '';
    if (avatars.length > 2) {
      // 删除之前的旧头像
      if (group.avatar) {
        await ctx.app.minio.removeObject('group-info', this.getFileName(group.avatar));
      }
      avatar = await this.ctx.service.groupAvatar.generateGridImage(avatars);
      // 修改群头像
      await group.update({ avatar });
    }
    // 获取群成员头像
    const avatarList = group.group_users.map(v => {
      return {
        user_id: v.user_id,
        avatar: v.user.avatar,
      };
    });
    const user = await app.model.User.findOne({
      where: {
        id: user_id,
      },
    });
    // 构建消息格式
    const from_name = group.group_users[index].nickname || ctx.authUser.nickname || ctx.authUser.username;
    const message = {
      message_id: uuidv4(), // 唯一id，后端生成唯一id
      from_avatar: ctx.authUser.avatar, // 发送者头像
      from_name, // 发送者昵称
      from_id: current_user_id, // 发送者id
      to_id: group.id, // 接收人/群 id
      to_name: group.name, // 接收人/群 名称
      to_avatar: avatar, // 接收人/群 头像
      chat_type: 'group', // 接收类型
      type: 'system', // 消息类型
      data: `${from_name} 将 ${kickname} 移出群聊`, // 消息内容
      options: '{}', // 其他参数
      create_time: (new Date()).getTime(), // 创建时间
      isremove: 0, // 是否撤回
      isread: 0, // 是否已读
      group,
      avatarList,
    };
    // 消息推送
    group.group_users.forEach(item => {
      // 如果是被踢的那个人
      let data = message.data;
      const messageType = item.user_id === user_id ? 'kick_group' : undefined;
      if (item.user_id === user_id) {
        const name = user.nickname || user.username;
        const pattern = new RegExp("\\b" + name + "\\b", 'g');
        data = message.data.replace(pattern, '你')
     }
      if (item.user_id === current_user_id) {
        const name = from_name;
        const pattern = new RegExp("\\b" + name + "\\b", 'g');
        data = message.data.replace(pattern, '你')
      }
      return ctx.sendAndSaveMessage(item.user_id, { ...message, data }, messageType);
    });
  }

  // 邀请加入群聊
  async invite() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    // 参数验证
    ctx.validate({
      id: {
        required: true,
        type: 'int',
        desc: '群组id',
      },
      user_id: {
        required: true,
        type: 'int',
        desc: '用户id',
      },
    });
    const { id, user_id } = ctx.request.body;
    // 是否存在
    const group = await app.model.Group.findOne({
      where: {
        id,
        status: 1,
      },
      include: [{
        model: app.model.GroupUser,
        attributes: [ 'user_id', 'nickname' ],
        include: [{
          model: app.model.User,
          attributes: [ 'username', 'nickname', 'avatar' ],
        }],
      }],
    });
    if (!group) {
      return ctx.apiFail('该群聊不存在或者已被封禁');
    }
    // 你是否是该群成员
    const index = group.group_users.findIndex(item => item.user_id === current_user_id);
    if (index === -1) {
      return ctx.apiFail('你不是该群成员');
    }
    // 对方已经是该群成员
    const index2 = group.group_users.findIndex(item => item.user_id === user_id);
    if (index2 !== -1) {
      return ctx.apiFail('对方已经是该群成员');
    }
    // 对方是否存在
    const user = await app.model.User.findOne({
      where: {
        id: user_id,
        status: 1,
      },
    });
    if (!user) {
      return ctx.apiFail('对方不存在或者已被封禁');
    }
    const invitename = user.nickname || user.username;
    // 加入该群
    await app.model.GroupUser.create({
      user_id,
      group_id: group.id,
    });
    // 加入群成员
    // https://cloud.tencent.com/document/product/269/1608
    const host = this.app.config.im.hostname;
    const sdkappid = this.app.config.im.SDKAppID;
    // 随机的32位无符号整数，取值范围0 - 4294967295
    const random = Math.floor(Math.random() * 4294967295);
    // 必须为 App 管理员账号
    const identifier = 'administrator';
    // 生成腾讯IM usersign
    const api = new Api(this.app.config.im.SDKAppID, this.app.config.im.SDKSecretKey);
    const usersig = api.genUserSig(identifier, 5 * 1000);
    // 加入群成员
    const path = 'v4/group_open_http_svc/add_group_member';
    const url = `https://${host}/${path}?sdkappid=${sdkappid}&identifier=${identifier}&usersig=${usersig}&random=${random}&contenttype=json`;
    const MemberList = [
      {
        Member_Account: user.username,
      },
    ];
    const res2 = await axios.post(url, {
      GroupId: group.group_id, // 要操作的群组（必填）
      MemberList, // 一次最多添加100个成员
    });
    if (res2.data.ErrorCode !== 0) ctx.throw('腾讯IM添加群成员失败');
    // 返回成功
    ctx.apiSuccess('ok');
    // 拿到所有用户的头像
    let avatars = group.group_users.map(item => item.user.avatar);
    // 加入被邀请人头像
    avatars.push(user.avatar);
    // 过滤有效的头像
    avatars = avatars.filter(item => item);
    // 如果大于9张则随机取9张
    if (avatars.length > 9) {
      avatars = avatars.sort(() => Math.random() - 0.5).slice(0, 9);
    }
    let avatar = '';
    if (avatars.length > 2) {
      // 删除之前的旧头像
      if (group.avatar) {
        await ctx.app.minio.removeObject('group-info', this.getFileName(group.avatar));
      }
      avatar = await this.ctx.service.groupAvatar.generateGridImage(avatars);
      // 修改群头像
      await group.update({ avatar });
    }
    // 获取群成员头像
    const avatarList = group.group_users.map(v => {
      return {
        user_id: v.user_id,
        avatar: v.user.avatar,
      };
    });
    // 加入被邀请人
    avatarList.push({ user_id, avatar: user.avatar });
    // 构建消息格式
    const from_name = group.group_users[index].nickname || ctx.authUser.nickname || ctx.authUser.username;
    const message = {
      message_id: uuidv4(), // 唯一id，后端生成唯一id
      from_avatar: ctx.authUser.avatar, // 发送者头像
      from_name, // 发送者昵称
      from_id: current_user_id, // 发送者id
      to_id: group.id, // 接收人/群 id
      to_name: group.name, // 接收人/群 名称
      to_avatar: avatar, // 接收人/群 头像
      chat_type: 'group', // 接收类型
      type: 'system', // 消息类型
      data: `${from_name} 邀请 ${invitename} 加入群聊`, // 消息内容
      options: '{}', // 其他参数
      create_time: (new Date()).getTime(), // 创建时间
      isremove: 0, // 是否撤回
      isread: 0, // 是否已读
      group,
      avatarList,
    };
    const users = group.group_users.map(item => item.user_id);
    // 把邀请人加入
    users.push(user_id);
    // 消息推送
    users.forEach(id => {
      // 如果是被邀请的那个人
      let data = message.data;
      const messageType = id === user_id ? 'invite_group' : undefined;
      if (id === user_id) {
         const name = user.nickname || user.username;
         const pattern = new RegExp("\\b" + name + "\\b", 'g');
         data = message.data.replace(pattern, '你')
      }
      if (id === current_user_id) {
        const name = from_name;
        const pattern = new RegExp("\\b" + name + "\\b", 'g');
        data = message.data.replace(pattern, '你')
      }
      // 正则表达式，判断是否是邀请人，如果有邀请人的名字则替换为"你"
      ctx.sendAndSaveMessage(id, { ...message, data }, messageType);
    });
  }

  // 批量邀请加入群聊
  async batchInvite() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    // 参数验证
    ctx.validate({
      id: {
        required: true,
        type: 'int',
        desc: '群组id',
      },
      user_ids: {
        required: true,
        type: 'array',
        desc: '用户id',
      },
    });
    const { id, user_ids } = ctx.request.body;
    // 是否存在
    const group = await app.model.Group.findOne({
      where: {
        id,
        status: 1,
      },
      include: [{
        model: app.model.GroupUser,
        attributes: [ 'user_id', 'nickname' ],
        include: [{
          model: app.model.User,
          attributes: [ 'username', 'nickname', 'avatar' ],
        }],
      }],
    });
    if (!group) {
      return ctx.apiFail('该群聊不存在或者已被封禁');
    }
    // 你是否是该群成员
    const index = group.group_users.findIndex(item => item.user_id === current_user_id);
    if (index === -1) {
      return ctx.apiFail('你不是该群成员');
    }

    // 排除掉已经在该群聊的成员
    const groupUsers = group.group_users.map(item => item.user_id);
    const inviteUsers = user_ids.filter(id => !groupUsers.includes(id));
    if (!inviteUsers.length) {
      return ctx.apiFail('你邀请的所有成员均已存在该群聊');
    }
    // 查找所有没有被禁用的人
    const _users = await app.model.User.findAll({
      where: {
        id: { [app.Sequelize.Op.in]: inviteUsers },
        status: 1,
      },
    });

    const invitename = _users.map(item => {
      return item.nickname || item.username;
    }).join('；');
    // 加入该群
    const options = [];
    for (const item of _users) {
      options.push({
        user_id: item.id,
        group_id: group.id,
      });
    }
    await app.model.GroupUser.bulkCreate(options);
    const usersMap = _users.reduce((acc, obj) => {
      acc[obj.id] = obj;
      return acc;
    }, {});
    // 加入群成员
    // https://cloud.tencent.com/document/product/269/1608
    const host = this.app.config.im.hostname;
    const sdkappid = this.app.config.im.SDKAppID;
    // 随机的32位无符号整数，取值范围0 - 4294967295
    const random = Math.floor(Math.random() * 4294967295);
    // 必须为 App 管理员账号
    const identifier = 'administrator';
    // 生成腾讯IM usersign
    const api = new Api(this.app.config.im.SDKAppID, this.app.config.im.SDKSecretKey);
    const usersig = api.genUserSig(identifier, 5 * 1000);
    // 加入群成员
    const path = 'v4/group_open_http_svc/add_group_member';
    const url = `https://${host}/${path}?sdkappid=${sdkappid}&identifier=${identifier}&usersig=${usersig}&random=${random}&contenttype=json`;
    const MemberList = _users.map(v => {
      return {
        Member_Account: v.username,
      };
    });
    const res2 = await axios.post(url, {
      GroupId: group.group_id, // 要操作的群组（必填）
      MemberList, // 一次最多添加100个成员
    });
    if (res2.data.ErrorCode !== 0) ctx.throw('腾讯IM添加群成员失败');
    // 返回成功
    ctx.apiSuccess('ok');
    // 拿到所有用户的头像
    let avatars = group.group_users.map(item => item.user.avatar);
    // 加入被邀请人头像
    for (const item of _users) {
      avatars.push(item.avatar);
    }
    // 过滤有效的头像
    avatars = avatars.filter(item => item);
    // 如果大于9张则随机取9张
    if (avatars.length > 9) {
      avatars = avatars.sort(() => Math.random() - 0.5).slice(0, 9);
    }
    let avatar = '';
    if (avatars.length > 2) {
      // 删除之前的旧头像
      if (group.avatar) {
        await ctx.app.minio.removeObject('group-info', this.getFileName(group.avatar));
      }
      avatar = await this.ctx.service.groupAvatar.generateGridImage(avatars);
      // 修改群头像
      await group.update({ avatar });
    }
    // 获取群成员头像
    const avatarList = group.group_users.map(v => {
      return {
        user_id: v.user_id,
        avatar: v.user.avatar,
      };
    });
    // 加入被邀请人
    for (const item of _users) {
      avatarList.push({ user_id: item.id, avatar: item.avatar });
    }
    // 构建消息格式
    const from_name = group.group_users[index].nickname || ctx.authUser.nickname || ctx.authUser.username;
    const message = {
      message_id: uuidv4(), // 唯一id，后端生成唯一id
      from_avatar: ctx.authUser.avatar, // 发送者头像
      from_name, // 发送者昵称
      from_id: current_user_id, // 发送者id
      to_id: group.id, // 接收人/群 id
      to_name: group.name, // 接收人/群 名称
      to_avatar: avatar, // 接收人/群 头像
      chat_type: 'group', // 接收类型
      type: 'system', // 消息类型
      data: `${from_name} 邀请 ${invitename} 加入群聊`, // 消息内容
      options: '{}', // 其他参数
      create_time: (new Date()).getTime(), // 创建时间
      isremove: 0, // 是否撤回
      isread: 0, // 是否已读
      group,
      avatarList,
    };
    const users = group.group_users.map(item => item.user_id);
    // 把邀请人加入
    for (const item of _users) {
      users.push(item.id);
    }
    // 消息推送
    users.forEach(id => {
      // 如果是被邀请的那个人
      const messageType = usersMap[id] ? 'invite_group' : undefined;
      let data = message.data;
      // 正则表达式，判断是否是邀请人，如果有邀请人的名字则替换为"你"
      if (usersMap[id]) {
        const name = usersMap[id].nickname || usersMap[id].username;
        const pattern = new RegExp("\\b" + name + "\\b", 'g');
        data = message.data.replace(pattern, '你');
      }
      if (id === current_user_id) {
        const name = from_name;
        const pattern = new RegExp("\\b" + name + "\\b", 'g');
        data = message.data.replace(pattern, '你')
      }
      ctx.sendAndSaveMessage(id, { ...message, data }, messageType);
    });
  }

  // 生成群二维码
  async qrcode() {
    const { ctx } = this;
    ctx.qrcode(JSON.stringify({
      id: ctx.params.id,
      type: 'group',
      event: 'navigateTo',
    }));
  }

  // 验证群聊和当前用户的关系
  async checkrelation() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    // 验证参数
    ctx.validate({
      id: {
        required: true,
        type: 'int',
        desc: '群组id',
      },
    });
    const id = ctx.request.body.id;
    // 群组是否存在
    const group = await app.model.Group.findOne({
      where: {
        status: 1,
        id,
      },
      include: [{
        model: app.model.GroupUser,
        attributes: [ 'user_id', 'nickname' ],
        include: [{
          model: app.model.User,
          attributes: [ 'id', 'nickname', 'avatar', 'username' ],
        }],
      }],
    });

    if (!group) {
      return ctx.apiFail('该群聊不存在或者已被封禁');
    }

    // 当前用户是否是该群成员
    const index = group.group_users.findIndex(item => item.user_id === current_user_id);
    if (index === -1) {
      return ctx.apiSuccess({
        status: false,
        group: {
          id: group.id,
          name: group.name,
          avatar: group.avatar,
          users_count: group.group_users.length,
        },
      });
    }

    ctx.apiSuccess({
      status: true,
      group: {
        id: group.id,
        name: group.name,
        avatar: group.avatar,
        users_count: group.group_users.length,
      },
    });
  }

  // 加入群聊
  async join() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    // 参数验证
    ctx.validate({
      id: {
        required: true,
        type: 'int',
        desc: '群组id',
      },
    });
    const { id } = ctx.request.body;
    // 是否存在
    const group = await app.model.Group.findOne({
      where: {
        id,
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
    // 你是否是该群成员
    const index = group.group_users.findIndex(item => item.user_id === current_user_id);
    if (index !== -1) {
      return ctx.apiFail('你已经是该群成员');
    }
    // 加入该群
    await app.model.GroupUser.create({
      user_id: current_user_id,
      group_id: group.id,
    });
    // 返回成功
    ctx.apiSuccess('ok');
    // 构建消息格式
    const from_name = ctx.authUser.nickname || ctx.authUser.username;
    const message = {
      message_id: uuidv4(), // 唯一id，后端生成唯一id
      from_avatar: ctx.authUser.avatar, // 发送者头像
      from_name, // 发送者昵称
      from_id: current_user_id, // 发送者id
      to_id: group.id, // 接收人/群 id
      to_name: group.name, // 接收人/群 名称
      to_avatar: group.avatar, // 接收人/群 头像
      chat_type: 'group', // 接收类型
      type: 'system', // 消息类型
      data: `${from_name} 加入群聊`, // 消息内容
      options: '{}', // 其他参数
      create_time: (new Date()).getTime(), // 创建时间
      isremove: 0, // 是否撤回
      isread: 0, // 是否已读
      group,
    };
    // 消息推送
    group.group_users.forEach(item => {
      ctx.sendAndSaveMessage(item.user_id, message);
    });
    ctx.sendAndSaveMessage(current_user_id, message, 'join_group');
  }

  getFileName(url) {
    const urlParts = url.split('?');
    // 获取数组中第一个元素，即文件名部分
    const fileName = urlParts[0].split('/').pop();
    return fileName;
  }
}
module.exports = GroupController;
