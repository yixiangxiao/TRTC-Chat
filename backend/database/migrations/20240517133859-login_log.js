'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { INTEGER, DATE } = Sequelize;
    // 创建表
    await queryInterface.createTable('login_log', {
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
      created_at: DATE,
      updated_at: DATE,
    });
  },

  down: async queryInterface => {
    await queryInterface.dropTable('login_log');
  },
};
