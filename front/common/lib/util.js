import $C from './config.js'
export default {
    // 获取存储列表数据
    getStorage(key){
        let data = null;
		// #ifdef H5
		if($C.env === 'dev'){
		    data = window.sessionStorage.getItem(key)
		} else {
		    data = uni.getStorageSync(key)
		}
		// #endif
        // #ifndef H5
        data = uni.getStorageSync(key)
        // #endif
        return data
    },
    // 设置存储
    setStorage(key,data){
        // #ifdef H5
        if($C.env === 'dev'){
            return window.sessionStorage.setItem(key,data)
        } else {
            return uni.setStorageSync(key,data)
        }
        // #endif
		// #ifndef H5
		return uni.setStorageSync(key,data)
		// #endif
    },
    // 删除存储
    removeStorage(key){
        // #ifdef H5
        if($C.env === 'dev'){
            return window.sessionStorage.removeItem(key);
        } else {
            return uni.removeStorageSync(key)
        }
        // #endif
		// #ifndef H5
		return uni.removeStorageSync(key)
		// #endif
    },
	
	//防抖 延时搜索
	debounce(fn,t){
		let delay = t || 500
		let timer;
		return function(){
			let args =arguments
			if(timer){
				clearInterval(timer)
			}
			timer=setTimeout(()=>{
				timer=null
				fn.apply(this,args)
			},delay)
		}
	},
	guid(len = 32, firstU = true, radix = null) {
		const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
		const uuid = []
		radix = radix || chars.length
	
		if (len) {
			// 如果指定uuid长度,只是取随机的字符,0|x为位运算,能去掉x的小数位,返回整数位
			for (let i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix]
		} else {
			let r
			// rfc4122标准要求返回的uuid中,某些位为固定的字符
			uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-'
			uuid[14] = '4'
	
			for (let i = 0; i < 36; i++) {
				if (!uuid[i]) {
					r = 0 | Math.random() * 16
					uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r]
				}
			}
		}
		// 移除第一个字符,并用u替代,因为第一个字符为数值时,该guuid不能用作id或者class
		if (firstU) {
			uuid.shift()
			return `u${uuid.join('')}`
		}
		return uuid.join('')
	}
}