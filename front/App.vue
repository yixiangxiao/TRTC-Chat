<script>
	import Upgrade from '@/common/lib/app-version.js';
	import $U from '@/common/lib/util.js';
	import { rejectCall, busyCall, noResponseCall, groupCallEnd, joinGroupCall, leaveGroupCall, endGroupCall } from '@/api/rtc.js';
	export default {
		globalData: {
			detail: '',
			reject: false
		},
		onLaunch: function() {
			// #ifdef APP-PLUS-NVUE
			// 加载公共图标库
			const domModule = weex.requireModule('dom')
			domModule.addRule('fontFace', {
			    'fontFamily': "iconfont",
			    'src': "url('/static/font.ttf')"
			});
			// #endif
			
			//注册全局录音器
			this.$store.commit('audio/initRECORD')
			// 初始化登录状态
			this.$store.dispatch('user/initLogin')
			uni.onPushMessage((res)=> {
				if (res.type === 'click') {
					this.toChatPage(res.data.payload)
					// 清空通知栏
					 // #ifdef APP-PLUS
					plus.push.clear();
					// #endif
				}
			})
			const upgrade = new Upgrade()
			 // 检查版本并更新
			upgrade.checkVersion().then(isLatest => {
			    if (!isLatest) {
			        upgrade.updatePackage()
			    }
			})
			plus.globalEvent.addEventListener('onCallCancelled', (res) => {
				console.log('取消通话', res)
				// 因为被叫拒绝时也会触发通话取消事件，所以要加判断
				if (this.globalData.reject) return
				
				// 主叫取消 并且是单聊
				if (res.callerId == this.$store.state.user.user.username && this.globalData.detail.chat_type == 'user') {
					const message = this.$store.state.user.chat.formatSendData({ type: this.globalData.detail.callType, data: '已取消', send_status: 'success' });
					this.$store.state.user.chat.send(message);
					uni.$emit('sendCallData', message);
				}
				
				// 主叫取消 并且是群聊
				if (res.callerId == this.$store.state.user.user.username && this.globalData.detail.chat_type == 'group') {
					groupCallEnd({ groupId: this.globalData.detail.id, callType: this.globalData.detail.callType })
				}
			});
			plus.globalEvent.addEventListener('onUserReject', (res) => {
				console.log('拒绝通话', res, this.globalData)
				this.globalData.reject = true
				if (this.globalData.detail.chat_type == 'user') {
					// 调用接口
					rejectCall({ targetId: this.globalData.detail.id, callType: this.globalData.detail.callType })
				}
			});
			plus.globalEvent.addEventListener('onError', (res) => {
				console.log('错误通话', res)
			});
			plus.globalEvent.addEventListener('onUserNoResponse', (res) => {
				console.log('无响应通话', res)
				this.globalData.reject = true
				if (this.globalData.detail.chat_type == 'user') {
					// 调用接口
					noResponseCall({ targetId: this.globalData.detail.id, callType: this.globalData.detail.callType })
				}
			});
			plus.globalEvent.addEventListener('onUserLineBusy', (res) => {
				console.log('忙线通话', res)
				this.globalData.reject = true
				if (this.globalData.detail.chat_type == 'user') {
					// 调用接口
					busyCall({ targetId: this.globalData.detail.id, callType: this.globalData.detail.callType })
				}
			});
			plus.globalEvent.addEventListener('onCallEnd', (res) => {
				console.log('结束通话', res, this.globalData.detail)
				if (res.callRole == 1 && this.globalData.detail.chat_type == 'user') {
					const message = this.$store.state.user.chat.formatSendData({ type: this.globalData.detail.callType, data: formatSecondsToTime(res.totalTime), send_status: 'success' });
					this.$store.state.user.chat.send(message);
					uni.$emit('sendCallData', message);
				}
				// 只有主叫方this.globalData才存在
				if (res.callRole == 1 && this.globalData.detail.chat_type == 'group') {
					groupCallEnd({ groupId: this.globalData.detail.id, callType: this.globalData.detail.callType })
					endGroupCall({groupId: this.globalData.detail.id})
				}
				
				if (res.callRole == 2) {
					if (this.$store.state.user.groupCallCount) {
						this.$store.dispatch('user/changeIsShowCount', true)
					}
				}
			});
			plus.globalEvent.addEventListener('onUserJoin', (res) => {
				console.log('加入通话', res, this.globalData.detail.chat_type == 'group' && res.userID == this.$store.state.user.user.username)
				if (this.globalData.detail.chat_type == 'group') {
					joinGroupCall({ groupId: this.globalData.detail.id })
				}
				
				// 自己加入通话时只会收到其它人的userID
				if (res.userID != this.$store.state.user.user.username) {
					this.$store.dispatch('user/changeIsShowCount', false)
				}
			})
			plus.globalEvent.addEventListener('onUserLeave', (res) => {
				console.log('离开通话', res)
				if (this.globalData.detail.chat_type == 'group') {
					leaveGroupCall({ groupId: this.globalData.detail.id })
				}
			})
			plus.globalEvent.addEventListener('onCallBegin', (res) => {
				console.log('通话开始', res)
				this.$store.dispatch('user/onCallBegin', res.roomID)
			})
			uni.$on('trtc', (res) => {
				this.globalData.detail = res
				this.globalData.reject = false
				this.$store.state.user.chat.createChatObject(res)
			})
		},
		onShow: function() {
			this.$store.dispatch('user/reconnect')
			this.$store.dispatch('user/enterApp')
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			toChatPage(item) {
				uni.navigateTo({
					url: `/pages/chat/chat?params=${encodeURIComponent(JSON.stringify({
						id: item.id,
						name: item.name,
						avatar: item.avatar,
						chat_type: item.chat_type
					}))}`
				})
			}
		}
	}
	function formatSecondsToTime(seconds) {
	  const hours = Math.floor(seconds / 3600); // 计算小时数
	  const mins = Math.floor((seconds % 3600) / 60); // 计算分钟数
	  const secs = seconds % 60; // 计算剩余的秒数
	  
	  const formattedHours = String(hours).padStart(2, '0'); // 格式化小时数
	  const formattedMins = String(mins).padStart(2, '0'); // 格式化分钟数
	  const formattedSecs = String(secs).padStart(2, '0'); // 格式化秒数
	  
	  return `${formattedHours}:${formattedMins}:${formattedSecs}`; // 返回格式化后的时间字符串
	}
</script>

<style>
	/*每个页面公共css */
	@import "./common/free.css";
	@import "./common/common.css";
	/* #ifndef APP-PLUS-NVUE */
	@import "./common/free-icon.css";
	/* #endif */
</style>
