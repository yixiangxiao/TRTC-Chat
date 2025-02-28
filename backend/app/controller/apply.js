'use strict';
const { Controller } = require('egg');
const { v4: uuidv4 } = require('uuid');
class ApplyController extends Controller {
  // 1.参数验证
  // 2.不能添加自己
  // 3.对方是否存在
  // 4.之前是否申请过了
  // 5.创建申请
  async addFriend() {
    const { ctx } = this;
    const current_user_id = ctx.authUser.id;
    // 参数验证
    ctx.validate({
      friend_id: {
        type: 'int',
        required: true,
        desc: '好友id',
      },
      nickname: { type: 'string', required: false, desc: '昵称' },
      lookme: { type: 'int', required: true, range: { in: [ 0, 1 ] }, desc: '看我朋友圈' },
      lookhim: { type: 'int', required: true, range: { in: [ 0, 1 ] }, desc: '看他朋友圈' },
    });
    const { friend_id, nickname, lookme, lookhim } = ctx.request.body;
    // 不能添加自己
    if (current_user_id === friend_id) {
      ctx.throw(400, '不能添加自己');
    }
    // 对方是否存在 或者被禁用
    const user = await ctx.model.User.findOne({
      where: { id: friend_id, status: 1 },
    });
    if (!user) {
      ctx.throw(400, '该用户不存在或者已被禁用');
    }
    // 之前是否申请过了
    const apply = await ctx.model.Apply.findOne({
      where: { user_id: current_user_id, friend_id, status: [ 'pending', 'agree' ] },
    });
    if (apply) {
      ctx.throw(400, '你之前已经申请过了');
    }
    // 创建申请
    const result = await ctx.model.Apply.create({
      user_id: current_user_id,
      friend_id,
      nickname,
      lookme,
      lookhim,
    });

    if (!result) {
      ctx.throw(400, '申请失败');
    }
    ctx.apiSuccess(result);
    // 消息推送
    ctx.send(friend_id, { message_id: uuidv4() }, 'updateApplyList');
  }
  // 收到的好友申请列表
  async applyList() {
    const { ctx, app } = this;
    let { page = 1, limit = 10 } = ctx.query;
    // 注意类型 limit offset需为number类型
    page = page ? parseInt(page) : 1;
    limit = limit ? parseInt(limit) : 1;
    const offset = (page - 1) * limit;
    const current_user_id = ctx.authUser.id;
    const res = await ctx.model.Apply.findAll(
      {
        where: {
          friend_id: current_user_id,
        },
        include: [{ model: app.model.User, attributes: [ 'id', 'username', 'nickname', 'avatar' ] }],
        offset,
        limit,
        order: [[ 'created_at', 'DESC' ]],
      }
    );

    const count = await ctx.model.Apply.count({
      where: {
        friend_id: current_user_id,
        status: 'pending',
      },
    });
    ctx.apiSuccess({ list: res, count });
  }

