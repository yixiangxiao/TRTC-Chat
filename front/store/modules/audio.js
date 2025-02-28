
export default {
	namespaced:true,
	state:{
		// 存放全局事件
		events:[],
		RECORD: null, //全局录音管理
		recordTime: 0, //录音时长
		RECORDTIMER: null, //录音计时器
		sendVoice: null, //发送音频
	},
	actions:{
		// 分发注册全局事件
		audioOn({commit},event){
			commit('regEvent',event)
		},
		// 分发执行全局事件
		audioEmit({commit},params){
			commit('doEvent',params)
		},
		// 分发注销全局事件
		audioOff({commit},event){
			commit('removeEvent',event)
		}
	},
	mutations:{
		//注册全局录音器
		initRECORD(state){
			state.RECORD = uni.getRecorderManager()
			state.RECORD.onStart(() => {
				state.recordTime = 0
				state.RECORDTIMER = setInterval(() => {
					state.recordTime ++
				},1000)
			})
			state.RECORD.onStop(e => {
				if(state.RECORDTIMER) {
					clearInterval(state.RECORDTIMER)
					state.RECORDTIMER = null
				}
				//执行发送
				if(typeof state.sendVoice === 'function') {
					state.sendVoice(e.tempFilePath)
				}
			})
		},
		//注册发送音频事件
		regSendVoiceEvent(state, event){
			state.sendVoice = event
		},
		// 注册全局事件
		regEvent(state,event){
			state.events.push(event)
		},
		// 执行全局事件
		doEvent(state,params){
			state.events.forEach(e=>{
				// console.log('执行全局事件');
				e(params)
			})
		},
		// 注销事件
		removeEvent(state,event){
			let index = state.events.findIndex(item => {
				return item === event
			})
			if (index !== -1) {
				state.events.splice(index,1)
			}
		}
	},
}