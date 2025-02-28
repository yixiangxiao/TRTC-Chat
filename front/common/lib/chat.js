import $C from './config.js';
import $U from './util.js';
import $store from '@/store/index.js';
import { sendMessage, upload, recall, receiveMessage, getOfflineMessage } from '@/api/chat.js'
import { msgTimeFormat } from '@/common/lib/wechat-time.js'
import DB from '@/common/lib/sqLite.js'
import deepClone from '@/common/lib/deepClone.js'
import { getUserInfo } from '@/api/user.js'
import { getGroupInfo } from '@/api/group.js';
class chat {
	constructor(args){
		this.url = args.url //url
		this.isOnline = false //是否上线
		this.socket = null
		this.TO = null //对方 聊天对象
		this.reconnectTime = 0 // 断线重连次数
		this.isOpenReconnect = true // 是否开启断线重连
		//获取当前用户相关信息
		this.user_id = $U.getStorage('user_id')
		let user = $U.getStorage('user')
		this.user = user ? JSON.parse(user) : {}
		// 创建背景音频管理器
		this.bgAudioMannager = uni.getBackgroundAudioManager();
		//连接和监听
		if (this.user.token) {
			this.connectSocket()
		}
		
	}
	
	// 连接socket
	connectSocket(){
		if (this.socket) return 
		this.socket = uni.connectSocket({
			url: this.url + "?token=" + this.user.token,
			complete: () => {}
		})
		// 监听连接成功
		this.socket.onOpen(() => this.onOpen())
		// 监听接收信息
		this.socket.onMessage((res) => this.onMessage(res))
		// 监听断开
		this.socket.onClose((code, reason) => this.onClose(code, reason))
		// 监听错误
		this.socket.onError(() => this.onError())
	}
	
	// 监听打开
	onOpen(){
		// 用户上线
		this.isOnline = true
		this.isOpenReconnect = true
		this.reconnectTime = 0
		console.log('socket连接成功')
		// 获取用户离线消息
		this.getOfflineMessage()
	}
	
	// 监听关闭
	onClose(code, reason) {
		console.log(code, reason)
		// reason默认有空，不为空时是用户自定义
		if (reason === "") {
			// 用户下线
			this.isOnline = false
			this.socket = null
			if(this.isOpenReconnect){
				this.reconnect()
			}
		} else {
			// 不需要断线重连
			this.isOpenReconnect = false
			$store.dispatch('user/logout')
		}
		console.log('socket连接关闭')
	}
	// 监听连接错误
	onError(){
		// 用户下线
		this.isOnline = false
		this.socket = null
		if(this.isOpenReconnect){
			this.reconnect()
		}
		console.log('socket连接错误')
	}
	
	// 断线重连
	reconnect() {
		this.getOfflineMessage()
		if(this.isOnline){
			return
		}
		if(this.reconnectTime >= 20){
			return this.reconnectConfirm()
		}
		this.reconnectTime += 1
		this.connectSocket()
	}
	
	// 关闭连接
	close() {
		if (this.socket) {
			const { deviceId } = uni.getSystemInfoSync()
			this.socket.close({ code: 1000, reason: deviceId })
		}
		this.isOpenReconnect = false
	}
	
	// 不需要断线重连
	notNeedOpenReconnect() {
		this.isOpenReconnect = false
	}
	
	// 断线重连提示
	reconnectConfirm(){
		this.reconnectTime = 0
		uni.showModal({
			content: '你已经断线，是否重新连接？',
			confirmText:"重新连接",
			success:(res)=> {
				if (res.confirm) {
					this.connectSocket()
				}
			}
		});
	}
	
	// 验证是否上线
	checkOnline(){
		if(!this.isOnline){
			// 断线重连提示
			this.reconnectConfirm()
			return false
		}
		return true
	}
	
	// 创建聊天对象
	createChatObject(detail){
		this.TO = detail
		// console.log('创建聊天对象',this.TO);
	}
	// 销毁聊天对象
	destoryChatObject(){
		this.TO = null
		// console.log('销毁聊天对象');
	}
	
	async getOfflineMessage() {
		await getOfflineMessage()
	}
	
	//更新用户信息
	updateUser(){
		// 获取当前用户相关信息
		let user = $U.getStorage('user')
		this.user = user ? JSON.parse(user) : {}
	}
	
