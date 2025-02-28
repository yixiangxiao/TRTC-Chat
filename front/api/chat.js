
import $H from '@/common/lib/request.js';

// 发送消息
export function sendMessage(data) {
	return $H.post('/chat/send', data, {token: true})
}

// 文件上传
export function upload(data, onProgress = false) {
	return $H.upload('/upload', data, onProgress)
}

// 文件上传base 64
export function uploadBase64(data) {
	return $H.post('/upload_base64', data, { token: true })
}

// 撤回消息
export function recall(data) {
	return $H.post('/chat/recall', data, { token: true })
}

// 删除聊天信息
export function deleteChatMessage(data) {
	return $H.post('/chat/delete_chat_message', data, { token: true })
}

// 客户端接收到消息
export function receiveMessage(data) {
	return $H.post('/chat/receive', data, { token: true })
}

// 获取离线消息
export function getOfflineMessage(data) {
	return $H.get('/chat/get_offline_message', {}, { token: true })
}