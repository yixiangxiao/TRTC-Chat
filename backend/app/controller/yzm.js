'use strict';

const { Controller } = require('egg');

class YzmController extends Controller {
  async sendMail() {
    const { ctx } = this;
    const { email } = ctx.query;
    const result = await ctx.service.yzm.sendMail(email);
    ctx.apiSuccess(result);
  }
}

module.exports = YzmController;
