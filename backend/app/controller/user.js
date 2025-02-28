'use strict';
const { compareSync } = require('../utils/bcrypt');
const { Api } = require('../utils/tlssig-api');
const { Controller } = require('egg');
const axios = require('axios');
class UserController extends Controller {
  async register() {
    const { ctx, app } = this;
    ctx.validate({
      username: {
        type: 'string',
        required: true,
        range: {
          min: 5,
          max: 20,
        },
        desc: '用户名',
      },
      password: { type: 'string', required: true, desc: '密码', range: { min: 6, max: 20 } },
      yzm: { type: 'string', required: true, desc: '验证码' },
      email: { type: 'string', required: true, desc: '邮箱' },
      repassword: { type: 'string', required: true, desc: '确认密码', range: { min: 6, max: 20 } },
    }, { equals: [[ 'password', 'repassword' ]] });
    const { username, password, yzm, email } = ctx.request.body;
    const isYzm = await this.service.yzm.judgeMail(yzm, email);
    if (!isYzm) {
      ctx.throw('验证码错误');
    }
    const user = await app.model.User.findOne({ where: { username } });
    if (user) {
      ctx.throw('用户名已存在');
    }
    const newUser = await app.model.User.create({ username, password, email });
    if (!newUser) {
      ctx.throw('注册失败');
    }

    // 注册成功需要把人员加入腾讯IM用户中
    // https://cloud.tencent.com/document/product/269/1608
    const host = app.config.im.hostname;
    const sdkappid = app.config.im.SDKAppID;
    // 随机的32位无符号整数，取值范围0 - 4294967295
    const random = Math.floor(Math.random() * 4294967295);
    // 必须为 App 管理员账号
    const identifier = 'administrator';
    // 生成腾讯IM usersign
    const api = new Api(app.config.im.SDKAppID, app.config.im.SDKSecretKey);
    const usersig = api.genUserSig(identifier, 5 * 1000);
    const path = 'v4/im_open_login_svc/multiaccount_import';
    const url = `https://${host}/${path}?sdkappid=${sdkappid}&identifier=${identifier}&usersig=${usersig}&random=${random}&contenttype=json`;
    axios.post(url, { AccountList: [{ UserID: username }] }).then(res => {
      if (res.data.ErrorCode === 0) {
        ctx.apiSuccess(newUser);
      } else {
        ctx.throw('写入腾讯IM用户失败');
      }
    });
    // ctx.apiSuccess(newUser);
  }
  async login() {
    const { ctx, app } = this;
    // 参数验证
    ctx.validate({
      username: {
        type: 'string',
        required: true,
        desc: '用户名',
      },
      password: { type: 'string', required: true, desc: '密码' },
      deviceId: { type: 'string', required: false, desc: '设备ID' },
    });
    // 验证该用户是否存在 | 验证该用户状态是否启用
    const { username, password, deviceId } = ctx.request.body;
    let user = await app.model.User.findOne({ where: { username, status: 1 } });
    if (!user) {
      ctx.throw(400, '用户不存在或已被禁用');
    }
    if (!compareSync(password, user.password)) {
      ctx.throw(400, '密码错误');
    }

    user = user.toJSON();
    delete user.password;
    // user = JSON.parse(JSON.stringify(user));
    // 生成token
    const token = ctx.getToken(user);
    user.token = token;
    // 加入缓存
    if (!await this.service.cache.set('user_' + user.id, token)) {
      ctx.throw(400, '登录失败');
    }
    // 拿到对应的设备id
    const _deviceId = await this.service.cache.get('device_' + user.id);
    // 拿到上线记录
    const online = await this.service.cache.get('online_' + user.id);
    // 如果设备id存在 并且不相等 并且上线记录存在
    if (_deviceId && deviceId !== _deviceId && online) {
      await ctx.loginOnline(user.id); // 用户上线 通知其他设备
    }
    await this.service.cache.set('device_' + user.id, deviceId);
    // 生成腾讯IM usersign
    const api = new Api(app.config.im.SDKAppID, app.config.im.SDKSecretKey);
    // 设置过期时间为 2个月
    const usersig = api.genUserSig(user.username, 1000 * 60 * 24 * 31 * 2);
    // 返回用户信息和token
    user.usersig = usersig;
    ctx.apiSuccess(user);
  }
  async logout() {
    const { ctx, service } = this;
    // 拿到当前用户id
    const current_user_id = ctx.authUser.id;
    // 移除redis
    if (!await service.cache.remove('user_' + current_user_id)) {
      ctx.throw(400, '退出用户失败');
    }
    // 移除 device
    if (!await service.cache.remove('device_' + current_user_id)) {
      ctx.throw(400, '退出用户失败');
    }
    ctx.apiSuccess('退出成功');
  }
  // 搜索用户
  async searchUser() {
    const { ctx } = this;
    // 参数验证
    ctx.validate({
      keyword: {
        type: 'string',
        required: true,
        desc: '关键词',
      },
    });
    const { keyword } = ctx.request.body;
    const data = await this.ctx.model.User.findOne({
      where: {
        username: keyword,
      },
      attributes: {
        exclude: [ 'password' ],
      },
    });
    ctx.apiSuccess(data);
  }
  // 用户名是否存在
  async checkUserName() {
    const { ctx } = this;
    // 参数验证
    ctx.validate({
      username: {
        type: 'string',
        required: true,
        desc: '用户名',
      },
    });
    const { username } = ctx.request.body;
    const data = await this.ctx.model.User.findOne({
      where: {
        username,
      },
    });
    if (!data) {
      ctx.apiSuccess(false);
    } else {
      ctx.apiSuccess(true);
    }
  }
  // 邮箱是否存在
  async checkEmail() {
    const { ctx } = this;
    // 参数验证
    ctx.validate({
      email: {
        type: 'string',
        required: true,
        desc: '邮箱',
      },
    });
    const { email } = ctx.request.body;
    const data = await this.ctx.model.User.findOne({
      where: {
        email,
      },
    });
    if (!data) {
      ctx.apiSuccess(false);
    } else {
      ctx.apiSuccess(true);
    }
  }
  // 忘记密码
  async forgetPassword() {
    const { ctx } = this;
    ctx.validate({
      password: { type: 'string', required: true, desc: '密码', range: { min: 6, max: 20 } },
      yzm: { type: 'string', required: true, desc: '验证码' },
      email: { type: 'string', required: true, desc: '邮箱' },
      repassword: { type: 'string', required: true, desc: '确认密码', range: { min: 6, max: 20 } },
    }, { equals: [[ 'password', 'repassword' ]] });
    const { password, yzm, email } = ctx.request.body;
    const isYzm = await this.service.yzm.judgeMail(yzm, email);
    if (!isYzm) {
      ctx.throw('验证码错误');
    }
    const data = await this.ctx.model.User.findOne({
      where: {
        email,
      },
    });
    if (!data) {
      ctx.throw('邮箱不存在');
    }
    let user = await data.update({ password });
    user = user.toJSON();
    delete user.password;
    ctx.apiSuccess(user);
  }

