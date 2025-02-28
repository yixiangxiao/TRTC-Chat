'use strict';
const { Controller } = require('egg');
const path = require('path');
const fs = require('fs');
class DownloadController extends Controller {
  async download() {
    const { ctx } = this;
    const { filename } = ctx.params;
    const filePath = path.join(__dirname, '..', 'public/download/', filename);

    // 获取文件的状态
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    // 指定文件的路径
    ctx.attachment(filePath);
    ctx.set('Content-Type', 'application/octet-stream');
    ctx.set('Content-Length', fileSize);
    ctx.body = fs.createReadStream(filePath);
  }
}
module.exports = DownloadController;
