import $H from '@/common/lib/request.js';
// 收藏
export function favaCreate(data) {
	return $H.post('/fava/create', data, {token: true})
}

// 获取收藏列表
export function getList(data) {
	return $H.get('/fava/get_list', data, {token: true})
}

//删除收藏
export function destroy(data) {
	return $H.post('/fava/destroy', data, {token: true})
}