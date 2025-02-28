
import $H from '@/common/lib/request.js';
import $C from '@/common/lib/config.js';
// 创建群聊
export function createGroup(data) {
	return $H.post('/group/create', data, {token: true})
}

// 获取群聊列表
export function getGroupList(data) {
	return $H.get('/group/get_list', data, {token: true})
}

// 获取群信息
export function getGroupInfo(id) {
	return $H.get(`/group/get_info/${id}`, {}, {token: true})
}

// 修改群名称
export function rename(data) {
	return $H.post(`/group/rename`, data, {token: true})
}

// 修改群公告
export function remark(data) {
	return $H.post(`/group/remark`, data, {token: true})
}

// 修改我在本群的昵称
export function updateNickname(data) {
	return $H.post(`/group/update_nickname`, data, {token: true})
}

// 解散群聊或退出群聊
export function quitGroup(data) {
	return $H.post(`/group/quit_group`, data, {token: true})
}

// 获取群二维码
export function groupQrcode(id, token) {
	return `${$C.baseUrl}/group/qrcode/${id}?token=${token}`
}

// 踢出某个群成员
export function kickoff(data) {
	return $H.post(`/group/kickoff`, data, {token: true})
}

// 邀请某个群成员
export function invite(data) {
	return $H.post(`/group/invite`, data, {token: true})
}

// 批量邀请加入群聊
export function batchInvite(data) {
	return $H.post(`/group/batch_invite`, data, {token: true})
}

// 验证群聊和当前用户的关系
export function checkrelation(data) {
	return $H.post(`/group/checkrelation`, data, {token: true})
}

// 加入群聊
export function join(data) {
	return $H.post(`/group/join`, data, {token: true})
}