  // 生成个人二维码名片
  async qrcode() {
    const { ctx } = this;
    ctx.qrcode(JSON.stringify({
      id: ctx.params.id,
      type: 'user',
    }));
  }

  // 修改个人资料
  async updateInfo() {
    const { ctx } = this;
    ctx.validate({
      avatar: {
        type: 'url',
        required: false,
        defValue: '',
        desc: '头像',
      },
      nickname: {
        type: 'string',
        required: false,
        defValue: '',
        desc: '昵称',
      },
      sex: {
        type: 'string',
        required: false,
        defValue: '保密',
        desc: '性别',
      },
      area: {
        type: 'string',
        required: false,
        defValue: '',
        desc: '区域',
      },
    });

    const { avatar, nickname, sex, area } = ctx.request.body;
    // 删除之前的旧头像
    if (avatar && ctx.authUser.avatar && avatar !== ctx.authUser.avatar) {
      await ctx.app.minio.removeObject('user-info', this.getFileName(ctx.authUser.avatar));
    }
    ctx.authUser.avatar = avatar;
    ctx.authUser.nickname = nickname;
    ctx.authUser.sex = sex;
    ctx.authUser.area = area;
    await ctx.authUser.save();
    // 修改个人信息
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
    const path = 'v4/profile/portrait_set';
    const url = `https://${host}/${path}?sdkappid=${sdkappid}&identifier=${identifier}&usersig=${usersig}&random=${random}&contenttype=json`;
    const res = await axios.post(url, {
      From_Account: ctx.authUser.username,
      ProfileItem: [
        {
          Tag: 'Tag_Profile_IM_Nick',
          Value: nickname,
        },
        {
          Tag: 'Tag_Profile_IM_Image',
          Value: avatar,
        },
      ],
    });
    if (res.data.ErrorCode !== 0) {
      ctx.throw('腾讯IM修改个人信息失败');
    }
    return ctx.apiSuccess('ok');
  }

  // 修改朋友圈封面
  async updateCover() {
    const { ctx } = this;
    ctx.validate({
      momentcover: {
        type: 'url',
        required: true,
        desc: '朋友圈封面',
      },
    });
    const { momentcover } = ctx.request.body;
    // 删除之前的旧封面
    if (ctx.authUser.momentcover) {
      await ctx.app.minio.removeObject('moments', this.getFileName(ctx.authUser.momentcover));
    }
    ctx.authUser.momentcover = momentcover;
    await ctx.authUser.save();
    return ctx.apiSuccess('ok');
  }

  getFileName(url) {
    const urlParts = url.split('?');
    // 获取数组中第一个元素，即文件名部分
    const fileName = urlParts[0].split('/').pop();
    return fileName;
  }
}
module.exports = UserController;
