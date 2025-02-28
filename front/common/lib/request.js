import $C from './config.js';
import $U from './util.js';
import $store from '@/store/index.js';
export default {
	// 全局配置
	common: {
		baseUrl: $C.baseUrl,
		header: {
			'Content-Type': 'application/json;charset=UTF-8',
		},
		data: {},
		method: 'GET',
		dataType: 'json',
		token: true
	},
	// 请求 返回promise
	request(options = {}) {
		// 组织参数
		options.url = this.common.baseUrl + options.url
		options.header = options.header || this.common.header
		options.data = options.data || this.common.data
		options.method = options.method || this.common.method
		options.dataType = options.dataType || this.common.dataType
		options.token = options.token ? this.common.token : false

		// 请求之前验证...
		// token验证
		if (options.token) { // 是否需要token
			let token = $U.getStorage('token')
			// 二次验证
			if (!token) {
				uni.showToast({
					title: '请先登录',
					icon: 'none'
				});
				// token不存在时跳转

				return uni.reLaunch({
					url: "/pages/common/login/login"
				})

				return false
			}
			// 往header头中添加token
			options.header.token = token
		}

		// 请求
		return new Promise((res, rej) => {
			// 请求中...
			uni.request({
				...options,
				success: (result) => {
					// console.log(result);
					// 返回原始数据
					if (options.native) {
						return res(result)
					}
					// 服务端失败
					if (result.statusCode !== 200) {
						if (options.toast !== false) {
							uni.showToast({
								title: result.data.data || '服务端失败',
								icon: 'none'
							});
						}
						// token不合法，直接退出登录
						if (result.data.data === 'Token 令牌不合法!' || result.data.data === '用户不存在或已被禁用') {
							// 不需要断线重连
							$store.dispatch('user/notNeedOpenReconnect').then(() => {
								$store.dispatch('user/logout')
							})
						}
						return rej(result.data)
					}
					// 其他验证...
					// 成功
					let data = result.data.data
					res(data)
				},
				fail: (error) => {
					// console.log(error)
					uni.showToast({
						title: error.errMsg || '请求失败',
						icon: 'none'
					});
					return rej(error)
				}
			});
		})
	},
	// get请求
	get(url, data = {}, options = {}) {
		options.url = url
		options.data = data
		options.method = 'GET'
		return this.request(options)
	},
	// post请求
	post(url, data = {}, options = {}) {
		options.url = url
		options.data = data
		options.method = 'POST'
		return this.request(options)
	},
	// delete请求
	del(url, data = {}, options = {}) {
		options.url = url
		options.data = data
		options.method = 'DELETE'
		return this.request(options)
	},
	// 上传文件
	upload(url, data, onProgress = false) {
		return new Promise((result, reject) => {
			// 上传
			let token = $U.getStorage('token')
			if (!token) {
				uni.showToast({
					title: '请先登录',
					icon: 'none'
				});
			 //token不存在时跳转
				return uni.reLaunch({
					url: "/pages/common/login/login"
				})
			}

			const uploadTask = uni.uploadFile({
				url: this.common.baseUrl + url,
				filePath: data.filePath,
				name: data.name || "files",
				formData: { bucket: data.bucket || 'chat-history' },
				header: {
					token
				},
				success: (res) => {
					if (res.statusCode !== 200) {
						result(false)
						return uni.showToast({
							title: '上传失败',
							icon: 'none'
						});
					}
					let message = JSON.parse(res.data)
					result(message.data);
				},
				fail: (err) => {
					// console.log(err);
					reject(err)
				}
			})

			uploadTask.onProgressUpdate((res) => {
				if (typeof onProgress === 'function') {
					onProgress(res.progress)
				}
			});

		})
	}
}
