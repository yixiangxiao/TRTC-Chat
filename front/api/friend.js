
import $H from '@/common/lib/request.js';

// 添加好友
export function addFriend(data) {
	return $H.post('/apply/add_friend', data, {token: true})
}

//获取通讯录列表
export function getFriendList(data) {
	return $H.get('/friend/get_list', data, {token: true})
}

// 设为/取消星标好友
export function setStar(id, data) {
	return $H.post(`/friend/set_star/${id}`, data, {token: true})
}

// 移入/移出黑名单
export function setBlack(id, data) {
	return $H.post(`/friend/set_black/${id}`, data, {token: true})
}

// 设置朋友圈权限
export function setMomentAuth(id, data) {
	return $H.post(`/friend/set_moment_auth/${id}`, data, {token: true})
}

// 设置备注和标签
export function setRemarkAndTag(id, data) {
	return $H.post(`/friend/set_remark_tag/${id}`, data, {token: true})
}

// 获取所有标签
export function getAllTag() {
	return $H.get(`/friend/get_all_tag`, {}, {token: true})
}

// 投诉好友/群组
export function reportFriend(data) {
	return $H.post(`/report/friend`, data, {token: true})
}

// 删除好友
export function destroy(data) {
	return $H.post(`/friend/destroy`, data, {token: true})
}