	// 监听接收消息
	async onMessage(data) {
		let res = JSON.parse(data.data)
		console.log('监听接收消息',res)
		switch (res.msg) {
			case 'fail':
			  if (res.data === '你的账号在其他设备登录') {
				  // 关闭断线自动重连
				  this.isOpenReconnect = false
				  this.socket.close({ code: 1000, reason: '你的账号在其他设备登录' })
				  $store.dispatch('user/resetData', false)
				  const TUICallKit = uni.requireNativePlugin('TencentCloud-TUICallKit');
				  TUICallKit.logout((res) => {
				    if (res.code !== 0) {
				      uni.showToast({
				      		title: res.msg,
				      		icon: 'none'
				      });
				    }
				  });
				  uni.showModal({
				  	content: '你的账号在其他设备登录,请重新登录',
				  	confirmText:"确定",
				  	success:(res)=> {
				  		if (res.confirm) {
				  			// 跳转到登录页
				  			uni.reLaunch({
				  				url: "/pages/common/login/login"
				  			})
				  		}
				  	}
				  });
			  } else {
				  uni.showToast({
				  		title: res.data,
				  		icon: 'none'
				  });
			  }
			break;
			case 'call' :
			   await this.handleOnMessage(res.data, true);
			   uni.$emit('sendCallData', res.data);
			   break;
			case 'call_count' : 
			   $store.dispatch('user/callCount', res.data.data)
			   break;
			case 'group_call_start' :
			   $store.dispatch('user/changeIsShowCount', true)
			   break;
			case 'group_call_end' :
			   $store.dispatch('user/changeIsShowCount', false)
			   break;
			case 'destory_group' :
			  // 处理解散群聊消息
			  await this.handleDestoryGroup(res.data)
			  break;
			case 'invite_group' :
			  // 处理邀请加群消息
			  await this.handleInviteGroup(res.data)
			  break;
			case 'kick_group' :
			   // 处理移出群聊消息
			  await this.handleKickGroup(res.data)
			  break;
			case 'join_group' :
			     // 处理加入群聊消息
			  await this.handleJoinGroup(res.data)
			  break;
			case 'recall' : // 撤回消息
			  await this.handleOnRecall(res.data)
			  break;
			case 'updateApplyList' : // 新的好友申请
			    $store.dispatch('user/getApply')
			   break;
			case 'delete_chat_message' : // 清除聊天记录
			   await this.handleOnDeleteChatMessage(res.data)
			   break;
			case 'moment': // 朋友圈更新
			  await this.handleMoment(res.data)
				break;
			default:
		      // 处理消息
			  await this.handleOnMessage(res.data)
			break;
		}
		// 回复
		await receiveMessage({ message: res.data })
	}
	
	// 获取本地存储中的朋友圈动态通知
	getNotice(){
		let notice = $U.getStorage('moment_'+this.user.id)
		return notice ? JSON.parse(notice) : {
			avatar:"",
			user_id:0,
			num:0
		}
	}
	// 处理朋友圈通知
	async handleMoment(message){
		let notice = this.getNotice()
		const currentMoment = $U.getStorage('isCurrentMoment') || false //是否处于朋友圈页面
		switch (message.type){
			case 'new':
			if(message.user_id !== this.user.id){ //不是自己
				notice.avatar = message.avatar
				notice.user_id = message.user_id
				uni.showTabBarRedDot({
					index:2
				})
			}
				break;
			default:
			if(message.user_id !== this.user.id){ //不是自己
				notice.avatar = message.avatar
				notice.user_id = message.user_id
				
				// 如果不处于朋友圈页面
				if (!currentMoment) {
					notice.num += 1
				}
			}
			if(notice.num > 0){
				uni.setTabBarBadge({
					index:2,
					text:notice.num > 99 ? '99+' : notice.num.toString()
				})
			} else {
				uni.removeTabBarBadge({
					index:2
				})
			}
				break;
		}
		uni.$emit('momentNotice',notice)
		$U.setStorage('moment_'+this.user.id,JSON.stringify(notice))
	}
	
	// 读取朋友圈动态
	async readMoments(){
		let notice = {
			avatar:"",
			user_id:0,
			num:0
		}
		$U.setStorage('moment_'+this.user.id,JSON.stringify(notice))
		uni.hideTabBarRedDot({
			index:2
		})
		uni.removeTabBarBadge({
			index:2
		})
		uni.$emit('momentNotice',notice)
	}
	
