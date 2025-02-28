import $U from '@/common/lib/util.js';
import $C from '@/common/lib/config.js';
import Chat from '@/common/lib/chat.js'
import { applyList } from '@/api/apply.js'
import { getFriendList } from '@/api/friend.js'
import DB from '@/common/lib/sqLite.js'
const TUICallKit = uni.requireNativePlugin('TencentCloud-TUICallKit');
// 悬浮窗
TUICallKit.enableFloatWindow(true);
export default{
	namespaced: true,
	state: {
		user: null,
		apply: {
			list: [],
			count: 0
		},
		mailList: [], // 通讯录列表
		chat: null,
		chatList : [], // 会话列表
		totalNoreadnum: 0, // 总未读数
		notice: {
			avatar: "",
			user_id: 0,
			num: 0
		},
		enterCount: 0, // 进入app次数
		groupCallCount: 0, // 进入群通话的人数
		isShowCount: false, // 是否显示群通话人数
		roomID: 0, // 通话房间号
	},
	mutations: {
		updateUser(state, { k, v }) { // 修改用户信息
			if (state.user) {
				state.user[k] = v
				$U.setStorage('user', JSON.stringify(state.user))
			}
		}
	},
	actions: {
		// 登陆后处理
		login({state, dispatch}, user) {
			//存入状态中
			state.user = user
			// 存储在本地
			$U.setStorage('token', user.token)
			$U.setStorage('user', JSON.stringify(user))
			$U.setStorage('user_id', user.id)
			$U.setStorage('isCurrentChat', false) //是否处于当前聊天中
			//连接socket
			dispatch('connectSocket')
			// 获取好友申请列表
			dispatch('getApply')
			// 获取通讯录列表
			dispatch('getMailList')
			// 获取会话列表
			dispatch('getChatList')
			// 初始化总未读数角标
			dispatch('updateBadge')
			// 打开本地数据库
			dispatch('openSqlite')
			// 获取朋友圈动态通知
			dispatch('getNotice');
		},
		// 连接socket
		connectSocket({state}) {
			if (!state.chat) {
				state.chat = new Chat({ url: $C.socketUrl })
			}
		},
		
		//更新用户信息
		updateUser({ state }) {
			state.chat.updateUser()
		},
		
		openSqlite() {
			const open = DB.isOpen();
			if(!open) {
				DB.openSqlite()
			}
		},
		// 退出登录
		logout({ state, dispatch }) {
			dispatch('resetData')
			// 跳转到登录页
			uni.reLaunch({
				url: "/pages/common/login/login"
			})
		},
		resetData({state}, close = true){
			// 清除登录状态
			state.user = null
			// 清除本地存储数据
			$U.removeStorage('token');
			$U.removeStorage('user');
			$U.removeStorage('user_id');
			
			// 关闭socket连接
			if (state.chat && close) {
				state.chat.close()
			}
			state.chat = null
			
			// 注销监听事件
			uni.$off('onUpdateChatList')
			uni.$off('totalNoreadnum')
			uni.$off('momentNotice')
		},
		// 不需要断线重连
		notNeedOpenReconnect({state}) {
			if (state.chat) {
				state.chat.notNeedOpenReconnect()
			}
		},
		// 初始化登录状态
		initLogin({state, dispatch}) {
			let user = $U.getStorage('user')
			if (user) {
				user = JSON.parse(user)
				state.user = user
				//连接socket
				dispatch('connectSocket')
				// 获取好友申请列表
				dispatch('getApply')
				// 获取通讯录列表
				dispatch('getMailList')
				// 获取会话列表
				dispatch('getChatList')
				// 初始化总未读数角标
				dispatch('updateBadge')
				// 打开本地数据库
				dispatch('openSqlite')
				// 获取朋友圈动态通知
				dispatch('getNotice');
				// 登录腾讯IM
				dispatch('loginTxTRTC')
			}
			
		},
		// 获取好友申请列表
		getApply({state, dispatch }, page = 1) {
			applyList({ page }).then(res => {
				// console.log(res);
				if (page === 1) {
					state.apply = res
				} else {
					state.apply.list = [...state.apply.list, ...res.list]
					state.apply.count = res.count
				}
				// 更新通讯录角标提示
				dispatch('updateMailBadge')
			})
		},
		// 更新通讯录角标提示
		updateMailBadge({ state }) {
			let count = state.apply.count > 99 ? '99+' : state.apply.count.toString()
			if (state.apply.count > 0) {
				return uni.setTabBarBadge({
					index: 1, //tabbar索引
					text: count //string类型 不支持数字
				})
			}
			// 移除
			uni.removeTabBarBadge({
				index: 1
			})
		},
		
		// 初始化总未读数角标
		updateBadge({state}) {
			// 开启监听总未读数变化
			uni.$on('totalNoreadnum', (num) => {
				state.totalNoreadnum = num
			})
			state.chat.updateBadge()
		},
		
		// 获取通讯录列表
		getMailList({state}) {
			getFriendList().then(res => {
				state.mailList = res.rows.newList ? res.rows.newList : []
				// console.log(res);
			})
		},
		
		// 获取会话列表
		getChatList({ state }) {
			state.chatList = state.chat.getChatList()
			// 监听会话列表变化
			uni.$on('onUpdateChatList', (list) => {
				state.chatList = list
			})
		},
		
		// 获取朋友圈动态通知
		getNotice({state}) {
			state.notice = state.chat.getNotice()
			if (state.notice.num > 0) {
				uni.setTabBarBadge({
					index: 2,
					text: state.notice.num > 99 ? '99+' : state.notice.num.toString()
				})
			} else {
				uni.removeTabBarBadge({
					index: 2
				})
			}
			uni.$on('momentNotice', (notice) => {
				state.notice = notice
			})
		},
		
		// 断线自动重连 第一次进入app无需执行
		reconnect({ state }) {
			if (state.user && state.chat && state.enterCount) {
				state.chat.reconnect()
			}
		},
		loginTxTRTC({ state }) {
			let user = $U.getStorage('user')
			if (user) {
			user = JSON.parse(user)
			const loginOptions = {
			  SDKAppID: $C.SDKAppID,
			  userID: user.username,
			  userSig: user.usersig
			};
			TUICallKit.login(loginOptions, (a) => {
				if (a.code !== 0) {
					uni.showToast({
						icon:'none',
						title:'腾讯IM登录失败' + a.msg
					})
				}
			})
		  }
		},
		// 进入app
		enterApp({ state }) {
			state.enterCount = state.enterCount + 1
		},
		
		callCount({state}, count) {
			state.groupCallCount = count
		},
		
		changeIsShowCount({state}, isShowCount) {
			state.isShowCount = isShowCount
		},
		onCallBegin({state}, roomID) {
			state.roomID = roomID
		}
		
	}
}