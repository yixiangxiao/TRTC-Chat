'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { INTEGER, STRING, DATE, TEXT } = Sequelize;
    // 创建表
    await queryInterface.createTable('group', {
      id: {
        type: INTEGER(20).UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: STRING(30),
        allowNull: false,
        defaultValue: '',
        comment: '群组名称',
      },
      avatar: {
        type: STRING(200),
        allowNull: true,
        defaultValue: '',
      },
      user_id: {
        type: INTEGER(20).UNSIGNED,
        allowNull: false,
        comment: '群主id',
        //  定义外键（重要）
        references: {
          model: 'user', // 对应表名称（数据表名称）
          key: 'id', // 对应表的主键
        },
        onUpdate: 'restrict', // 更新时操作
        onDelete: 'cascade', // 删除时操作
      },
      remark: {
        type: TEXT,
        allowNull: true,
        defaultValue: '',
        comment: '群公告',
      },
      invite_confirm: {
        type: INTEGER(1),
        allowNull: false,
        defaultValue: 1,
        comment: '邀请确认',
      },
      status: {
        type: INTEGER(1),
        allowNull: false,
        defaultValue: 1,
        comment: '状态',
      },
      group_id: {
        type: TEXT,
        allowNull: true,
        defaultValue: '',
        comment: '腾讯群id',
      },
      created_at: DATE,
      updated_at: DATE,
    });
  },

  down: async queryInterface => {
    await queryInterface.dropTable('group');
  },
};
