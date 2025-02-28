/* eslint valid-jsdoc: "off" */

'use strict';
const path = require('path');
/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  config.security = {
    // 关闭 csrf
    csrf: {
      enable: false,
    },
    // 跨域白名单
    domainWhiteList: [ 'http://localhost:3000' ],
  };
  // 允许跨域的方法
  config.cors = {
    origin: '*',
    allowMethods: 'GET, PUT, POST, DELETE, PATCH',
  };

  config.sequelize = {
    dialect: 'mysql',
    host: '127.0.0.1',
    username: 'root',
    password: 'root',
    port: 3306,
    database: 'egg-wechat',
    // 中国时区
    timezone: '+08:00',
    define: {
      // 取消数据表名复数
      freezeTableName: true,
      // 自动写入时间戳 created_at updated_at
      timestamps: true,
      // 字段生成软删除时间戳 deleted_at
      // paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      // deletedAt: 'deleted_at',
      // 所有驼峰命名格式化
      underscored: true,
    },
  };

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1697205680385_6242';

  // add your middleware config here
  config.middleware = [ 'errorHandler', 'auth' ];
  config.errorHandler = {
    ceshi: 123,
    // 通用配置（以下是重点）
    enable: true, // 控制中间件是否开启。
    // match: '/test_destroy', // 设置只有符合某些规则的请求才会经过这个中间件（匹配路由）
    // ignore: '/shop', // 设置符合某些规则的请求不经过这个中间件。

    /**
        注意：
        1. match 和 ignore 不允许同时配置
        2. 例如：match:'/news'，只要包含/news的任何页面都生效
        **/

    // match 和 ignore 支持多种类型的配置方式：字符串、正则、函数（推荐）
    // match(ctx) {
    //     // 只有 ios 设备才开启
    //     const reg = /iphone|ipad|ipod/i;
    //     return reg.test(ctx.get('user-agent'));
    // },
  };

  config.auth = {
    ignore: [
      '/sendmail', '/register',
      '/login', '/check_username',
      '/check_email', '/forget_password', '/ws',
      '/upload', '/download', '/get_app_info', '/save_app_info',
    ],
  };

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  config.valparams = {
    locale: 'zh-cn',
    throwError: true,
  };

  config.jwt = {
    secret: 'qhdgw@45ncashdaksh2!#@3nxjdas*_672',
  };

  config.redis = {
    client: {
      port: 6379, // Redis port
      host: '127.0.0.1', // Redis host
      password: '',
      db: 0,
    },
  };

  // http://127.0.0.1:7001/public/images/ggb/1.gif
  config.static = {
    prefix: '/public', // 静态资源的URL前缀
    dir: path.join(appInfo.baseDir, 'app/public'), // 静态资源的本地路径
  };

  config.multipart = {
    mode: 'file',
    fileSize: 1048576000,
    fileExtensions: [ '.xlsx', '.exe', '.pdf', '.ev6' ], // 扩展白名单 在默认配置上扩展
    // 覆盖白名单
    //  whitelist: [ '.xlsx', '.exe', '.pdf' ], // 覆盖白名单 重写白名单
  };

  config.minio = {
    client: {
      endPoint: '', // ip或域名
      port: 9000, // 端口号
      useSSL: false,
      accessKey: '',
      secretKey: '',
    },
    bucket: 'user-info', // public 权限 不过期 用户信息
    bucket2: 'chat-history', // private 权限（无法直接访问） 7天过期 聊天信息
    bucket3: 'fava', // public 权限 不过期 收藏
    bucket4: 'moments', // public 权限 不过期 朋友圈
    bucket5: 'group-info', // public 权限 不过期 群信息
  };

  config.im = {
    hostname: '',
    SDKAppID: '',
    SDKSecretKey: '',
  };

  config.bodyParser = {
    jsonLimit: '50mb',
    formLimit: '50mb',
  };

  // 临时文件地址
  config.tempDir = path.join(appInfo.baseDir, 'app/public/temp/');

  return {
    ...config,
    ...userConfig,
  };
};