	// 监听清除聊天记录
	async handleOnDeleteChatMessage(message) {
		let id = message.chat_type === 'group' ? message.to_id : message.from_id
		let list = this.getChatList()
		// 会话是否存在
		let index = list.findIndex(item=>{
		  return item.chat_type === message.chat_type && item.id === id
		})
		// 修改会话列表
		if (index !== -1) {
			let item = list[index]
			item.update_time = '' // 修改时间
			item.data = '' // 修改聊天内容
			item.noreadnum = 0
			this.updateChatItem({ id: item.id,chat_type: item.chat_type },item)
		}
		// 删除聊天记录表
		this.deleteChatTable(id, message.chat_type)
	}
	
	// 监听撤回消息处理
	async handleOnRecall(message){
		const id = message.chat_type === 'group' ? message.to_id : message.from_id
		// 表名: chat_当前用户id_会话类型_接收人/群id
		const table = `chat_${this.user_id}_${message.chat_type}_${id}`;
		// 通过message_id 来查询该消息是否存在
		const message_id = message.message_id
		// 通知聊天页撤回消息
		uni.$emit('onMessage',{ ...message, isremove: 1 })
		const sql = `UPDATE ${table} SET isremove = 1 WHERE message_id = '${message_id}';`
		// 修改当前表数据
		await DB.executeSql(sql)
		// 通知页面(回复内容要刷新)
		uni.$emit('deleteOrRemove', message_id)
		// 查询最后一条消息
		const lastSql = `SELECT * FROM ${table} WHERE create_time = (SELECT MAX(create_time) FROM ${table})`
		const lastData = await DB.selectSql(lastSql)
		// 当前会话最后一条消息的显示
		this.updateChatItem({id, chat_type:message.chat_type },(item) => {
			// 如果数据库最后一条消息是撤回 则修改
			if (lastData.length > 0 && lastData[0].isremove === 1) {
				if (message.chat_type === 'user') {
					item.data = '对方撤回了一条消息'
				} else {
					item.data = `${message.from_name}撤回了一条消息`
				}
			}
			item.update_time = message.create_time
			const isCurrentChat =  $U.getStorage('isCurrentChat') || false
			// 不在聊天页
			if (!isCurrentChat) {
				if (!item.noreadnum) item.noreadnum = 1
			}
			// 不在聊天页 没开启消息免打扰
			if (!isCurrentChat && !item.nowarn) {
				item.offline = message.offline
				this.createNotice(item)
			}
			
			return item
		})
			
	}
	
	// 处理解散群聊消息
	async handleDestoryGroup(message) {
		await this.handleOnMessage(message)
		// 因为是接收者 所以都是 to_id
		const id = message.to_id
		const chat_type = message.chat_type // 群聊也就是group
		// 获取所有会话列表
		let list = this.getChatList()
		// 找到当前会话
		let index = list.findIndex(item=>item.id === id && item.chat_type === chat_type)
		if (index !== -1) {
			const item = list[index]
			item.quit_group = true
			this.updateChatItem({id, chat_type}, item)
		}
	}
	
	// 处理踢出群聊消息
	async handleKickGroup(message) {
		await this.handleOnMessage(message)
		// 因为是接收者 所以都是 to_id
		const id = message.to_id
		const chat_type = message.chat_type // 群聊也就是group
		// 获取所有会话列表
		let list = this.getChatList()
		// 找到当前会话
		let index = list.findIndex(item=>item.id === id && item.chat_type === chat_type)
		if (index !== -1) {
			const item = list[index]
			item.quit_group = true
			this.updateChatItem({id, chat_type}, item)
		}
	}
	
	// 处理邀请加群消息
	async handleInviteGroup(message) {
		await this.handleOnMessage(message)
		// 因为是接收者 所以都是 to_id
		const id = message.to_id
		const chat_type = message.chat_type // 群聊也就是group
		// 获取所有会话列表
		let list = this.getChatList()
		// 找到当前会话
		let index = list.findIndex(item=>item.id === id && item.chat_type === chat_type)
		if (index !== -1) {
			const item = list[index]
			item.quit_group = false
			this.updateChatItem({id, chat_type}, item)
		}
		
	}
	
	// 处理加入群聊消息
	async handleJoinGroup(message) {
		await this.handleOnMessage(message)
		// 因为是接收者 所以都是 to_id
		const id = message.to_id
		const chat_type = message.chat_type // 群聊也就是group
		// 获取所有会话列表
		let list = this.getChatList()
		// 找到当前会话
		let index = list.findIndex(item=>item.id === id && item.chat_type === chat_type)
		if (index !== -1) {
			const item = list[index]
			message.data =  `你 加入群聊`
			item.quit_group = false
			this.updateChatItem({id, chat_type}, item)
		}
		
	}
	
