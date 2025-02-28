'use strict';

const Service = require('egg').Service;

class CacheService extends Service {
  /**
   * 获取列表
   * @param {string} key 键
   * @param {boolean} isChildObject 元素是否为对象
   * @return { array } 返回数组
   */
  async getList(key, isChildObject = false) {
    const { redis } = this.app;
    let data = await redis.lrange(key, 0, -1);
    if (isChildObject) {
      data = data.map(item => {
        return JSON.parse(item);
      });
    }
    return data;
  }
  /**
   * 设置列表
   * @param {string} key 键
   * @param {object|string} value 值
   * @param {string} type 类型：push和unshift
   * @param {Number} expir 过期时间 单位秒
   * @return { Number } 返回索引
   */
  async setList(key, value, type = 'push', expir = 0) {
    const { redis } = this.app;
    if (expir > 0) {
      await redis.expire(key, expir);
    }
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    if (type === 'push') {
      return await redis.rpush(key, value);
    }
    return await redis.lpush(key, value);
  }

  /**
   * 设置 redis 缓存
   * @param { String } key 键
   * @param {String | Object | array} value 值
   * @param { Number } expir 过期时间 单位秒
   * @return { String } 返回成功字符串OK
   */
  async set(key, value, expir = 0) {
    const { redis } = this.app;
    if (expir === 0) {
      return await redis.set(key, JSON.stringify(value));
    }
    return await redis.set(key, JSON.stringify(value), 'EX', expir);
  }

  /**
   * 获取 redis 缓存
   * @param { String } key 键
   * @return { String | array | Object } 返回获取的数据
   */
  async get(key) {
    const { redis } = this.app;
    const result = await redis.get(key);
    return JSON.parse(result);
  }

  /**
   * redis 自增
   * @param { String } key 键
   * @param { Number } value 自增的值
   * @param number
   * @return { Number } 返回递增值
   */
  async incr(key, number = 1) {
    const { redis } = this.app;
    if (number === 1) {
      return await redis.incr(key);
    }
    return await redis.incrby(key, number);
  }

  /**
   * 查询长度
   * @param { String } key
   * @return { Number } 返回数据长度
   */
  async strlen(key) {
    const { redis } = this.app;
    return await redis.strlen(key);
  }

  /**
   * 删除指定key
   * @param {String} key
   */
  async remove(key) {
    const { redis } = this.app;
    return await redis.del(key);
  }

  /**
   * 清空缓存
   */
  async clear() {
    return await this.app.redis.flushall();
  }
}

module.exports = CacheService;
