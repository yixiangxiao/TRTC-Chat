'use strict';
module.exports = app => {
  const { STRING, INTEGER, DATE } = app.Sequelize;
  // 配置（重要：一定要配置详细，一定要！！！）
  const Yzm = app.model.define('yzm', {
    id: {
      type: INTEGER(20).UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    yzm: {
      type: STRING(30),
      allowNull: false,
      defaultValue: '',
      comment: '验证码',
    },
    email: {
      type: STRING(160),
      comment: '用户邮箱',
      unique: true,
    },
    created_at: DATE,
    updated_at: DATE,
  });
  return Yzm;
};