	// 监听离线撤回消息处理
	async handleOffLineRecall(message){
		const id = message.chat_type === 'group' ? message.to_id : message.from_id
		// 表名: chat_当前用户id_会话类型_接收人/群id
		const table = `chat_${this.user_id}_${message.chat_type}_${id}`;
		// 通过message_id 来查询该消息是否存在
		const message_id = message.message_id
		// 通知聊天页撤回消息
		uni.$emit('onMessage',{ ...message, isremove: 1 })
		// 通知页面(回复内容要刷新)
		uni.$emit('deleteOrRemove', message_id)
		// 查询最后一条消息
		const lastSql = `SELECT * FROM ${table} WHERE create_time = (SELECT MAX(create_time) FROM ${table})`
		const lastData = await DB.selectSql(lastSql)
		// 当前会话最后一条消息的显示
		this.updateChatItem({id, chat_type:message.chat_type },(item) => {
			// 如果数据库最后一条消息是撤回 则修改
			if (lastData.length > 0 && lastData[0].isremove === 1) {
				if (message.chat_type === 'user') {
					item.data = '对方撤回了一条消息'
				} else {
					item.data = `${message.from_name}撤回了一条消息`
				}
			}
			item.update_time = message.create_time
			const isCurrentChat =  $U.getStorage('isCurrentChat') || false
			// 不在聊天页
			if (!isCurrentChat) {
				if (!item.noreadnum) item.noreadnum = 1
			}
			// 不在聊天页 没开启消息免打扰
			if (!isCurrentChat && !item.nowarn) {
				item.offline = message.offline
				this.createNotice(item)
			}
			return item
		})
	}
	
	// 处理消息(接收消息)
	async handleOnMessage(message, isSend = false){
		const id = message.chat_type === 'group' ? message.to_id : message.from_id
		// 表名: chat_当前用户id_会话类型_接收人/群id
		const table = `chat_${this.user_id}_${message.chat_type}_${id}`;
		// 通过message_id 来查询该消息是否存在
		const message_id = message.message_id
		const sql = `SELECT * FROM ${table} WHERE message_id = '${message_id}'`
		let data = []
		try {
			data = await DB.selectSql(sql);
		} catch(e){
			data = []
		}
		if (data.length > 0) {
			// 离线撤回消息处理
			if (message.isremove) {
				this.handleOffLineRecall(message)
			}
			return
		} 
		// 添加消息记录到本地存储中
		message.send_status = 'success'
		await this.addChatHistory(message, isSend)
		// 更新会话列表
		await this.updateChatList(message, isSend)
		// 全局通知
		uni.$emit('onMessage', message)
		
		// 消息提示
		// this.messageNotice()
	}
	
	// 组织发送信息格式
	formatSendData(params){
		return {
			message_id: 0, // 唯一id，后端生成，用于撤回指定消息
			from_avatar: this.user.avatar,// 发送者头像
			from_name: this.user.nickname || this.user.username, // 发送者昵称
			from_id: this.user.id, // 发送者id
			to_id: params.to_id || this.TO.id, // 接收人/群 id
			to_name: params.to_name || this.TO.name, // 接收人/群 名称
			to_avatar: params.to_avatar || this.TO.avatar, // 接收人/群 头像
			chat_type: params.chat_type || this.TO.chat_type, // 接收类型
			type: params.type,// 消息类型
			data: params.data, // 消息内容
			options: JSON.stringify(params.options) ||  '{}', // 其他参数
			create_time: (new Date()).getTime(), // 创建时间
			isremove: 0, // 是否撤回
			isread: 0, // 是否已读 默认为0 主要用于是否点击了语音
			send_status: params.send_status ? params.send_status : "pending", // 发送状态，success发送成功,fail发送失败,pending发送中
		}
	}
	
	// 撤回消息(主动撤回)
	async recall(message){
		try {
			const res = await recall({message})
			// 表名: chat_当前用户id_会话类型_接收人/群id
			const table = `chat_${this.user_id}_${message.chat_type}_${message.to_id}`;
			const sql = `UPDATE ${table} SET isremove = 1 WHERE message_id = '${message.message_id}';`
			// 修改当前表数据
			await DB.executeSql(sql)
			// 更新会话最后一条消息显示
			this.updateChatItem({ id: message.to_id,chat_type: message.chat_type }, (item) => {
				item.data = '你撤回了一条消息'
				item.update_time = (new Date()).getTime()
				return item
			})
			return res
		} catch(e) {
			throw e
		}
	}
	
