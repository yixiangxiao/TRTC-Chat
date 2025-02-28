'use strict';
const { hashSync } = require('../utils/bcrypt');
module.exports = app => {
  const { STRING, INTEGER, DATE, ENUM, TEXT } = app.Sequelize;
  // 配置（重要：一定要配置详细，一定要！！！）
  const User = app.model.define('user', {
    id: {
      type: INTEGER(20).UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: STRING(30),
      allowNull: false,
      defaultValue: '',
      comment: '用户名称',
      unique: true,
    },
    nickname: {
      type: STRING(30),
      allowNull: false,
      defaultValue: '',
      comment: '...',
    },
    email: {
      type: STRING(160),
      comment: '用户邮箱',
      unique: true,
    },
    password: {
      type: STRING(200),
      allowNull: false,
      defaultValue: '',
      set(val) {
        this.setDataValue('password', hashSync(val));
      },
    },
    avatar: {
      type: STRING(200),
      allowNull: true,
      defaultValue: '',
    },
    phone: {
      type: STRING(20),
      comment: '用户手机',
      unique: true,
    },
    sex: {
      type: ENUM,
      values: [ '男', '女', '保密' ],
      allowNull: true,
      defaultValue: '男',
      comment: '用户性别',
    },
    status: {
      type: INTEGER(1),
      allowNull: false,
      defaultValue: 1,
      comment: '状态',
    },
    sign: {
      type: STRING(200),
      allowNull: true,
      defaultValue: '',
      comment: '个性签名',
    },
    momentcover: {
      type: TEXT,
      allowNull: true,
      defaultValue: '',
      comment: '朋友圈封面',
    },
    area: {
      type: TEXT,
      allowNull: true,
      defaultValue: '',
      comment: '地区',
    },
    created_at: DATE,
    updated_at: DATE,
  });
  // 定义关联关系
  User.associate = function() {
    User.hasMany(app.model.Friend, {
      as: 'bfriends', // 当前用户的被好友
      foreignKey: 'friend_id',
    });

    User.hasMany(app.model.Friend, {
      as: 'friends', // 当前用户的好友
      foreignKey: 'user_id',
    });

    User.hasMany(app.model.Moment, {
      foreignKey: 'user_id',
    });
  };
  return User;
};
