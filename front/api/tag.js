
import $H from '@/common/lib/request.js';
// 标签列表
export function list(data) {
	return $H.get('/tag/list', data, {token: true})
}

// 标签用户列表
export function read(id) {
	return $H.get(`/tag/read/${id}`, {}, {token: true})
}
