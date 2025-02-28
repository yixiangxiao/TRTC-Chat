'use strict';
const { Controller } = require('egg');
const { v4: uuidv4 } = require('uuid');
class MomentController extends Controller {
  // 发布朋友圈
  async create() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    // 参数验证
    ctx.validate({
      content: {
        type: 'string',
        required: false,
        desc: '内容',
      },
      image: {
        type: 'string',
        required: false,
        desc: '图片',
      },
      video: {
        type: 'string',
        required: false,
        desc: '视频',
      },
      type: {
        type: 'string',
        required: true,
        range: {
          in: [ 'content', 'image', 'video' ],
        },
        desc: '朋友圈类型',
      },
      location: {
        type: 'string',
        required: false,
        desc: '位置',
      },
      remind: {
        type: 'string',
        required: false,
        defValue: '',
        desc: '提醒谁看',
      },
      see: {
        type: 'string',
        required: false,
        defValue: 'all',
        desc: '谁可以看',
      },
    });

    const { content, image, video, type, location, remind, see } = ctx.request.body;

    if (!ctx.request.body[type]) {
      return ctx.apiFail(`${type} 不能为空`);
    }

    const moment = await app.model.Moment.create({
      content,
      image,
      video,
      location,
      remind,
      see,
      user_id: current_user_id,
    });

    if (!moment) {
      return ctx.apiFail('发布失败');
    }

    // 推送到好友的时间轴
    this.toTimeline(moment);

