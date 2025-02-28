import $Time from '@/common/lib/time.js';
import { _getTimeStringAutoShort2 } from '@/common/lib/wechat-time.js'
export default {
	filters: {
		// formatTime(value) {
		// 	return $Time.gettime(value);
		// }
		formatTime(value) {
			if (!value) return ''
			return _getTimeStringAutoShort2(value);
		}
	}
}