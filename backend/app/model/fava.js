'use strict';
module.exports = app => {
  const { INTEGER, DATE, ENUM, TEXT } = app.Sequelize;
  // 配置（重要：一定要配置详细，一定要！！！）
  const Fava = app.model.define('fava', {
    id: {
      type: INTEGER(20).UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    data: {
      type: TEXT,
      allowNull: false,
      defaultValue: '',
      comment: '内容',
    },
    name: {
      type: TEXT,
      allowNull: false,
      defaultValue: '',
      comment: '会话名称',
    },
    type: {
      type: ENUM,
      values: [ 'emoji', 'text', 'image', 'video', 'audio', 'position' ],
      allowNull: false,
      defaultValue: 'text',
      comment: '类型',
    },
    options: {
      type: TEXT,
      allowNull: false,
      defaultValue: '',
      comment: '其他参数',
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
    created_at: DATE,
    updated_at: DATE,
  });

  return Fava;
};
