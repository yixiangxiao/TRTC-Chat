'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { INTEGER, STRING, DATE, ENUM, TEXT } = Sequelize;
    // 创建表
    await queryInterface.createTable('user', {
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
  },

  down: async queryInterface => {
    await queryInterface.dropTable('user');
  },
};
