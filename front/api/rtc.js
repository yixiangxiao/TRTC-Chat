
import $H from '@/common/lib/request.js';
// 拒绝通话
export function rejectCall(data) {
	return $H.post('/rtc/reject', data, { token: true })
}

export function noResponseCall(data) {
	return $H.post('/rtc/no_response', data, { token: true })
}

export function busyCall(data) {
	return $H.post('/rtc/busy', data, { token: true })
}

export function groupCall(data) {
	return $H.post('/rtc/group_call', data, { token: true })
}

export function groupCallEnd(data) {
	return $H.post('/rtc/group_call_end', data, { token: true })
}

export function joinGroupCall(data) {
	return $H.post('/rtc/join_group_call', data, { token: true })
}

export function leaveGroupCall(data) {
	return $H.post('/rtc/leave_group_call', data, { token: true })
}

export function endGroupCall(data) {
	return $H.post('/rtc/end_group_call', data, { token: true })
}

export function getGroupCallCount(data) {
	return $H.get('/rtc/group_call_count', data, { token: true })
}