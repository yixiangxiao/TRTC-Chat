'use strict';
module.exports = app => {
  const { INTEGER, DATE } = app.Sequelize;
  // 配置（重要：一定要配置详细，一定要！！！）
  const MomentLike = app.model.define('moment_like', {
    id: {
      type: INTEGER(20).UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: INTEGER(20).UNSIGNED,
      allowNull: false,
      comment: '点赞用户id',
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
    created_at: DATE,
    updated_at: DATE,
  });

  MomentLike.associate = function() {
    MomentLike.belongsTo(app.model.User, {
      foreignKey: 'user_id',
    });
  };

  return MomentLike;
};
