'use strict';
module.exports = app => {
  const { INTEGER, DATE, TEXT } = app.Sequelize;
  // 配置（重要：一定要配置详细，一定要！！！）
  const MomentComment = app.model.define('moment_comment', {
    id: {
      type: INTEGER(20).UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: INTEGER(20).UNSIGNED,
      allowNull: false,
      comment: '评论用户id',
      //  定义外键（重要）
      references: {
        model: 'user', // 对应表名称（数据表名称）
        key: 'id', // 对应表的主键
      },
      onUpdate: 'restrict', // 更新时操作
      onDelete: 'cascade', // 删除时操作
    },
    moment_id: {
      type: INTEGER(20).UNSIGNED,
      allowNull: false,
      comment: '朋友圈消息id',
      //  定义外键（重要）
      references: {
        model: 'moment', // 对应表名称（数据表名称）
        key: 'id', // 对应表的主键
      },
      onUpdate: 'restrict', // 更新时操作
      onDelete: 'cascade', // 删除时操作
    },
    content: {
      type: TEXT,
      allowNull: false,
      defaultValue: '',
      comment: '评论内容',
    },
    reply_id: {
      type: INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '回复用户id 0顶级评论',
    },
    created_at: DATE,
    updated_at: DATE,
  });

  MomentComment.associate = function() {
    MomentComment.belongsTo(app.model.User, {
      foreignKey: 'user_id',
      as: 'momentCommentUser',
    });
    MomentComment.belongsTo(app.model.User, {
      foreignKey: 'reply_id',
      as: 'momentCommentReply',
    });
  };

  return MomentComment;
};
