# 音视频相关

## 第一步
去uniapp插件市场下载腾讯音视频插件[腾讯云音视频通话插件TencentCloud-TUICallKit](https://ext.dcloud.net.cn/plugin?id=9035)

免费试用7天，到期后需要付费购买套餐


## 第二步(重点)
用户注册时
要接入腾讯云的账号体系
[加入腾讯IM用户](https://cloud.tencent.com/document/product/269/1608)

# 部署相关(linux)
node 版本推荐 20.0.11
# 后端
需要安装minio(安装完需要创建相应存储桶，相关配置在config/config.default.js文件里)
ffmpeg，mysql，redis
自己找文档安装

## 1.核心配置
config/config.default.js(包含数据库，minio，腾讯im等配置)

## 2.修改邮件配置
utils/mail.js
注册和重置密码时用到邮件服务


## 3.数据库迁移文件配置
database/config.json
修改完后，安装数据库迁移工具 npm install --save-dev sequelize-cli
执行迁移命令 npx sequelize db:migrate 即可生成数据库表

## 后端调试命令
```js
npm run dev
```
## 后端启动命令
```js
npm start
```

# 前端
下载完代码后，打开manifest.json，点击重新生成 appid
## 1.核心配置
common/lib/config.js

## 其它配置(具体可以B站搜索搞前端的肖肖)
manifest.json 
配置高德地图安卓和IOS的key

## 打包
使用云打包，证书使用云端证书即可
云端证书的一些信息需要填到申请高德key的配置中

# 效果展示
![1.jpg](/images/1.jpg "1") <!-- 此路径表示图片和MD文件，处于同一目录 -->

![2.jpg](/images/2.jpg "2") <!-- 此路径表示图片和MD文件，处于同一目录 -->

![3.jpg](/images/3.jpg "3") <!-- 此路径表示图片和MD文件，处于同一目录 -->

![4.jpg](/images/4.jpg "4") <!-- 此路径表示图片和MD文件，处于同一目录 -->

![5.jpg](/images/5.jpg "5") <!-- 此路径表示图片和MD文件，处于同一目录 -->

![6.jpg](/images/6.jpg "6") <!-- 此路径表示图片和MD文件，处于同一目录 -->
