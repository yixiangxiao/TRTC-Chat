'use strict';
const { Controller } = require('egg');
const SortWord = require('sort-word');
const axios = require('axios');
const { Api } = require('../utils/tlssig-api');
class FriendController extends Controller {
  // 通讯录列表
  async getList() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    const friends = await ctx.model.Friend.findAndCountAll({
      where: {
        user_id: current_user_id,
      },
      include: [
        {
          model: app.model.User,
          as: 'friendInfo',
          attributes: [ 'id', 'username', 'nickname', 'avatar' ],
        },
      ],
    });

    const res = friends.rows.map(item => {
      let name = item.friendInfo.nickname || item.friendInfo.username;
      if (item.nickname) {
        name = item.nickname;
      }
      return {
        id: item.id,
        user_id: item.friendInfo.id,
        name,
        username: item.friendInfo.username,
        avatar: item.friendInfo.avatar,
      };
    });

    // 排序
    if (res.length > 0) {
      friends.rows = new SortWord(res, 'name');
    }
    ctx.apiSuccess(friends);
  }

  // 查看用户资料
  async getInfo() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    const { id } = ctx.params;
    const user = await ctx.model.User.findOne({
      where: {
        id,
        status: 1,
      },
      attributes: {
        exclude: [ 'password' ],
      },
      include: [{
        model: app.model.Moment,
        order: [
          [ 'id', 'desc' ],
        ],
        limit: 1,
      }],
    });

    if (!user) {
      ctx.throw('用户不存在');
    }
    const res = {
      id: user.id,
      username: user.username,
      nickname: user.nickname ? user.nickname : user.username,
      avatar: user.avatar,
      sex: user.sex,
      sign: user.sign,
      area: user.area,
      momentcover: user.momentcover,
      moments: current_user_id === id ? user.moments : [],
      friend: false,
    };
    const friend = await ctx.model.Friend.findOne({
      where: {
        user_id: current_user_id,
        friend_id: id,
      },
      include: [{
        model: app.model.Tag,
        attributes: [ 'name' ],
      }],
    });
    let data = {};
    if (friend) {
      const rows = await app.model.MomentTimeline.findAll({
        where: {
          user_id: current_user_id,
        },
        include: [{
          model: app.model.Moment,
          where: {
            user_id: id,
          },
        }],
        order: [
          [ 'id', 'DESC' ],
        ],
        limit: 1,
      });
      // const rowsJSON = rows.map(row => row.toJSON());
      // console.log(rowsJSON, 'xx')
      let moments = [];
      // 我是他的好友
      const bfriend = await ctx.model.Friend.findOne({
        where: {
          user_id: id,
          friend_id: current_user_id,
        },
      });
      // 不可见
      if (bfriend.isblack || friend.isblack || !bfriend.lookhim || !friend.lookme) {
        moments = [];
      } else {
        moments = rows.length ? [ rows[0].moment ] : [];
      }
      data = {
        ...res,
        nickname: friend.nickname ? friend.nickname : res.nickname,
        friend: true,
        lookhim: friend.lookhim,
        lookme: friend.lookme,
        star: friend.star,
        isblack: friend.isblack,
        tags: friend.tags.map(item => item.name),
        moments,
        momentcover: user.momentcover,
      };
      ctx.apiSuccess(data);
      return;
    }
    ctx.apiSuccess(res);
  }

  // 移入/移出黑名单
  async setBlack() {
    const { ctx } = this;
    const current_user_id = ctx.authUser.id;
    const { id } = ctx.params;
    // 参数验证
    ctx.validate({
      isblack: {
        type: 'int',
        required: true,
        range: [ 0, 1 ],
        desc: '移入/移出黑名单',
      },
    });
    const friend = await ctx.model.Friend.findOne({
      where: {
        user_id: current_user_id,
        friend_id: id,
      },
    });
    if (!friend) {
      // return ctx.apiFail('没有找到该好友');
      ctx.throw('没有找到该好友或者该好友已被拉黑');
    }
    const { isblack } = ctx.request.body;
    friend.isblack = isblack;
    await friend.save();
    ctx.apiSuccess('ok');
  }

  // 设置/取消星标好友
  async setStar() {
    const { ctx } = this;
    const current_user_id = ctx.authUser.id;
    const { id } = ctx.params;
    // 参数验证
    ctx.validate({
      star: {
        type: 'int',
        required: true,
        range: [ 0, 1 ],
        desc: '设置/取消星标好友',
      },
    });
    const friend = await ctx.model.Friend.findOne({
      where: {
        user_id: current_user_id,
        friend_id: id,
        isblack: 0, // 没有被拉黑
      },
    });
    if (!friend) {
      // return ctx.apiFail('没有找到该好友或者该好友已被拉黑');
      ctx.throw('没有找到该好友或者该好友已被拉黑');
    }
    const { star } = ctx.request.body;
    friend.star = star;
    await friend.save();
    ctx.apiSuccess('ok');
  }

  // 设置朋友圈权限
  async setMomentAuth() {
    const { ctx } = this;
    const current_user_id = ctx.authUser.id;
    const { id } = ctx.params;
    // 参数验证
    ctx.validate({
      lookme: {
        type: 'int',
        required: true,
        range: [ 0, 1 ],
        desc: '看我',
      },
      lookhim: {
        type: 'int',
        required: true,
        range: [ 0, 1 ],
        desc: '看他',
      },
    });
    const friend = await ctx.model.Friend.findOne({
      where: {
        user_id: current_user_id,
        friend_id: id,
        isblack: 0, // 没有被拉黑
      },
    });
    if (!friend) {
      // return ctx.apiFail('没有找到该好友或者该好友已被拉黑');
      ctx.throw('没有找到该好友或者该好友已被拉黑');
    }
    const { lookme, lookhim } = ctx.request.body;
    friend.lookme = lookme;
    friend.lookhim = lookhim;
    await friend.save();
    ctx.apiSuccess('ok');
  }

  // 获取所有标签
  async getAllTag() {
    const { ctx } = this;
    // 去重查询
    const result = await ctx.model.Tag.findAll({
      attributes: [ 'name' ],
      group: [ 'name' ],
    });
    const tags = result.map(item => item.name);
    ctx.apiSuccess(tags);
  }

  // 设置备注和标签
  async setRemarkAndTag() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    const { id } = ctx.params;
    // 参数验证
    ctx.validate({
      nickname: {
        type: 'string',
        required: false,
        desc: '昵称',
        defValue: '',
      },
      tags: {
        type: 'string',
        required: true,
        desc: '标签',
      },
    });
    // 查看该好友是否存在
    const friend = await ctx.model.Friend.findOne({
      where: {
        user_id: current_user_id,
        friend_id: id,
        isblack: 0, // 没有被拉黑
      },
      include: [
        {
          model: app.model.Tag,
        },
      ],
    });
    if (!friend) {
      return ctx.apiFail('没有找到该好友或者该好友已被拉黑');
    }
    const { nickname = '', tags = '' } = ctx.request.body;
    // console.log(friend.toJSON());
    // 设置备注
    friend.nickname = nickname;
    await friend.save();
    // 获取当前用户所有标签
    const tags_arr = await app.model.Tag.findAll({
      where: { user_id: current_user_id },
    });
    // 拿到标签名
    const allTagsName = tags_arr.map(item => item.name);
    // 传入的标签
    const newTagName = tags.split(',');
    // 需要添加的标签
    const addTags = newTagName.filter(name => !allTagsName.includes(name));
    // 写入tag表数据
    const inserDatas = addTags.map(name => ({ name, user_id: current_user_id }));
    await app.model.Tag.bulkCreate(inserDatas);

    // 查询新插入的数据
    const _Tags = await app.model.Tag.findAll({
      where: { user_id: current_user_id, name: newTagName },
    });

    // 旧的标签
    const oldTagsId = friend.tags.map(v => v.id);
    // 新的标签
    const newTagsId = _Tags.map(v => v.id);

    // 需要添加的标签
    const needTagIds = newTagsId.filter(id => !oldTagsId.includes(id));
    // 组装数据
    const friend_tags = needTagIds.map(tag_id => ({ tag_id, friend_id: friend.id }));
    // 插入
    await app.model.FriendTag.bulkCreate(friend_tags);

    // 需要删除的标签
    const delTagIds = oldTagsId.filter(id => !newTagsId.includes(id));
    // 删除
    await app.model.FriendTag.destroy({
      where: {
        friend_id: friend.id,
        tag_id: delTagIds,
      },
    });
    ctx.apiSuccess('ok');
  }

  // 删除好友
  async destroy() {
    const { ctx, app } = this;
    const current_user_id = ctx.authUser.id;
    ctx.validate({
      friend_id: {
        type: 'int',
        required: true,
        desc: '好友id',
      },
    });
    const { friend_id } = ctx.request.body;
    // 删除自己好友
    await app.model.Friend.destroy({
      where: {
        user_id: current_user_id,
        friend_id,
      },
    });

    ctx.apiSuccess('ok');

    // 删除对方好友
    app.model.Friend.destroy({
      where: {
        user_id: friend_id,
        friend_id: current_user_id,
      },
    });

    this.deleteTimeLineMoment(friend_id, current_user_id);
    this.deleteTimeLineMoment(current_user_id, friend_id);

    // 删除apply表对应数据
    app.model.Apply.destroy({
      where: {
        user_id: current_user_id,
        friend_id,
      },
    });

    app.model.Apply.destroy({
      where: {
        user_id: friend_id,
        friend_id: current_user_id,
      },
    });
  }

  async deleteTimeLineMoment(friend_id, user_id) {
    const { app } = this;
    let moments = await app.model.Moment.findAll({
      where: {
        user_id: friend_id,
      },
      attributes: [ 'id' ],
    });
    moments = moments.map(item => item.id);
    await app.model.MomentTimeline.destroy({
      where: {
        user_id,
        moment_id: moments,
      },
    });
  }
}
module.exports = FriendController;
