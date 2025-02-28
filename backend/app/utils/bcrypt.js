// 密码加密工具
const bcrypt = require('bcryptjs');
// 加密函数 传入的参数为用户输入的密码
exports.hash = myPlaintextPassword => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(myPlaintextPassword, 10, (err, hash) => {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });
};
// 解密函数，传入的参数为用户输入的密码，和加密时存入数据库的hash值
exports.compare = (myPlaintextPassword, hash) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(myPlaintextPassword, hash, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};

// 同步用法 解密
exports.compareSync = (myPlaintextPassword, hash) => {
  return bcrypt.compareSync(myPlaintextPassword, hash);
};

// 同步用法 加密
exports.hashSync = myPlaintextPassword => {
  return bcrypt.hashSync(myPlaintextPassword, 10);
};
