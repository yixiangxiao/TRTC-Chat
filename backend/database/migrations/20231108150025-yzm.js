module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { INTEGER, STRING, DATE } = Sequelize;
    // 创建表
    await queryInterface.createTable('yzm', {
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
  },

  down: async queryInterface => {
    await queryInterface.dropTable('yzm');
  },
};
