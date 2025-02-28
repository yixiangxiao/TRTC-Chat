'use strict';
const { Service } = require('egg');
const axios = require('axios');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
class MinioService extends Service {

  //  获取public权限的url(拼接url的方法一定要是public权限)
  async getUrl(bucket, filename) {
    const endPoint = this.app.config.minio.client.endPoint;
    const port = this.app.config.minio.client.port;
    // 地址默认是触发下载
    const url = `http://${endPoint}:${port}/${bucket}/${filename}`;
    return url;
  }
  async presignedUrl(bucket, filename) {
    const { ctx } = this;
    const result = await ctx.app.minio.presignedUrl('GET', bucket, filename, 24 * 60 * 60 * 7);
    return result;
  }

  // 下载网络文件
  async download(url) {
    const response = await axios.get(url, { responseType: 'stream' });
    // 文件类型
    const fileType = url.split('.').pop();
    // 把响应结果存入磁盘
    const name = uuidv4() + '.' + fileType;
    const path = this.app.config.tempDir + name;
    const writer = fs.createWriteStream(path);
    // response.data.pipe(writer);
    // return path;
    // 因为文件写入是异步的，所以需要等待它写入完成才能返回path，不然会找不到文件
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        resolve(path);
      });
      writer.on('error', error => {
        reject(error);
      });
      response.data.pipe(writer);
    });
  }
  // 截取视频封面
  async captureVideoThumbnail(videoPath, bucket) {
    return new Promise((resolve, reject) => {
      let filename = null;
      ffmpeg(videoPath)
        .on('filenames', async filenames => {
          // 文件名
          filename = filenames[0];
        })
        .on('error', err => {
          reject(err);
        })
        .on('end', async () => {
          const path = this.app.config.tempDir + filename;
          // 拿到当前文件路径，读取流
          const thumbnailStream = fs.createReadStream(path);
          // 上传到minio
          await this.ctx.app.minio.putObject(bucket, filename, thumbnailStream);
          // 取得上传后的文件名
          const presignedUrl = await this.presignedUrl(bucket, filename);
          // 删除临时文件
          fs.unlinkSync(path);
          resolve(presignedUrl);
        })
        .screenshots({
          count: 1, // 数量
          folder: this.app.config.tempDir, // 保存封面的文件夹路径
          size: '320x320', // 封面的尺寸
          filename: 'thumbnail-%b.png', // 封面文件名的格式
        });
    });
  }
}
module.exports = MinioService;
// const avatars = [
//   `${__dirname}../../public/temp/images/1.jpg`,
//   `${__dirname}../../public/temp/images/2.jpg`,
//   `${__dirname}../../public/temp/images/3.jpg`,
//   `${__dirname}../../public/temp/images/4.jpg`,
//   `${__dirname}../../public/temp/images/5.jpg`,
//   `${__dirname}../../public/temp/images/6.jpg`,
//   `${__dirname}../../public/temp/images/7.jpg`,
//   `${__dirname}../../public/temp/images/8.jpg`,
//   `${__dirname}../../public/temp/images/9.jpg`,
// ];
// 读取九个头像图片并将其缩放到指定的大小
// const urls = [
//   'http://127.0.0.1:7001/public/temp/images/1.jpg',
//   'http://127.0.0.1:7001/public/temp/images/2.jpg',
//   'http://127.0.0.1:7001/public/temp/images/3.jpg',
//   'http://127.0.0.1:7001/public/temp/images/4.jpg',
//   'http://127.0.0.1:7001/public/temp/images/5.jpg',
//   'http://127.0.0.1:7001/public/temp/images/6.jpg',
//   'http://127.0.0.1:7001/public/temp/images/7.jpg',
//   'http://127.0.0.1:7001/public/temp/images/8.jpg',
//   'http://127.0.0.1:7001/public/temp/images/9.jpg',
// ];
// const avatars = [];
// for (let i = 0; i < urls.length; i++) {
//   const url = urls[i];
//   const path = await this.ctx.service.minio.download(url);
//   avatars.push(path);
// }
// // 生成头像
// const url = await this.ctx.service.groupAvatar.generateGridImage(avatars);
// console.log(url);
