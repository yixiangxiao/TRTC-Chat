
import $H from '@/common/lib/request.js';
// 获取好友申请列表
export function applyList(data) {
	return $H.get('/apply/apply_list', data, {token: true})
}

//处理好友申请
export function applyHandle(id, data) {
	return $H.post(`/apply/apply_handle/${id}`, data, {token: true})
}