  // 处理好友申请
  async applyHandle() {
    const { ctx, app } = this;
    const { status, nickname, lookhim, lookme } = ctx.request.body;
    // 处理人 被添加好友的人
    const current_user_id = ctx.authUser.id;
    const id = parseInt(ctx.params.id);
    // 参数验证
    ctx.validate({
      status: {
        type: 'string',
        required: true,
        range: [ 'refuse', 'agree', 'ignore' ],
        desc: '处理结果',
      },
      nickname: { type: 'string', required: false, desc: '昵称' },
      lookme: { type: 'int', required: true, range: { in: [ 0, 1 ] }, desc: '看我朋友圈' },
      lookhim: { type: 'int', required: true, range: { in: [ 0, 1 ] }, desc: '看他朋友圈' },
    });

    // 查询该申请是否存在
    const apply = await ctx.model.Apply.findOne({
      where: {
        id,
        friend_id: current_user_id,
        status: 'pending',
      },
      include: [{
        model: app.model.User,
      }],
    });
    if (!apply) {
      ctx.throw('该记录不存在');
    }
    let transaction;
    try {
      // 开启事务
      transaction = await app.model.transaction();
      // 设置该申请状态
      await apply.update({ status }, { transaction });
      if (status === 'agree') {
        // 查询好友是否存在(避免出现两个人同时点同意，插入两遍的情况)
        // 查询他的好友里是否存在
        const friend = await ctx.model.Friend.findOne({ where: {
          friend_id: current_user_id,
          user_id: apply.user_id,
        } });
        // 查询我的好友里
        const myFriend = await ctx.model.Friend.findOne({ where: {
          user_id: current_user_id,
          friend_id: apply.user_id,
        } });
        // 加入到对方好友列表
        if (!friend) {
          await ctx.model.Friend.create({
            friend_id: current_user_id,
            user_id: apply.user_id,
            nickname: apply.nickname,
            lookme: apply.lookme,
            lookhim: apply.lookhim,
          }, { transaction });
        }
        // 将对方加入到我的好友列表
        if (!myFriend) {
          await ctx.model.Friend.create({
            user_id: current_user_id,
            friend_id: apply.user_id,
            nickname,
            lookme,
            lookhim,
          }, { transaction });
        }

        this.applyHandleToTimeLine(apply.user_id, current_user_id);
        this.applyHandleToTimeLine(current_user_id, apply.user_id);
      }
      // 提交事务
      await transaction.commit();
      // 消息推送
      if (status === 'agree') {
        const message = {
          message_id: uuidv4(), // 唯一id，后端生成唯一id
          from_avatar: ctx.authUser.avatar, // 发送者头像
          from_name: apply.nickname || ctx.authUser.nickname || ctx.authUser.username, // 发送者昵称
          from_id: current_user_id, // 发送者id
          to_id: apply.user_id, // 接收人/群 id
          to_name: nickname || apply.user.nickname || apply.user.username, // 接收人/群 名称
          to_avatar: apply.user.avatar, // 接收人/群 头像
          chat_type: 'user', // 接收类型
          type: 'system', // 消息类型
          data: '你们已经是好友，可以开始聊天啦', // 消息内容
          options: '{}', // 其他参数
          create_time: (new Date()).getTime(), // 创建时间
          isremove: 0, // 是否撤回
          isread: 0, // 是否已读
        };

        // message引用类型 由于异步 数据可能被修改 需要复制一份
        ctx.sendAndSaveMessage(apply.user_id, { ...message });

        message.from_avatar = apply.user.avatar;
        message.from_name = nickname || apply.user.nickname || apply.user.username;
        message.from_id = apply.user.id;

        message.to_avatar = ctx.authUser.avatar;
        message.to_name = apply.nickname || ctx.authUser.nickname || ctx.authUser.username;
        message.to_id = current_user_id;
        // 给自己推送
        ctx.sendAndSaveMessage(current_user_id, { ...message });
      }
      return ctx.apiSuccess('操作成功');
    } catch (e) {
    // 事务回滚
      await transaction.rollback();
      return ctx.apiFail('操作失败');
    }
  }

  // 处理好友申请时加入朋友圈时间轴
  async applyHandleToTimeLine(user_id, friend_id) {
    const { app } = this;
    // 获取用户的所有朋友圈
    const moments = await app.model.Moment.findAll({
      where: {
        user_id,
      },
      attributes: [ 'id' ],
    });
    // 先判断朋友圈时间轴中是否存在
    const momentTimelines = await app.model.MomentTimeline.findAll({
      where: {
        user_id,
      },
      attributes: [ 'moment_id' ],
    });
    // 如果存在则过滤掉已经存在的
    const momentTimelinesIds = momentTimelines.map(item => item.moment_id);
    const momentsIds = moments.map(item => item.id);
    const momentsIdsDiff = momentsIds.filter(item => !momentTimelinesIds.includes(item));
    const addData = momentsIdsDiff.map(momentId => {
      return {
        user_id: friend_id,
        moment_id: momentId,
        own: 0, // 是否为自己
      };
    });
    // 添加到朋友圈时间轴中
    await app.model.MomentTimeline.bulkCreate(addData);
  }
}
module.exports = ApplyController;
