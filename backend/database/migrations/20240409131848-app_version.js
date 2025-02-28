'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { INTEGER, DATE, STRING, TEXT } = Sequelize;
    // 创建表
    await queryInterface.createTable('app_version', {
      id: {
        type: INTEGER(20).UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      appid: {
        type: STRING,
        allowNull: false,
        comment: 'appid',
        defaultValue: '',
      },
      apptype: {
        type: STRING,
        allowNull: false,
        comment: 'type android ios',
        defaultValue: '',
      },
      downloadurl_sign: {
        type: STRING,
        allowNull: false,
        defaultValue: '',
        comment: '下载地址',
      },
      content: {
        type: TEXT,
        allowNull: false,
        defaultValue: '',
        comment: '更新内容',
      },
      version: {
        type: STRING,
        allowNull: false,
        defaultValue: '',
        comment: '版本号',
      },
      update_type: {
        type: STRING,
        allowNull: false,
        defaultValue: '',
        comment: '强制更新 forcibly 非强制更新 solicit',
      },
      shichang: {
        type: INTEGER(1),
        allowNull: false,
        defaultValue: 0,
        comment: '是否是市场',
      },
      shichangurl: {
        type: STRING,
        allowNull: false,
        defaultValue: '',
        comment: '市场地址',
      },
      created_at: DATE,
      updated_at: DATE,
    });
  },

  down: async queryInterface => {
    await queryInterface.dropTable('app_version');
  },
};
