export default function deepClone(obj) {
  let objClone = Array.isArray(obj) ? [] : {};
  if (obj && typeof obj === "object") {
    for (let key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        //判断ojb子元素是否为对象，如果是，递归复制
        if (obj[key] && typeof obj[key] === "object") {
          objClone[key] = deepClone(obj[key]);
        } else {
          //如果不是，简单复制
          objClone[key] = obj[key];
        }
      }
    }
  }
  return objClone;
}

/*function deepClone2(obj) {
  var _obj = jsON.stringify(obj),
    objClone = JSON.parse(_obj);
  return objClone;
}*/
//缺点：无法实现对对象中方法的深拷贝，会显示为undefined

// function deepClone(obj) {
//   let objClone = Array.isArray(obj) ? [] : {};
//   if (obj && typeof obj === "object") {
//     for (let key in obj) {
//       if (obj.hasOwnProperty(key)) {
//         //判断ojb子元素是否为对象，如果是，递归复制
//         if (obj[key] && typeof obj[key] === "object") {
//           objClone[key] = deepClone(obj[key]);
//         } else {
//           //如果不是，简单复制
//           objClone[key] = obj[key];
//         }
//       }
//     }
//   }
// }

// 报错信息：Do not access Object.prototype method ‘hasOwnProperty’ from target object no-prototype-builtins
// eslint报错。
// 发现是新版本的ESLint使用了禁止直接调用 Object.prototypes 的内置属性开关，说白了就是ESLint 配置文件中的 "extends": "eslint:recommended" 属性启用了此规则。
