'use strict';
module.exports = app => {
  const { INTEGER, DATE } = app.Sequelize;
  // 配置（重要：一定要配置详细，一定要！！！）
  const MomentTimeline = app.model.define('moment_timeline', {
    id: {
      type: INTEGER(20).UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: INTEGER(20).UNSIGNED,
      allowNull: false,
      comment: '用户id',
      //  定义外键（重要）
      references: {
        model: 'user', // 对应表名称（数据表名称）
        key: 'id', // 对应表的主键
      },
      onUpdate: 'restrict', // 更新时操作
      onDelete: 'cascade', // 删除时操作
    },
    moment_id: {
      type: INTEGER(20).UNSIGNED,
      allowNull: false,
      comment: '朋友圈消息id',
      //  定义外键（重要）
      references: {
        model: 'moment', // 对应表名称（数据表名称）
        key: 'id', // 对应表的主键
      },
      onUpdate: 'restrict', // 更新时操作
      onDelete: 'cascade', // 删除时操作
    },
    own: {
      type: INTEGER(1),
      allowNull: false,
      defaultValue: 0,
      comment: '是否是自己的 0否1是',
    },
    created_at: {
      type: DATE,
      get() {
        return new Date(this.getDataValue('created_at')).getTime();
      },
    },
    updated_at: DATE,
  });

  MomentTimeline.associate = function() {
    MomentTimeline.belongsTo(app.model.Moment, {
      foreignKey: 'moment_id',
    });
    MomentTimeline.belongsTo(app.model.User, {
      foreignKey: 'user_id',
    });
  };

  return MomentTimeline;
};
