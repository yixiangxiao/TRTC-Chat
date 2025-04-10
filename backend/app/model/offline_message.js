'use strict';
module.exports = app => {
  const { INTEGER, DATE, TEXT } = app.Sequelize;
  // 配置（重要：一定要配置详细，一定要！！！）
  const OfflineMessage = app.model.define('offline_message', {
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
    message_id: {
      type: TEXT,
      allowNull: false,
      defaultValue: '',
      comment: '消息id',
    },
    message: {
      type: TEXT,
      allowNull: false,
      defaultValue: '',
      comment: '消息',
    },
    msg: {
      type: TEXT,
      allowNull: false,
      defaultValue: '',
      comment: '推送类型',
    },
    created_at: DATE,
    updated_at: DATE,
  });

  return OfflineMessage;
};
