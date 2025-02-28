
import $H from '@/common/lib/request.js';
import $C from '@/common/lib/config.js';
// 朋友圈列表
export function timeline(data) {
	return $H.get('/moment/timeline', data, {token: true})
}

// 某个好友朋友圈列表
export function momentList(data) {
	return $H.get('/moment/list', data, {token: true})
}

// 点赞
export function like(data) {
	return $H.post('/moment/like', data, {token: true})
}

// 评论
export function comment(data) {
	return $H.post('/moment/comment', data, {token: true})
}

// 发布朋友圈
export function create(data) {
	return $H.post('/moment/create', data, {token: true})
}

// 删除朋友圈
export function destroy(data) {
	return $H.post('/moment/destroy', data, {token: true})
}

// 删除朋友圈
export function deleteComment(data) {
	return $H.post('/moment/comment_destroy', data, {token: true})
}