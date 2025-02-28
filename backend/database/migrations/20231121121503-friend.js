'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { INTEGER, DATE, STRING } = Sequelize;
    // 创建表
    await queryInterface.createTable('friend', {
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
      friend_id: {
        type: INTEGER(20).UNSIGNED,
        allowNull: false,
        comment: '好友id',
        //  定义外键（重要）
        references: {
          model: 'user', // 对应表名称（数据表名称）
          key: 'id', // 对应表的主键
        },
        onUpdate: 'restrict', // 更新时操作
        onDelete: 'cascade', // 删除时操作
      },
      nickname: {
        type: STRING(30),
        allowNull: false,
        defaultValue: '',
        comment: '备注',
      },
      lookme: {
        type: INTEGER(1),
        allowNull: false,
        defaultValue: 1,
        comment: '看我',
      },
      lookhim: {
        type: INTEGER(1),
        allowNull: false,
        defaultValue: 1,
        comment: '看他',
      },
      star: {
        type: INTEGER(1),
        allowNull: false,
        defaultValue: 0,
        comment: '是否为星标朋友：0否1是',
      },
      isblack: {
        type: INTEGER(1),
        allowNull: false,
        defaultValue: 0,
        comment: '是否加入黑名单：0否1是',
      },
      created_at: DATE,
      updated_at: DATE,
    });
  },

  down: async queryInterface => {
    await queryInterface.dropTable('friend');
  },
};
