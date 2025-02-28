const Subscription = require('egg').Subscription;

class DeleteUserSubscription extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      interval: '5m', // 5 分钟间隔
      type: 'all', // 指定所有的 worker 都需要执行
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    const { Sequelize } = this.app;
    const { Op } = Sequelize;
    const thirtyDaysAgo = new Date();
    // 查询30天未登录的用户
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const logs = await this.app.model.LoginLog.findAll({
      attributes: [ 'user_id' ],
      where: {
        created_at: {
          [Op.lt]: thirtyDaysAgo,
        },
      },
    });
    const Ids = logs.map(log => log.user_id);
    // 注销用户
    await this.app.model.User.destroy({
      where: {
        id: {
          [Op.in]: Ids,
        },
      },
    });
  }
}

module.exports = DeleteUserSubscription;
