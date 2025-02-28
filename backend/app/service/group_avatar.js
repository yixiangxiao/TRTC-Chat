const { Service } = require('egg');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const fs = require('fs');
// 定义头像图片的宽度和高度
const avatarWidth = 30;
const avatarHeight = 30;
// 定义九宫格的行数和列数
const rows = 3;
const cols = 3;

// 定义九宫格的宽度和高度
const gridWidth = avatarWidth * cols;
const gridHeight = avatarHeight * rows;
// 创建一个新的图像，用于存储九宫格
const gridImage = sharp({
  create: {
    width: gridWidth,
    height: gridHeight,
    channels: 4, // 使用RGBA通道
    background: { r: 255, g: 255, b: 255, alpha: 0 }, // 设置背景为透明
  },
});
  // 读取九个头像图片并将其缩放到指定的大小
class GroupAvatarService extends Service {

  async createPromise(avatars) {
    const width = (avatarWidth * cols) / 2;
    const height = (avatarHeight * rows) / 2;
    const margin = width - avatarWidth;

    if (avatars.length === 3) { // 第一行1个 第二行2个
      return avatars.map(async (avatar, index) => {
        const response = await axios.get(avatar, { responseType: 'arraybuffer' });
        const _buffer = Buffer.from(response.data, 'binary');
        const buffer = await sharp(_buffer)
          .resize(width, height)
          .toBuffer();

        if (index === 0) {
          return { input: buffer, top: 0, left: Math.floor(width / 2) };
        } else if (index === 1) {
          return { input: buffer, top: height, left: 0 };
        } else if (index === 2) {
          return { input: buffer, top: height, left: width };
        }
      });
    }

    if (avatars.length === 4) { // 第一行2个 第二行2个
      return avatars.map(async (avatar, index) => {
        const response = await axios.get(avatar, { responseType: 'arraybuffer' });
        const _buffer = Buffer.from(response.data, 'binary');
        const buffer = await sharp(_buffer)
          .resize(width, height)
          .toBuffer();

        if (index === 0) {
          return { input: buffer, top: 0, left: 0 };
        } else if (index === 1) {
          return { input: buffer, top: 0, left: width };
        } else if (index === 2) {
          return { input: buffer, top: height, left: 0 };
        } else if (index === 3) {
          return { input: buffer, top: height, left: width };
        }
      });
    }

    if (avatars.length === 5) { // 第一行2个 第二行3个
      return avatars.map(async (avatar, index) => {
        const response = await axios.get(avatar, { responseType: 'arraybuffer' });
        const _buffer = Buffer.from(response.data, 'binary');
        const buffer = await sharp(_buffer)
          .resize(avatarWidth, avatarHeight)
          .toBuffer();

        if (index === 0) {
          return { input: buffer, top: 0, left: margin };
        } else if (index === 1) {
          return { input: buffer, top: 0, left: width };
        } else if (index === 2) {
          return { input: buffer, top: avatarHeight, left: 0 };
        } else if (index === 3) {
          return { input: buffer, top: avatarHeight, left: avatarWidth };
        } else if (index === 4) {
          return { input: buffer, top: avatarHeight, left: 2 * avatarWidth };
        }
      });
    }

    if (avatars.length === 7) { // 第一行3个 第二行3个 第三行一个
      return avatars.map(async (avatar, index) => {
        const response = await axios.get(avatar, { responseType: 'arraybuffer' });
        const _buffer = Buffer.from(response.data, 'binary');
        const buffer = await sharp(_buffer)
          .resize(avatarWidth, avatarHeight)
          .toBuffer();

        if (index === 0) {
          return { input: buffer, top: 0, left: 0 };
        } else if (index === 1) {
          return { input: buffer, top: 0, left: avatarWidth };
        } else if (index === 2) {
          return { input: buffer, top: 0, left: 2 * avatarWidth };
        } else if (index === 3) {
          return { input: buffer, top: avatarHeight, left: 0 };
        } else if (index === 4) {
          return { input: buffer, top: avatarHeight, left: avatarWidth };
        } else if (index === 5) {
          return { input: buffer, top: avatarHeight, left: 2 * avatarWidth };
        } else if (index === 6) {
          return { input: buffer, top: 2 * avatarHeight, left: avatarWidth };
        }
      });
    }

    if (avatars.length === 8) { // 第一行3个 第二行3个 第三行一个
      return avatars.map(async (avatar, index) => {
        const response = await axios.get(avatar, { responseType: 'arraybuffer' });
        const _buffer = Buffer.from(response.data, 'binary');
        const buffer = await sharp(_buffer)
          .resize(avatarWidth, avatarHeight)
          .toBuffer();

        if (index === 0) {
          return { input: buffer, top: 0, left: 0 };
        } else if (index === 1) {
          return { input: buffer, top: 0, left: avatarWidth };
        } else if (index === 2) {
          return { input: buffer, top: 0, left: 2 * avatarWidth };
        } else if (index === 3) {
          return { input: buffer, top: avatarHeight, left: 0 };
        } else if (index === 4) {
          return { input: buffer, top: avatarHeight, left: avatarWidth };
        } else if (index === 5) {
          return { input: buffer, top: avatarHeight, left: 2 * avatarWidth };
        } else if (index === 6) {
          return { input: buffer, top: 2 * avatarHeight, left: margin };
        } else if (index === 7) {
          return { input: buffer, top: 2 * avatarHeight, left: width };
        }
      });
    }

    return avatars.map(async (avatar, index) => {
      const response = await axios.get(avatar, { responseType: 'arraybuffer' });
      const _buffer = Buffer.from(response.data, 'binary');
      const buffer = await sharp(_buffer)
        .resize(avatarWidth, avatarHeight)
        .toBuffer();

      // 计算当前头像在九宫格中的位置
      const row = Math.floor(index / cols);
      const col = index % cols;

      // 将头像复制到九宫格中的相应位置
      return { input: buffer, top: row * avatarHeight, left: col * avatarWidth };
    });
  }

  async generateGridImage(avatars) {
    const { ctx } = this;
    try {
      const promises = await this.createPromise(avatars);
      const vals = await Promise.all(promises);
      // 生成唯一名称
      const name = uuidv4() + '.png';
      // 指定位置
      const path = this.app.config.tempDir + name;
      // 输出临时文件
      await gridImage.composite(vals).toFile(path);
      // 读取流
      const stream = fs.createReadStream(path);
      // 存入minio
      await ctx.app.minio.putObject(this.app.config.minio.bucket5, name, stream);
      // 拿到地址
      const url = await this.ctx.service.minio.getUrl(this.app.config.minio.bucket5, name);
      // 删除临时文件
      fs.unlinkSync(path);
      console.log('九宫格图片生成成功！', url);
      return url;
    } catch (error) {
      console.error('保存九宫格图片时出错：', error);
    }
  }
}
module.exports = GroupAvatarService;