    ctx.apiSuccess('ok');
  }

  // 推送到好友的时间轴
  async toTimeline(moment) {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    // 获取当前用户所有好友
    const friends = await app.model.Friend.findAll({
      where: {
        user_id: current_user_id,
        isblack: 0,
      },
      attributes: [ 'friend_id' ],
    });
    // 谁可以看
    /**
         all                全部人可看 [all]
         only:1,2,3         指定人可见 [only, 1, 2, 3]
         except:1,2,3       谁不可看 [except, 1, 2, 3]
         none               仅自己可见 [none]
         */
    const sees = moment.see.split(':');
    const o = {
      only: [],
      except: [],
    };
    const oType = sees[0];

    // 如果为指定人可见，谁不可看则拿到对应的id
    if ((oType === 'only' || oType === 'except') && sees[1]) {
      o[oType] = sees[1].split(',').map(v => parseInt(v));
    }

    let addData = friends.filter(item => {
    // 如果为所有人可见，则加入所有好友id,为指定人可见则加入指定人id,谁不可看则去掉不可见人id
      return (
        oType === 'all' ||
        (oType === 'only' && o.only.includes(item.friend_id)) ||
        (oType === 'except' && !o.except.includes(item.friend_id))
      );
    });

    addData = addData.map(item => {
      return {
        user_id: item.friend_id,
        moment_id: moment.id,
        own: 0, // 是否为自己
      };
    });

    addData.push({
      user_id: current_user_id,
      moment_id: moment.id,
      own: 1,
    });
    // 推送到时间轴当中
    await app.model.MomentTimeline.bulkCreate(addData);

    // 消息推送
    const message = {
      message_id: uuidv4(), // 唯一id，后端生成唯一id
      avatar: ctx.authUser.avatar,
      user_id: current_user_id,
      type: 'new',
    };

    addData.forEach(item => {
      ctx.sendAndSaveMessage(item.user_id, message, 'moment');
    });

    // 提醒用户
    if (moment.remind) {
      const arr = moment.remind.split(',');
      arr.forEach(user_id => {
        ctx.sendAndSaveMessage(
          user_id,
          {
            avatar: ctx.authUser.avatar,
            user_id: current_user_id,
            type: 'remind',
            message_id: uuidv4(), // 唯一id，后端生成唯一id
          },
          'moment'
        );
      });
    }
  }

  // 点赞
  async like() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    ctx.validate({
      id: {
        type: 'int',
        required: true,
        desc: '朋友圈id',
      },
    });
    const { id } = ctx.request.body;
    const MomentTimeline = await app.model.MomentTimeline.findOne({
      where: {
        user_id: current_user_id,
        moment_id: id,
      },
      include: [{
        model: app.model.Moment,
        attributes: [ 'user_id' ],
        include: [{
          model: app.model.MomentLike, // 和moment关联
          attributes: [ 'user_id' ],
        }],
      }],
    });

    if (!MomentTimeline) {
      return ctx.apiFail('朋友圈消息不存在');
    }

    const like = await app.model.MomentLike.findOne({
      where: {
        user_id: current_user_id,
        moment_id: id,
      },
    });

    const message = {
      avatar: ctx.authUser.avatar,
      user_id: current_user_id,
      type: 'like',
      message_id: uuidv4(), // 唯一id，后端生成唯一id
    };

    if (like) {
      await like.destroy();
      ctx.apiSuccess(MomentTimeline.moment.moment_likes);
    } else {
      await app.model.MomentLike.create({
        user_id: current_user_id,
        moment_id: id,
      });
      ctx.apiSuccess(MomentTimeline.moment.moment_likes);
    }

    // 通知作者
    if (MomentTimeline.moment.user_id && MomentTimeline.moment.user_id !== current_user_id) {
      ctx.sendAndSaveMessage(MomentTimeline.moment.user_id, message, 'moment');
    }
    // 通知相关人
    MomentTimeline.moment.moment_likes.forEach(item => {
      if (item.user_id !== current_user_id) {
        ctx.sendAndSaveMessage(item.user_id, message, 'moment');
      }
    });

  }

  // 朋友圈评论
  async comment() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    ctx.validate({
      id: {
        type: 'int',
        required: true,
        desc: '朋友圈id',
      },
      content: {
        type: 'string',
        required: true,
        desc: '评论内容',
      },
      reply_id: {
        type: 'int',
        required: true,
        defValue: 0,
        desc: '回复id',
      },
    });

    const { id, content, reply_id } = ctx.request.body;

    const MomentTimeline = await app.model.MomentTimeline.findOne({
      where: {
        user_id: current_user_id,
        moment_id: id,
      },
      include: [{
        model: app.model.Moment,
        attributes: [ 'user_id' ],
        include: [{
          model: app.model.MomentLike,
          attributes: [ 'user_id' ],
        }],
      }],
    });

    if (!MomentTimeline) {
      return ctx.apiFail('朋友圈消息不存在');
    }

    const comment = await app.model.MomentComment.create({
      user_id: current_user_id,
      moment_id: id,
      content,
      reply_id,
    });

    ctx.apiSuccess(comment);

    const message = {
      avatar: ctx.authUser.avatar,
      user_id: current_user_id,
      type: 'comment',
      message_id: uuidv4(), // 唯一id，后端生成唯一id
    };
    // 通知作者
    if (MomentTimeline.moment.user_id && MomentTimeline.moment.user_id !== current_user_id) {
      ctx.sendAndSaveMessage(MomentTimeline.moment.user_id, message, 'moment');
    }
    // 通知相关人
    MomentTimeline.moment.moment_likes.forEach(item => {
      if (item.user_id !== current_user_id) {
        ctx.sendAndSaveMessage(item.user_id, message, 'moment');
      }
    });

    // 通知被回复人(相关人不包含被回复的人)
    if (reply_id > 0) {
      const index = MomentTimeline.moment.moment_likes.findIndex(item => {
        return item.user_id === reply_id;
      });

      if (index === -1) {
        ctx.sendAndSaveMessage(reply_id, message, 'moment');
      }
    }
  }

  // 朋友圈列表
  async timeline() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    const page = ctx.query.page ? parseInt(ctx.query.page) : 1;
    const limit = ctx.query.limit ? parseInt(ctx.query.limit) : 10;
    const offset = (page - 1) * limit;
    const rows = await app.model.MomentTimeline.findAll({
      where: {
        user_id: current_user_id,
      },
      include: [{
        model: app.model.Moment,
        include: [{ // 发布人
          model: app.model.User,
          attributes: [ 'id', 'nickname', 'username', 'avatar' ],
        }, {
          model: app.model.MomentComment, // 评论
          attributes: {
            exclude: [ 'created_at', 'updated_at' ],
          },
          include: [{
            model: app.model.User,
            as: 'momentCommentUser', // 评论人
            attributes: [ 'id', 'nickname', 'username' ],
          }, {
            model: app.model.User,
            as: 'momentCommentReply', // 回复人
            attributes: [ 'id', 'nickname', 'username' ],
          }],
        }, {
          model: app.model.MomentLike, // 点赞
          attributes: [ 'user_id', 'moment_id' ],
          include: [{
            model: app.model.User, // 点赞人
            attributes: [ 'id', 'nickname', 'username' ],
          }],
        }],
      }],
      offset,
      limit,
      order: [
        [ 'id', 'DESC' ],
      ],
    });

    let friends = await app.model.Friend.findAll({
      where: {
        user_id: current_user_id,
        lookhim: 1,
      },
      attributes: [ 'friend_id', 'nickname' ],
    });

    const _friends = friends
    // 做映射
    const friendsMap = _friends.reduce((acc, obj) => {
      const item = obj.toJSON();
      acc[item.friend_id] = item;
      return acc;
    }, {});

    let bfriends = await app.model.Friend.findAll({
      where: {
        friend_id: current_user_id,
        lookme: 1,
      },
      attributes: [ 'user_id' ],
    });

    friends = friends.map(item => item.friend_id);
    bfriends = bfriends.map(item => item.user_id);
    // 共同好友
    friends = friends.filter(item => bfriends.includes(item));

    const res = [];
    rows.forEach(item => {
      if (friends.includes(item.moment.user_id) || item.moment.user_id === current_user_id) {
        // 评论
        const comments = [];
        item.moment.moment_comments.forEach(v => {
          if (friends.includes(v.momentCommentUser.id) || v.momentCommentUser.id === current_user_id) {
            comments.push({
              content: v.content,
              id: v.id,
              user: {
                id: v.momentCommentUser.id,
                name: friendsMap[v.momentCommentUser.id]?.nickname || v.momentCommentUser.nickname || v.momentCommentUser.username,
              },
              reply: v.momentCommentReply ? {
                id: v.momentCommentReply.id,
                name: friendsMap[v.momentCommentReply.id]?.nickname || v.momentCommentReply.nickname || v.momentCommentReply.username,
              } : null,
            });
          }
        });

        // 点赞
        const likes = [];
        item.moment.moment_likes.forEach(v => {
          if (friends.includes(v.user.id) || v.user.id === current_user_id) {
            likes.push({
              id: v.user.id,
              name: friendsMap[v.user.id]?.nickname || v.user.nickname || v.user.username,
            });
          }
        });

        res.push({
          id: item.id, // 时间线id
          user_id: item.moment.user_id, // 发布人id
          user_name: friendsMap[item.moment.user_id]?.nickname || item.moment.user.nickname || item.moment.user.username,
          avatar: item.moment.user.avatar,
          moment_id: item.moment_id, // 朋友圈id
          content: item.moment.content, // 朋友圈内容
          image: item.moment.image ? item.moment.image.split(',') : [], // 朋友圈图片
          video: item.moment.video ? JSON.parse(item.moment.video) : null, // 朋友圈视频
          location: item.moment.location ? JSON.parse(item.moment.location) : null, // 位置
          own: item.own, // 是否自己发布
          created_at: item.created_at, // 时间
          comments,
          likes,
          see: item.moment.see, // 谁可以看
        });
      }
    });
    ctx.apiSuccess(res);
  }

  // 某个用户的朋友圈列表
  async list() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    const page = ctx.query.page ? parseInt(ctx.query.page) : 1;
    const limit = ctx.query.limit ? parseInt(ctx.query.limit) : 10;
    const offset = (page - 1) * limit;
    let user_id = ctx.query.user_id ? parseInt(ctx.query.user_id) : 0;
    let lookIds = [];

    // 获取当前用户所有好友（查找共同好友）
    const friends = await app.model.Friend.findAll({
      where: {
        user_id: current_user_id,
        isblack: 0,
      },
      attributes: [ 'friend_id', 'nickname' ],
    });

    const _friends = friends
    // 做映射
    const friendsMap = _friends.reduce((acc, obj) => {
      const item = obj.toJSON();
      acc[item.friend_id] = item;
      return acc;
    }, {});

    if (!user_id) {
      // 本人
      user_id = current_user_id;
      lookIds = false;
    } else {
      // 验证我是否具备权限
      const f = await app.model.User.findOne({
        where: {
          id: user_id,
          status: 1,
        },
        attributes: [ 'id', 'nickname', 'username', 'avatar' ],
        include: [{
          model: app.model.Friend,
          as: 'bfriends',
          where: {
            user_id: current_user_id,
          },
          attributes: [ 'lookhim', 'isblack' ],
        }, {
          model: app.model.Friend,
          as: 'friends',
          where: {
            friend_id: current_user_id,
          },
          attributes: [ 'lookme', 'isblack' ],
        }],
      });

      // 用户是否存在
      if (!f) {
        return ctx.apiFail('你无权查看或对方已被禁用');
      }
      // 是否是好友关系
      if (!f.bfriends.length || !f.friends.length) {
        return ctx.apiSuccess([]);
      }
      // 不可见
      if (f.bfriends[0].isblack || f.friends[0].isblack || !f.bfriends[0].lookhim || !f.friends[0].lookme) {
        return ctx.apiSuccess([]);
      }
      lookIds = friends.map(item => item.friend_id);
    }
    let rows = await app.model.Moment.findAll({
      where: {
        user_id,
      },
      include: [{
        model: app.model.User,
        attributes: [ 'id', 'nickname', 'username', 'avatar' ],
      }, {
        model: app.model.MomentComment,
        attributes: {
          exclude: [ 'created_at', 'updated_at' ],
        },
        include: [{
          model: app.model.User,
          as: 'momentCommentUser',
          attributes: [ 'id', 'nickname', 'username' ],
        }, {
          model: app.model.User,
          as: 'momentCommentReply',
          attributes: [ 'id', 'nickname', 'username' ],
        }],
      }, {
        model: app.model.MomentLike,
        attributes: [ 'user_id', 'moment_id' ],
        include: [{
          model: app.model.User,
          attributes: [ 'id', 'nickname', 'username' ],
        }],
      }],
      offset,
      limit,
      order: [
        [ 'id', 'DESC' ],
      ],
    });

    // 查询timeline时间轴中当前用户可见的对方朋友圈
    const timeline = await app.model.MomentTimeline.findAll({
      where: {
        user_id: current_user_id,
        moment_id: rows.map(item => item.id),
      }
    });

    // 拿到timeline所有的朋友圈id
    const timeline_ids = timeline.map(item => item.moment_id);

    // 拿到当前用户可见的朋友圈
    rows = rows.filter(item => timeline_ids.includes(item.id));


    const res = [];
    rows.forEach(item => {
      const comments = [];
      item.moment_comments.forEach(v => {
        // 如果是自己 或者评论id包含在共同好友里 或者评论id为自己
        if (!lookIds || lookIds.includes(v.momentCommentUser.id) || v.momentCommentUser.id === current_user_id) {
          comments.push({
            content: v.content,
            id: v.id,
            user: {
              id: v.momentCommentUser.id,
              name: friendsMap[v.momentCommentUser.id]?.nickname || v.momentCommentUser.nickname || v.momentCommentUser.username,
            },
            reply: v.momentCommentReply ? {
              id: v.momentCommentReply.id,
              name: friendsMap[v.momentCommentReply.id]?.nickname || v.momentCommentReply.nickname || v.momentCommentReply.username,
            } : null,
          });
        }
      });

      const likes = [];
      item.moment_likes.forEach(v => {
        if (!lookIds || lookIds.includes(v.user.id) || v.user.id === current_user_id) {
          likes.push({
            id: v.user.id,
            name: friendsMap[v.user.id]?.nickname || v.user.nickname || v.user.username,
          });
        }
      });

      res.push({
        user_id: item.user_id,
        user_name: friendsMap[item.user_id]?.nickname || item.user.nickname || item.user.username,
        avatar: item.user.avatar,
        moment_id: item.id,
        content: item.content,
        image: item.image ? item.image.split(',') : [],
        video: item.video ? JSON.parse(item.video) : null,
        location: item.location ? JSON.parse(item.location) : null,
        own: 1,
        created_at: item.created_at,
        comments,
        likes,
        see: item.see
      });
    });
    ctx.apiSuccess(res);
  }

  // 删除朋友圈
  async deleteMoment() {
    const { ctx } = this;
    const current_user_id = ctx.authUser.id;
    const { moment_id, image, video } = ctx.request.body;
    await ctx.app.model.Moment.destroy({
      where: {
        id: moment_id,
        user_id: current_user_id,
      },
    });
    // 删除moments中的文件
    if (image) {
      for (const item of image) {
        await ctx.app.minio.removeObject('moments', this.getFileName(item));
      }
    }
    if (video) {
      await ctx.app.minio.removeObject('moments', this.getFileName(video.src));
    }
    ctx.apiSuccess('ok');
  }

  // 删除评论
  async deleteComment() {
    const { ctx } = this;
    const current_user_id = ctx.authUser.id;
    const { comment_id } = ctx.request.body;
    await ctx.app.model.MomentComment.destroy({
      where: {
        id: comment_id,
        user_id: current_user_id,
      },
    });
    ctx.apiSuccess('ok');
  }


  getFileName(url) {
    const urlParts = url.split('?');
    // 获取数组中第一个元素，即文件名部分
    const fileName = urlParts[0].split('/').pop();
    return fileName;
  }
}
module.exports = MomentController;
