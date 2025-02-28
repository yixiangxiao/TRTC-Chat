'use strict';
module.exports = app => {
  const { STRING, INTEGER, DATE, ENUM } = app.Sequelize;
  // 配置（重要：一定要配置详细，一定要！！！）
  const Apply = app.model.define('apply', {
    id: {
      type: INTEGER(20).UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: INTEGER(20).UNSIGNED,
      allowNull: false,
      comment: '申请人id',
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
    status: {
      type: ENUM,
      values: [ 'pending', 'refuse', 'agree', 'ignore' ],
      allowNull: false,
      defaultValue: 'pending',
      comment: '申请状态',
    },
    created_at: DATE,
    updated_at: DATE,
  });
  // 模型关联
  Apply.associate = function() {
    // 多对一 user  foreignKey : user_id
    // Sequelize 在模型关联时默认会创建一个外键字段，
    // 命名规则是在关联模型的名称后面加上 "_id"。
    // 你可以通过配置选项来自定义外键的命名规则和其他关联行为。
    Apply.belongsTo(app.model.User);
  };
  return Apply;
};
