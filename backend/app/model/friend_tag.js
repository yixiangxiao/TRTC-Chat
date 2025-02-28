'use strict';
module.exports = app => {
  const { INTEGER, DATE } = app.Sequelize;
  // 配置（重要：一定要配置详细，一定要！！！）
  const FriendTag = app.model.define('friend_tag', {
    id: {
      type: INTEGER(20).UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    friend_id: {
      type: INTEGER(20).UNSIGNED,
      allowNull: false,
      comment: '好友id',
      //  定义外键（重要）
      references: {
        model: 'friend', // 对应表名称（数据表名称）
        key: 'id', // 对应表的主键
      },
      onUpdate: 'restrict', // 更新时操作
      onDelete: 'cascade', // 删除时操作
    },
    tag_id: {
      type: INTEGER(20).UNSIGNED,
      allowNull: false,
      comment: '标签id',
      //  定义外键（重要）
      references: {
        model: 'tag', // 对应表名称（数据表名称）
        key: 'id', // 对应表的主键
      },
      onUpdate: 'restrict', // 更新时操作
      onDelete: 'cascade', // 删除时操作
    },
    created_at: DATE,
    updated_at: DATE,
  });
  return FriendTag;
};
