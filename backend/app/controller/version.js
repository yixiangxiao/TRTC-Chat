'use strict';
const { Controller } = require('egg');
class VersionController extends Controller {
  // 查询app版本信息
  async searchAppInfo() {
    const { ctx } = this;
    // 参数验证
    ctx.validate({
      appid: {
        type: 'string',
        required: true,
        desc: 'appid',
      },
      apptype: {
        type: 'string',
        required: true,
        desc: 'app类型',
      },
    });
    const { appid, apptype } = ctx.query;
    const appInfo = await this.ctx.model.AppVersion.findOne({
      where: {
        appid,
        apptype,
      },
      order: [['created_at', 'DESC']],
    });
    ctx.apiSuccess(appInfo);
  }

  // 保存版本信息
  async saveAppInfo() {
    const { ctx } = this;
    const params = ctx.request.body;
    // 保存
    const appInfo = await ctx.model.AppVersion.create(params);
    ctx.apiSuccess(appInfo);
  }

  // 查询app版本所有信息
  async searchAllAppInfo() {
    const { ctx } = this;
    // 参数验证
    ctx.validate({
      appid: {
        type: 'string',
        required: true,
        desc: 'appid',
      },
      apptype: {
        type: 'string',
        required: true,
        desc: 'app类型',
      },
    });
    const { appid, apptype } = ctx.query;
    const appInfo = await this.ctx.model.AppVersion.findAll({
      where: {
        appid,
        apptype,
      },
      order: [['created_at', 'DESC']],
    });
    ctx.apiSuccess(appInfo);
  }
}
module.exports = VersionController;