	// 发送消息
	async send(message, onProgress = false) {
		try {
			// console.log(message, this.TO);
			// 验证是否上线
			if (!this.checkOnline()) throw '未上线'
			
			// 上传文件
			let isUpload = (message.type !== 'text' && message.type !== 'notice' && message.type !== 'reply' && message.type !== 'emoji' && message.type !== 'card' && message.type !== 'position' && message.type !== 'callVoice' && message.type !== 'callVideo' && !message.data.startsWith('http'))
			let uploadResult = ''
			if(isUpload){
				uploadResult = await upload({filePath: message.data}, onProgress)
			}
			// 提交到后端
			let data = isUpload ? uploadResult.url : message.data
			let options = {}
			// 视频封面
			if (message.type === 'video' && !message.data.startsWith('http')) {
				options.poster = uploadResult.cover
				message.options = JSON.stringify(options)
			}
			// console.log(data, '====>11111', message)
			const res = await sendMessage({
				to_id: message.to_id || this.TO.id,
				chat_type: message.chat_type || this.TO.chat_type,
				type: message.type,
				data,
				options: message.options,
			});
			// 发送成功
			res.send_status = 'success';
			res.isread = 1
			// 添加消息历史记录
			await this.addChatHistory(res);
			// 更新会话列表
			await this.updateChatList(res)
			return res;
		} catch (err) {
			// console.log(err)
			// 发送失败
			message.send_status = 'fail';
			message.message_id = new Date().getTime() + '';
			// 添加消息历史记录
			await this.addChatHistory(message);
			throw err;
		}
	}
	
	// 创建通知栏消息
	createNotice(item) {
		// 离线消息不需要创建通知栏提醒
		if(item.offline) return
		uni.createPushMessage({
			icon: '/static/icon.png', //推送消息的图标
			title: item.name, // 默认值为程序的名称
			content: item.data,
			when: new Date(item.update_time),
			payload: item, // 这里地方你可以随意组合你想要的数据，uni.onPushMessage会监听到你组合的数据。
			success:(res => {
				// console.log('成功创建')
			}),
		})
	}
	
	// 获取群成员头像
	async getGroupAvatarList(id) {
		const res = await getGroupInfo(id)
		const list = res.group_users.map(v => {
			return {
				user_id: v.user_id,
				avatar: v.user.avatar
			}
		})
		return list
	}
	
