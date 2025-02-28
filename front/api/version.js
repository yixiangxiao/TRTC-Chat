
import $H from '@/common/lib/request.js';
// 查询应用版本信息
export function searchAppInfo(data) {
	return $H.get('/get_app_info', data)
}

// 查询应用所有版本信息
export function searchAllAppInfo(data) {
	return $H.get('/get_all_app_info', data, { token: true })
}