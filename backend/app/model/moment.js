'use strict';
module.exports = app => {
  const { STRING, INTEGER, DATE, TEXT } = app.Sequelize;
  // 配置（重要：一定要配置详细，一定要！！！）
  const Moment = app.model.define('moment', {
    id: {
      type: INTEGER(20).UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    content: {
      type: TEXT,
      allowNull: false,
      defaultValue: '',
      comment: '朋友圈内容',
    },
    image: {
      type: TEXT,
      allowNull: false,
      defaultValue: '',
      comment: '朋友圈图片',
    },
    video: {
      type: STRING,
      allowNull: false,
      defaultValue: '',
      comment: '朋友圈视频',
    },
    location: {
      type: STRING,
      allowNull: false,
      defaultValue: '',
      comment: '位置',
    },
    remind: {
      type: STRING,
      allowNull: false,
      defaultValue: '',
      comment: '提醒谁看',
    },
    see: {
      type: STRING,
      allowNull: false,
      defaultValue: 'all',
      comment: '谁可以看 all公开 none私密',
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
    created_at: {
      type: DATE,
      get() {
        return new Date(this.getDataValue('created_at')).getTime();
      },
    },
    updated_at: DATE,
  });

  Moment.associate = function() {
    Moment.hasMany(app.model.MomentComment, {
      foreignKey: 'moment_id',
    });
    Moment.hasMany(app.model.MomentLike, {
      foreignKey: 'moment_id',
    });
    Moment.belongsTo(app.model.User, {
      foreignKey: 'user_id',
    });
  };

  return Moment;
};
