
import $H from '@/common/lib/request.js';
import $C from '@/common/lib/config.js';
// 注册
export function register(data) {
	return $H.post('/register',data)
}

// 发送验证码
export function sendMail(data) {
	return $H.get('/sendmail',data)
}

// 登录
export function login(data) {
	return $H.post('/login',data)
}

// 退出登录
export function logout() {
	return $H.post('/logout', {}, {token: true})
}

// 用户名是否存在
export function checkUserName(data) {
	return $H.post('/check_username',data)
}

// 邮箱是否存在
export function checkEmail(data) {
	return $H.post('/check_email',data)
}

// 忘记密码
export function forgetPassword(data) {
	return $H.post('/forget_password',data)
}

// 查询用户
export function searchUser(data) {
	return $H.post('/search_user',data, {token: true})
}

// 获取用户信息
export function getUserInfo(id) {
	return $H.get(`/friend/get_info/${id}`,{}, {token: true})
}

// 获取个人二维码
export function userQrcode(id, token) {
	return `${$C.baseUrl}/user/qrcode/${id}?token=${token}`
}

// 修改用户信息
export function updateInfo(data) {
	return $H.post(`/user/update_info`, data , {token: true})
}

// 更改朋友圈封面
export function updateCover(data) {
	return $H.post(`/user/momentcover`, data , {token: true})
}