	// 更新会话列表
	async updateChatList(message, isSend = true) {
		// 获取本地存储会话列表
		let list = this.getChatList()
		// 是否处于当前聊天中(通话需要特殊处理)
		let isCurrentChat =  $U.getStorage('isCurrentChat') || false
		// 接收人/群 id/头像/昵称
		let id = 0
		let avatar = ''
		let name = ''
		// 判断私聊还是群聊
		if(message.chat_type === 'user') { // 私聊
			// 聊天对象是否存在
			// isCurrentChat = this.TO ? (isSend ? this.TO.id === message.to_id : this.TO.id === message.from_id) : false
			// 兼容通话
			const _isCurrentChat = this.TO ? (isSend ? this.TO.id === message.to_id : this.TO.id === message.from_id) : false
			isCurrentChat = isCurrentChat && _isCurrentChat
			id = isSend ? message.to_id : message.from_id
			avatar = isSend ? message.to_avatar : message.from_avatar
			name = isSend ? message.to_name : message.from_name
		} else { // 群聊
			// isCurrentChat = this.TO && (this.TO.id === message.to_id)
			// 兼容通话
			const  _isCurrentChat = this.TO && (this.TO.id === message.to_id)
			isCurrentChat = isCurrentChat && _isCurrentChat
			id = message.to_id
			avatar = message.to_avatar
			name = message.to_name
		}
		
		// 如果会话类型不匹配 并且不是发送方
		if (this.TO && this.TO.chat_type !== message.chat_type && !isSend) {
			isCurrentChat = false
		}
		
		// 会话是否存在
		let index = list.findIndex(item=>{
			return item.chat_type === message.chat_type && item.id === id
		})
		
		// 最后一条消息展现形式
		let data = this.formatChatItemData(message,isSend)
		// 处理撤回消息
		if (message.isremove) {
			if (message.chat_type === 'user') {
				data = '对方撤回了一条消息'
			} else {
				data = `${message.from_name}撤回了一条消息`
			}
		}
	
		// 未读数是否 + 1
		let noreadnum = isCurrentChat ? 0 : 1
		// 会话不存在，创建会话
		if (index === -1) {
			let chatItem = {
				id, // 接收人/群 id
				chat_type:message.chat_type, // 接收类型 user单聊 group群聊
				avatar, // 接收人/群 头像
				name, // 接收人/群 昵称
				update_time: message.create_time, // 最后一条消息的时间戳
				data, // 最后一条消息内容
				type:message.type, 		   // 最后一条消息类型
				noreadnum, // 未读数
				istop:false, // 是否置顶
				shownickname:false, // 是否显示昵称
				nowarn:false, // 消息免打扰
				strongwarn:false, // 是否开启强提醒
				quit_group: false, // 是否退出群聊
				need_notice: false // 是否需要@
			}
			// 单聊
			if (message.chat_type === 'user') {
				const avatarList = [
					{ user_id: message.from_id, avatar: message.from_avatar }, 
					{ user_id: message.to_id, avatar: message.to_avatar },
				]
				chatItem.avatarList = avatarList
			}
			// 群聊
			if(message.chat_type === 'group' && message.group){
				chatItem.avatarList = await this.getGroupAvatarList(message.to_id)
				chatItem.shownickname = true
				// 更新群名称
				chatItem.name = name
				chatItem = {
					...chatItem,
					user_id:message.group.user_id, // 群管理员id
					remark:"", // 群公告
					invite_confirm:1, // 邀请确认
					group: message.group
				}
			}
			list.unshift(chatItem)
		} else { // 存在，更新会话
			// 拿到当前会话
			let item = list[index]
			// 更新该会话最后一条消息时间，内容，类型
			item.update_time = message.create_time
			// 更新名称
			item.name = name
			item.data = data
			item.type = message.type
			item.group = message.group
			// 有人退出群聊或加入群聊时
			if(message.chat_type === 'group' && message.avatarList){
				item.avatar = message.to_avatar
				item.avatarList = message.avatarList
			}
			
			if (message.chat_type === 'group' && message.type === 'notice') {
				const noticeIds = JSON.parse(message.options).noticeIds
				// 如果包含自己，并且不在聊天页面
				if (noticeIds.includes(this.user_id) && !isCurrentChat) {
					item.need_notice = true
				}
			}
			// 未读数更新
			item.noreadnum += noreadnum
			// 置顶会话
			list = this.listToFirst(list,index)
		}
		// 存储
		let key = `chatlist_${this.user.id}`
		this.setStorage(key,list)
		// 更新未读数
		await this.updateBadge(list)
		// 通知更新vuex中的聊天会话列表
		uni.$emit('onUpdateChatList',list)
		
		const current = list.findIndex(item=>{
			return item.chat_type === message.chat_type && item.id === id
		})
		let item = list[current]
		//如果不处于聊天页并且未开启消息免打扰则创建系统通知消息
		if (!isCurrentChat && item.nowarn !== true) {
			item.offline = message.offline
			this.createNotice(item)
		}
		
		return list
	}
	
	// 更新指定会话
	async updateChatItem(where,data){
		// 获取所有会话列表
		let list = this.getChatList()
		// 找到当前会话
		let index = list.findIndex(item=>item.id === where.id && item.chat_type === where.chat_type)
		if(index === -1) return;
		// 更新数据
		if(typeof data === 'function'){
			list[index] = data(list[index])
		} else {
			list[index] = data
		}
		
		let key = `chatlist_${this.user.id}`
		this.setStorage(key,list)
	
		// 更新会话列表状态
		uni.$emit('onUpdateChatList',list)
	}
	
	// 读取会话
	async readChatItem(id,chat_type){
		// 获取所有会话列表
		let list = this.getChatList()
		// 找到当前会话
		let index = list.findIndex(item=>item.id === id && item.chat_type === chat_type)
		if(index !== -1){
			list[index].noreadnum = 0
			// 清除@
			list[index].need_notice = false
			let key = `chatlist_${this.user.id}`
			this.setStorage(key,list)
			// 重新获取总未读数
			this.updateBadge()
			// 更新会话列表状态
			uni.$emit('onUpdateChatList',list)
		}
	}
	
	// 删除指定会话
	async removeChatItem(id,chat_type){
		// 获取所有会话列表
		let list = this.getChatList()
		// 找到当前会话
		let index = list.findIndex(item=>item.id === id && item.chat_type === chat_type)
		if(index !== -1){
			list.splice(index,1)
			
			let key = `chatlist_${this.user.id}`
			// 删除当前聊天记录表
			this.deleteChatTable(id,chat_type)
			this.setStorage(key,list)
			// 重新获取总未读数
			this.updateBadge()
			// 更新会话列表状态
			uni.$emit('onUpdateChatList',list)
		}
	}
	
	// 更新未读数
	async updateBadge(list = false){
		// 获取所有会话列表
		list = list ? list : this.getChatList()
		// 过滤掉免打扰的
		list = list.filter(v => !v.nowarn)
		// 统计所有未读数
		const total = list.reduce((pre, cur) => {
			return pre += cur.noreadnum
		},0)
		// 设置底部导航栏角标
		if(total > 0){
			uni.setTabBarBadge({
				index:0,
				text:total <= 99 ? total.toString() : '99+'
			})
		} else {
			uni.removeTabBarBadge({
				index:0
			})
		}
		uni.$emit('totalNoreadnum',total)
	}
	
	// 获取聊天记录
	async getChatHistory(params = {}) {
		try {
			let {table = '', page = 1, pageSize = DB.pageSize, chat_type, id } = params
			const _chat_type = this.TO ? this.TO.chat_type : chat_type
			const _id = this.TO ? this.TO.id : id
			table = table ? table : `chat_${this.user.id}_${_chat_type}_${_id}`
			const offset = (page - 1) * pageSize
			// 查询最新的100条
			const sql = `SELECT * FROM ${table} ORDER BY create_time DESC LIMIT ${pageSize} OFFSET ${offset};`
			const data = await DB.selectSql(sql)
			// 兼容之前的回复数据(开始) 可去掉
			// 映射
			const idsMap = []
			// 拿到所有的回复id
			const ids = []
			data.forEach(v => {
				if (v.type === 'reply') {
					const id = JSON.parse(v.options).message_id
					idsMap.push({ message_id: v.message_id, reply_id: id })
					ids.push(id)
				}
			})
			const placeholders = ids.map((id) => `'${id}'`).join(',');
			const replySql = `SELECT * FROM ${table} WHERE message_id IN (${placeholders})`;
			// 查询所有的回复信息
			const replys = await DB.selectSql(replySql)
			// 做回复映射
			const replysMap = replys.reduce((acc, obj) => {
			    acc[obj.message_id] = obj;
			    return acc;
			}, {});
			// 给有回复的加上值
			data.forEach(v => {
				const item = idsMap.find(f => f.message_id === v.message_id) || {}
				if (item.reply_id) {
					v.options = JSON.stringify(replysMap[item.reply_id] || {})
				}
			})
			// 兼容之前的回复数据(结束)
			// 然后再正序 从小到大(chat.nvue没有旋转180时需要放开注释)
			// data.sort((a, b) => a.create_time - b.create_time);
			return this.msgTimeFormat(data)
		} catch(err) {
			console.log(err)
			throw err
		}
	}
	
	msgTimeFormat(list) {
		const data = deepClone(list)
		return msgTimeFormat(data.reverse(), 0, 0).reverse()
		// chat.nvue没有旋转180时使用
		// return msgTimeFormat(data, 0, 0)
	}
	
	// 数组置顶
	listToFirst(arr,index){
		if (index != 0) { // splice会改变原数组 slice不会
			arr.unshift(...arr.splice(index,1));
		}
		return arr;
	}
	
	// 格式化会话最后一条消息显示
	formatChatItemData(message,isSend){
		let data = message.data
		switch (message.type){
			case 'emoji':
			data = '[表情]'
				break;
			case 'image':
			data = '[图片]'
				break;
			case 'audio':
			data = '[语音]'
				break;
			case 'video':
			data = '[视频]'
				break;
			case 'card':
			data = '[名片]'
				break;
			case 'position':
			data = '[位置]'
			    break;
			case 'callVoice':
			data = '[语音通话]'
				break;
			case 'callVideo':
			data = '[视频通话]'
			    break;
		}
		data = (isSend || message.type === 'system') ? data : `${message.from_name}: ${data}` // 不是发送或者是系统通知就加上名字
		return data
	}
	
	// 获取本地存储会话列表
	getChatList() {
		let key = `chatlist_${this.user.id}`
		return this.getStorage(key)
	}
	
	getChatListKey() {
		return `chatlist_${this.user.id}`
	}
	
	// 获取指定会话
	getChatListItem (id, chat_type) {
		// 获取所有会话列表
		let list = this.getChatList()
		// 找到当前会话
		let index = list.findIndex(item=>item.id === id && item.chat_type === chat_type)
		if (index !== -1) {
			return list[index]
		}
		return null
	}
	
	// 获取指定会话(聊天设置页使用)
	async getChatListItem2(id,chat_type){
		// 获取所有会话列表
		let list = this.getChatList()
		// 找到当前会话
		let index = list.findIndex(item=>item.id === id && item.chat_type === chat_type)
		if (index !== -1) {
			return list[index]
		}
		let avatar = ''
		let name = ''
		// 单聊 获取用户信息
		if (chat_type === 'user') {
			const user = await getUserInfo(id)
			avatar = user.avatar
			name = user.nickname ? user.nickname : user.username
		}
		// 如果不存在则给默认值(还没创建会话的时候)
		return {
					id, // 接收人/群 id
					chat_type, // 接收类型 user单聊 group群聊
					avatar, // 接收人/群 头像
					name, // 接收人/群 昵称
				
					istop:false, // 是否置顶
					shownickname:false, // 是否显示昵称
					nowarn:false, // 消息免打扰
					strongwarn:false, // 是否开启强提醒
					
					user_id:0, // 群管理员id
					remark:"", // 群公告
					invite_confirm:0, // 邀请确认
				}
	}
	
	// 获取存储
	getStorage(key) {
		let list = $U.getStorage(key)
		return list ? JSON.parse(list) : []
	}
	
	// 设置存储
	setStorage(key,value){
		return $U.setStorage(key,JSON.stringify(value))
	}
	
	// 添加消息历史记录
	async addChatHistory(message, isSend = true) {
		// 如果是单聊 ? 如果是发送者 id就是to_id 否则就是from_id : to_id
		const id = message.chat_type === 'user' ? (isSend ? message.to_id : message.from_id) : message.to_id;
		// 表名: chat_当前用户id_会话类型_接收人/群id
		const table = `chat_${this.user_id}_${message.chat_type}_${id}`;
		const { column, values } = this.createInsertData(message);
		await this.createTable(table);
		const sql = `INSERT INTO ${table} (${column}) VALUES(${values})`
		await DB.executeSql(sql);
	}
	
	// 删除指定消息
	async deleteChatMessage(message, isSend = true) {
		// 如果是单聊 ? 如果是发送者 id就是to_id 否则就是from_id : to_id
		const id = message.chat_type === 'user' ? (isSend ? message.to_id : message.from_id) : message.to_id;
		// 表名: chat_当前用户id_会话类型_接收人/群id
		const table = `chat_${this.user_id}_${message.chat_type}_${id}`;;
		await this.createTable(table);
		const sql = `DELETE FROM ${table} WHERE message_id = '${message.message_id}'`
		await DB.executeSql(sql);
	}
	
	// 生成插入数据
	createInsertData(message) {
		const column = 'message_id,from_avatar,from_name,from_id,to_id,to_name,to_avatar,chat_type,type,data,options,create_time,isremove,isread,send_status'
		// 必须带引号 不能换行
		const values = `'${message.message_id}','${message.from_avatar}','${message.from_name}','${message.from_id}','${message.to_id}','${message.to_name}','${message.to_avatar}','${message.chat_type}','${message.type}','${message.data}','${message.options}','${message.create_time}','${message.isremove}','${message.isread}','${message.send_status}'`;
		return { column, values }
	}
	// 创建表结构
	async createTable(table) {
		const open = DB.isOpen();
		if (open) {
			const sql = `"id" INTEGER PRIMARY KEY AUTOINCREMENT,"message_id" text,"from_avatar" text,"from_name" text,"from_id" INTEGER,"to_id" INTEGER,"to_name" text,"to_avatar" text,"chat_type" text,"type" text,"data" text,"options" text,"create_time" INTEGER,"isremove" INTEGER,"isread" INTEGER,"send_status" text`;
			try {
				// 创建表 DB.createTable(表名, 表的列)
				await DB.createTable(table, sql);
				// console.log(`创建${table}表成功`);
			} catch (error) {
				// console.log("创建表失败", error);
				throw error;
			}
		} else {
			console.log("数据库未打开");
		}
	}
	// 删除聊天记录表
	async deleteChatTable(id, chat_type) {
		const table = `chat_${this.user_id}_${chat_type}_${id}`;
		await DB.dropTable(table)
		// 重新获取总未读数
		this.updateBadge()
		uni.$emit('clearChatHistory')
	}
	
}
export default chat