<template>
	<view @longpress="onLong" class="px-3" @touchend="touchend" @click="clickPage">
		<!-- 占位 -->
		<view class="mt-2"></view>
		
		<!-- 时间显示 -->
		<view v-if="item.isShowTime" class="flex align-center justify-center pb-2 pt-3">
			<text class="font-sm text-light-muted">{{ item.payload.text }}</text>
		</view>
		<!-- 撤回消息 -->
		<view v-if="item.isremove" ref="isRemove" class="flex align-center justify-center pb-3 pt-3" :class=" item.isremove ? '' : 'chat-animate' ">
			<text class="font-sm text-light-muted">{{recallText}}</text>
			<text v-if="!isExpired && item.type === 'text' && isSelf" class="ml-2 font-sm text-primary" @click="redit">重新编辑</text>
		</view>
		<!-- 系统消息 -->
		<view v-if="item.type === 'system'" class="flex align-center justify-center pb-4 pt-1">
			<text class="font-sm text-light-muted">{{ item.data }}</text>
		</view>
		
		<!-- 气泡 -->
	<view v-if="item.type !== 'system' && !item.isremove" class="flex align-start justify-start position-relative flex-wrap"
			:class="isSelf ? 'justify-end' : 'justify-start'">
			<!-- 好友 -->
			<template v-if="!isSelf">
				<!-- item.from_avatar -->
				<view @touchend="touchendFriend" @longpress="onLongFriend">
					<my-avatar size="90" :src="avatar" @click="openUser"></my-avatar>
				</view>
				<text v-if="hasLabelClass"
					class="iconfont font-md text-white position-absolute chat-left-icon"
					:style="shownickname ? 'top:45rpx;' : 'top: 20rpx;'">&#xe609;</text>
			</template>
			
		<view class="flex flex-column">
				
			<!-- 昵称 -->
			<view v-if=" shownickname "  class="flex pb-1" :class="nicknameClass" style="max-width:500rpx;background-color: rgba(0,0,0,0);" :style="labelStyle">
				<text class="font-sm text-muted">{{ nickname }}</text>
			</view>

			<div class="rounded" :class="labelClass" :style="labelStyle" style="max-width:500rpx;">
				<!-- 文字内容 -->
				<view v-if="html" class="p-2">
					<mp-html :content="html" container-style="width:300px;line-height:22px;font-size: 22px;padding-top:5px;" @linktap="linktap" />
				</view>
				<text v-if=" (item.type === 'text' || item.type === 'reply' || item.type === 'notice') && !this.html" class="font-md p-2">{{ item.data }}</text>
				<!-- 表情包或者图片 -->
				<my-image v-if="item.type === 'emoji' || item.type === 'image' " :src="item.data" image-calss="rounded"
					@click="preview(item.data)" :max-h="350" :max-w="500" stop-propagation></my-image>
				<!-- 语音 -->
				<view v-if="item.type === 'audio'" class="flex align-center rounded"
					:class="isSelf ? 'justify-end' : 'justify-start'" @click="playAudio">
					<image v-if="!isSelf"
						:src="isAudioPlay ? '../../static/audio/voice-l.gif' : '../../static/audio/yyl.png'"
						mode="widthFix" style="height: 50rpx;width: 50rpx;"></image>
					<text class="font-md  p-2">{{JSON.parse(item.options).time}}{{'"'}}</text>
					<image v-if="isSelf"
						:src="isAudioPlay ? '../../static/audio/voice-r.gif' : '../../static/audio/yyr.png'"
						mode="widthFix" style="height: 50rpx;width: 50rpx;"></image>
					<!-- 红点提示 -->
					<view v-if="!isSelf && !item.isread" class="position-absolute font-sm bg-danger p-1 rounded-circle" style="bottom: 30rpx;right: 0rpx;"></view>
				</view>
				<!-- #ifdef APP-PLUS-NVUE -->
				<!-- 视频 -->
				<view v-if="item.type === 'video'" class="flex align-center position-relative rounded"
					@click="playVideo">
					<my-image :src="JSON.parse(item.options).poster" image-calss="rounded" :max-h="350" :max-w="500"
						@load="loadPoster"></my-image>
					<text class="iconfont text-white position-absolute" :style="posterStyle"
						style="font-size: 80rpx;width: 80rpx;height: 80rpx;">&#xe737;</text>
				</view>
				<!-- #endif -->
				
				<!-- #ifdef MP -->
				<view v-if="item.type === 'video'" class=" flex align-center justify-center position-relative rounded"
					@click="playVideo">
					<image :src="JSON.parse(item.options).poster" image-calss="rounded"></my-image>
					<text class="iconfont text-white position-absolute"
						style="font-size: 80rpx;width: 80rpx;height: 80rpx;">&#xe737;</text>
				</view>
				<!-- #endif -->
				
				<!-- 名片 -->
				<view v-if="item.type === 'card'" class="bg-white" style="width: 400rpx;" hover-class="bg-light" @click="openUserBase">
					<view class="p-3 flex align-center border-bottom border-light-secondary">
						<my-avatar size="70" :src="JSON.parse(item.options).avatar"></my-avatar>
						<text class="font ml-2">{{ item.data }}</text>
					</view>
					<view class="flex align-center p-2"><text class="font-small text-muted">个人名片</text></view>
				</view>

				<!-- 位置 -->
				<view v-if="item.type === 'position'" class="bg-white rounded" style="width: 480rpx;" @click="openLocation(item)">
					<view class="flex flex-column align-center">
						<text class="px-2 font-md text-ellipsis">{{ JSON.parse(item.data).name }}</text>
						<text class="font-sm text-light-muted text-ellipsis">{{JSON.parse(item.data).address }}</text>
					</view>
					<image 
					:src="`https://restapi.amap.com/v3/staticmap?markers=-1,https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png,0:${JSON.parse(item.data).longitude},${JSON.parse(item.data).latitude}&key=599a6626fbb17920034041fa12c1a9cc`" mode="widthFix"></image>
				</view>
				
				<!-- 语音通话 -->
				<view @click="handleCall('voice')" v-else-if="item.type === 'callVoice'" class="flex p-2 align-center justify-center rounded">
					<image src="/static/images/callVoice.png" style="height: 48rpx;width: 48rpx;"></image>
					<text class="font-md" v-if="item.data.indexOf('0') === -1">{{isSelf ? '你' : '对方'}}{{ item.data }}</text>
					<text class="font-md" v-if="item.data.indexOf('0') !== -1 ">通话时长：{{ item.data }}</text>
				</view>
				
				<!-- 视频通话 -->
				<view @click="handleCall('video')" v-else-if="item.type === 'callVideo'" class="flex p-2 align-center justify-center rounded">
					<image src="/static/images/callVideo.png" class="mr-2" style="height: 48rpx;width: 48rpx;"></image>
					<text class="font-md" v-if="item.data.indexOf('0') === -1">{{isSelf ? '你' : '对方'}}{{ item.data }}</text>
					<text class="font-md" v-if="item.data.indexOf('0') !== -1 ">通话时长：{{ item.data }}</text>
				</view>
			</div>
			
		</view>
			
			<!-- 本人 -->
			<template v-if="isSelf">
				<text v-if="hasLabelClass"
					class="iconfont font-md text-chat-item position-absolute chat-right-icon"
					:style="shownickname ? 'top:45rpx;' : 'top: 20rpx;'">&#xe640;</text>
				<my-avatar size="90" :src="avatar" @click="openUser"></my-avatar>
				<!-- item.from_avatar -->
			</template>
			
		</view>
		
		<!-- 回复 -->
		<view v-if="item.type === 'reply' && !item.isremove" @touchend="touchendReply" @longpress="onLongReply"  class="mt-1 flex align-center" :class="replyClass" @click="scrollToElement">
			<view  class="flex rounded " :style="replyStyle" style="background-color: rgba(0, 0, 0, 0.1);">
				<view v-if="noReplyText" class="p-1">
					<text class="font-sm text-muted">{{noReplyText}}</text>
				</view>
				
				<view v-if="replyMessage.message_id && replyMessage.isremove === 0">
					<text v-if="replyMessage.type === 'text' || replyMessage.type === 'notice' || replyMessage.type === 'reply'" style="max-width: 500rpx;" class="font-sm p-1 text-muted text-ellipsis">{{replyMessage.from_name}}:{{replyMessage.data}}</text>
					<!-- 表情包或者图片 -->
					<view v-if="replyMessage.type === 'emoji' || replyMessage.type === 'image' ">
						<view class="flex p-1 align-center">
							<text class="text-muted font-sm mr-2">{{replyMessage.from_name}}:</text>
							<image  :src="replyMessage.data" style="height: 50rpx;width: 50rpx;"></image>
						</view>
					</view>
					<!-- 视频 -->
					<view v-if="replyMessage.type === 'video'" class="flex align-center position-relative rounded">
						<view class="flex align-center p-1">
							<text class="text-muted font-sm mr-2">{{replyMessage.from_name}}:</text>
							<view class="">
								<my-image :src="JSON.parse(replyMessage.options).poster" image-calss="rounded" :max-h="50" :max-w="50"
									@load="loadPoster2"></my-image>
								<text class="iconfont text-white position-absolute" :style="posterStyle2"
									style="font-size: 20rpx;width: 20rpx;height: 20rpx;">&#xe737;</text>
							</view>
						</view>
					</view>
					
					<!-- 位置 -->
					<view v-if="replyMessage.type === 'position'">
						<view class="flex align-center p-1">
							<text class="text-muted font-sm mr-2">{{replyMessage.from_name}}:</text>
							<image style="height: 50rpx;width: 50rpx;"
							:src="`https://restapi.amap.com/v3/staticmap?markers=-1,https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png,0:${JSON.parse(replyMessage.data).longitude},${JSON.parse(replyMessage.data).latitude}&key=${mapKey}`" mode="widthFix"></image>
						</view>
					</view>
					
					<!-- 语音 -->
					<view v-if="replyMessage.type === 'audio'">
						<view class="flex align-center p-1">
							<text class="text-muted font-sm mr-2">{{replyMessage.from_name}}:</text>
							<image
								src="../../static/audio/yyl.png"
								mode="widthFix" style="height: 40rpx;width: 40rpx;"></image>
							<text class="ml-1 font-sm">{{JSON.parse(replyMessage.options).time}}{{'"'}}</text>
						</view>
					</view>
					
					<!-- 名片 -->
					<view v-if="replyMessage.type === 'card'">
						<view class="flex align-center p-1">
							<text class="text-muted font-sm mr-2">{{replyMessage.from_name}}:</text>
							<image src="../../static/tabbar/my.png" style="height: 25rpx;width: 25rpx;"></image>
							<text class="font-sm text-muted mr-1">{{ replyMessage.data }}</text>
							<my-avatar size="50" :src="JSON.parse(replyMessage.options).avatar"></my-avatar>
						</view>
					</view>
					
				</view>
				
				
				<view v-if="replyMessage.message_id && replyMessage.isremove === 1" class="p-1">
					<text class="font-sm text-muted">引用内容已撤回</text>
				</view>
			</view>
		</view>
		
		<!-- 发送状态 -->
		<!-- <view v-if="item.send_status && item.send_status !== 'success'" class="flex align-center justify-end px-4">
			<text class="font-sm" :class="item.send_status === 'fail' ? 'text-danger' : 'text-muted'">{{ item.send_status === 'fail' ? '发送失败' : '发送中...' }}</text>
		</view> -->
        <view v-if="item.send_status === 'fail'" class="flex align-center justify-end px-4">
			<text class="font-sm text-danger">发送失败</text>
		</view>
		<!-- 占位 -->
		<view class="mb-2"></view>
	</view>
</template>

<script>
	import MyAvatar from '@/components/my-ui/my-avatar.vue';
	import MyImage from '@/components/my-ui/my-image.vue';
	import $T from '@/common/lib/time.js';
   import $C from '@/common/lib/config.js';
	import { mapState, mapActions } from 'vuex';
	import DB from '@/common/lib/sqLite.js';
	import { getUserInfo } from '@/api/user.js';
	// #ifdef APP-PLUS-NVUE
	const animation = weex.requireModule('animation');
	// #endif
	const TUICallKit = uni.requireNativePlugin('TencentCloud-TUICallKit');
	export default {
		components: {
			MyAvatar,
			MyImage
		},
		data() {
			return {
				innerAudioContext: null,
				isLongPress: false,
				isLongPress2: false,
				isLongPress3: false,
				isAudioPlay: false,
				replyMessage: {},
				timer: null,
            mapKey: $C.mapKey,
				isExpired: true, // 是否超过两分钟
				poster: {
					width: 100,
					height: 100
				},
				poster2: {
					width: 100,
					height: 100
				},
				html:"",
				noReplyText: ""
			}
		},
		props: {
			item: {
				type: Object,
				default: {}
			},
			index: {
				type: Number,
				default: -1
			},
			chatId: {
				type: Number,
				default: -1
			},
			chatType: {
				chatType: String,
				default: ''
			},
			avatarList: {
				type: Array,
				default: () => []
			},
			shownickname: {
				type: Boolean,
				default: false
			},
		},
		computed: {
			...mapState('audio', ['sum']), //数组写法
			...mapState({
				user: state => state.user.user,
			}),
			recallText() {
				let text = ''
				if (this.item.chat_type === 'user') {
					text = this.isSelf ? "你撤回了一条消息": '对方撤回了一条消息'
				} else {
					text = this.isSelf ? "你撤回了一条消息" : `${this.item.from_name}撤回了一条消息`
				}
				return text
			},
			// 发送者是否是本人
			isSelf() {
				const id = this.user.id ? this.user.id : 0;
				return this.item.from_id === id;
			},
			//是否需要气泡箭头样式
			hasLabelClass() {
				return this.item.type === 'text' || this.item.type == 'audio' || this.item.type === 'reply' || this.item.type == 'notice' || this.item.type === 'callVoice' || this.item.type === 'callVideo';
			},
			replyClass() {
				let c = this.isSelf ? 'justify-end' : '';
				return c
			},
			replyStyle() {
				let c = this.isSelf ? 'margin-right: 100rpx' : 'margin-left: 100rpx';
				return c
			},
			//气泡的样式
			labelClass() {
				//本人
				const labelRight = this.hasLabelClass ? 'bg-chat-item mr-3' : 'mr-3'
				//好友
				const labelLeft = this.hasLabelClass ? 'bg-white ml-3' : 'ml-3'
				return this.isSelf ? labelRight : labelLeft
			},
			nicknameClass() {
				let c = this.isSelf ? 'justify-end' : '';
				return c + ' ' + this.labelClass;
			},
			//气泡宽度
			labelStyle() {
				if (this.item.type === 'audio') {
					const time = this.item.options.time || 0
					// 最大500,最小150
					let width = time / (60 / 500)
					width = width < 150 ? 150 : width
					return `width:${width}rpx`
				}
			},
			//视频封面图标位置
			posterStyle() {
				const left = this.poster.width / 2 - uni.upx2px(80) / 2
				const top = this.poster.height / 2 - uni.upx2px(80) / 2
				return `left:${left};top:${top}`
			},
			posterStyle2() {
				const left = this.poster2.width / 2 - uni.upx2px(20) / 2
				const top = this.poster2.height / 2 - uni.upx2px(20) / 2
				return `left:${left};top:${top}`
			},
			// 头像列表
			avatar() {
				const current = this.avatarList.find( v => v.user_id === this.item.from_id) || {}
				return current.avatar || this.item.from_avatar
			},
			// 昵称
			nickname() {
				const current = this.avatarList.find( v => v.user_id === this.item.from_id) || {}
				return current.nickname || this.item.from_name
			}
		},
		mounted() {
			if (this.item.type === 'audio') {
				this.audioOn(this.onPlayAudio)
			}
			if (this.item.type === 'reply') {
				this.replyMessage = JSON.parse(this.item.options)
				if (!this.replyMessage.message_id){
					this.noReplyText = "引用内容不存在"
				}
			}
			uni.$on('deleteOrRemove', this.deleteOrRemove)
			
			// 处理链接
			const str = this.item.data;
			const regex = /(https?:\/\/[^\s，]+)/g
			if ((this.item.type === 'text' || this.item.type === 'reply' || this.item.type === 'notice') && regex.test(str)) {
				// 使用正则表达式匹配 URL，并用 <a> 标签进行替换
				const result = str.replace(regex, '<a href="$1" style="text-underline: none;">$1</a>');
				this.html = result
			} else {
				this.html = ""
			}
			
			// console.log(this.item)
		},
		beforeDestroy() {
			if (this.item.type === 'audio') {
				this.audioOff(this.onPlayAudio)
			}
			// 销毁音频
			if (this.innerAudioContext) {
				this.innerAudioContext.destroy();
				this.innerAudioContext = null;
			}
			uni.$off('deleteOrRemove', this.deleteOrRemove)
			clearInterval(this.timer)
		},
		watch: {
			// 监听是否撤回消息
			// #ifdef APP-PLUS-NVUE
			'item.isremove': {
				handler(newval, oldval) {
					if (this.item.type === 'text' && this.isSelf && newval) {
						this.isExpired = $T.isTimestampExpired(this.item?.create_time)
						if (!this.isExpired) { // 没有超过两分钟
							this.listenTime()
						}
					}
					// console.log(newval);
					if (newval) {
						this.$nextTick(() => {
							animation.transition(
								this.$refs.isRemove, {
									styles: {
										opacity: 1
									},
									duration: 500, //ms
									timingFunction: 'ease'
								},
								function() {
									// console.log('动画执行结束');
								}
							);
						});
					}
				}
			}
			// #endif
		},
		methods: {
			...mapActions('audio', ['audioOn', 'audioEmit', 'audioOff']),
			// 每30秒中检查一下撤回的消息是否超过2分钟
			listenTime() {
				this.timer = setInterval(() => {
					this.isExpired = $T.isTimestampExpired(this.item?.create_time)
					if (this.isExpired) {
						clearInterval(this.timer)
					}
				}, 1000 * 30)
			},
			linktap(e) {
				console.log(e)
			},
			onLong(e) {
				this.isLongPress = true
				let x = 0;
				let y = 0;
				// #ifdef APP-PLUS-NVUE
				if (Array.isArray(e.changedTouches) && e.changedTouches.length > 0) {
					x = e.changedTouches[0].screenX;
					y = e.changedTouches[0].screenY;
				}
				// #endif
				// #ifdef MP
				x = e.detail.x;
				y = e.detail.y;
				// #endif
				if (!this.isLongPress2 && !this.isLongPress3) {
					this.$emit('long', {
						x,
						y,
						index: this.index
					});
				}
			},
			onLongReply(e) {
				// #ifdef APP-PLUS-NVUE
				e.stopPropagation();
				// #endif
				this.isLongPress3 = true
			},
			touchendReply(){
				//延时执行为了防止 click() 还未判断 islongPress 的值就被置为 fasle
				setTimeout(() => {
					this.isLongPress3 = false
				},300)
			},
			onLongFriend(e) {
				// #ifdef APP-PLUS-NVUE
				e.stopPropagation();
				// #endif
				this.isLongPress2 = true
				this.$emit('selectUserEvent',[{name: this.item.from_name, id: this.item.from_id}], true)
			},
			touchendFriend(){
				//延时执行为了防止 click() 还未判断 islongPress 的值就被置为 fasle
				setTimeout(() => {
					this.isLongPress2 = false
				},300)
			},
			touchend(){
				//延时执行为了防止 click() 还未判断 islongPress 的值就被置为 fasle
				setTimeout(() => {
					this.isLongPress = false
				},300)
			},
			openUser() {
				if (this.isLongPress2) return
				uni.navigateTo({
					url: `/pages/mail/user-base/user-base?user_id=${this.item.from_id}&chat_id=${this.chatId}&chat_type=${this.chatType}`
				});
			},
			// 打开名片
			openUserBase() {
				if (this.isLongPress) return
				uni.navigateTo({
					url: '/pages/mail/user-base/user-base?user_id=' + JSON.parse(this.item.options).id
				});
			},
			clickPage() {
				// #ifdef APP-PLUS-NVUE
				this.$emit('clickPage')
				// #endif
			},
			// 重新编辑
			redit() {
				this.$emit('redit', this.item.data)
			},
			//预览图片
			preview(url) {
				if (this.isLongPress) return
				this.$emit('preview', url)
			},
			// 监听播放音频全局事件
			onPlayAudio(index) {
				if (this.innerAudioContext) {
					if (this.index !== index) {
						this.innerAudioContext.pause();
					}
				}
			},
			//播放音频
			async playAudio(e) {
				// #ifdef APP-PLUS-NVUE
				e.stopPropagation();
				// #endif
				if (this.isLongPress) return
				this.audioEmit(this.index)
				if (!this.innerAudioContext) {
					this.innerAudioContext = uni.createInnerAudioContext()
					this.innerAudioContext.src = this.item.data
					this.innerAudioContext.play()
					// 监听播放
					this.innerAudioContext.onPlay(() => {
						this.isAudioPlay = true;
					});
					// 监听暂停
					this.innerAudioContext.onPause(() => {
						this.isAudioPlay = false;
					});
					// 监听停止
					this.innerAudioContext.onStop(() => {
						this.isAudioPlay = false;
					});
					// 监听错误
					this.innerAudioContext.onError(() => {
						this.isAudioPlay = false;
					});
				} else {
					this.innerAudioContext.stop()
					this.innerAudioContext.play()
				}
				// 把状态变为已读
				this.item.isread = 1
				try {
					const table = `chat_${this.user.id}_${this.item.chat_type}_${this.chatId}`;
					const sql = `UPDATE ${table} SET isread = 1 WHERE message_id = '${this.item.message_id}';`
					// 修改当前表数据
					await DB.executeSql(sql)
				} catch(e){
					//TODO handle the exception
					console.log(e)
				}
			},
			//播放视频
			playVideo(e) {
				// #ifdef APP-PLUS-NVUE
				e.stopPropagation();
				// #endif
				if (this.isLongPress) return
				uni.navigateTo({
					url: '/pages/chat/video/video?url=' + encodeURIComponent(this.item.data)
				})
			},
			//加载封面
			loadPoster({ width,height }) {
				// console.log(width, height)
				this.poster.height = height
				this.poster.width = width
			},
			loadPoster2({ width,height }) {
				// console.log(width, height)
				this.poster2.height = height
				this.poster2.width = width
			},
			//打开地图
			openLocation(item){
				if (this.isLongPress) return
				uni.openLocation({
					latitude: JSON.parse(item.data).latitude,
					longitude: JSON.parse(item.data).longitude,
					name: JSON.parse(item.data).name,
					success: function() {
						// console.log('success');
					}
				});
			},
			// 获取回复的消息
			async getMessage(message_id, current_id) {
				try{
					const table = `chat_${this.user.id}_${this.item.chat_type}_${this.chatId}`;
					const sql = `SELECT * FROM ${table} WHERE message_id = '${message_id}'`
					const data = await DB.selectSql(sql);
					if (data.length) {
						this.replyMessage = data[0] || {}
						const options = JSON.stringify(data[0] || {})
						const updateSql = `UPDATE ${table} SET options = '${options}' WHERE message_id = '${current_id}';`
						// 修改当前表数据
						await DB.executeSql(updateSql)
					} else { //查不到一般是被删除了
						this.replyMessage = {}
						const options = JSON.stringify({})
						const updateSql = `UPDATE ${table} SET options = '${options}' WHERE message_id = '${current_id}';`
						// 修改当前表数据
						await DB.executeSql(updateSql)
					}
					if (!this.replyMessage.message_id){
						this.noReplyText = "引用内容不存在"
					}
				}catch(e){
					//TODO handle the exception
					console.log(e)
				}
			},
			deleteOrRemove(message_id) { // 当前撤回这条消息的message_id
				if (this.item.type === 'reply') {
					// 当前这条消息的message_id
					const current_id = this.item.message_id
					const _message_id = JSON.parse(this.item.options).message_id
					if (message_id === _message_id) {
						this.getMessage(message_id, current_id)
					}
					
				}
			},
			scrollToElement() {
				if (this.isLongPress3) return
				const message_id = JSON.parse(this.item.options).message_id
				this.$emit('scrollToElement', message_id)
			},
			handleCall(type) {
				// console.log(this.isSelf, this.item)
				if (this.isLongPress) return 
				const num = type === 'voice' ? 1 : 2; 
				if (this.isSelf) {
					getUserInfo(this.item.to_id).then(res => {
						if(res) {
							const username = res.username
							const options = {
							  userID: username,
							  callMediaType: num, // 语音通话(callMediaType = 1)、视频通话(callMediaType = 2)
							};
							TUICallKit.call(options, (res) => {
								uni.$emit('trtc', { id: this.item.to_id, name: this.item.to_name, avatar: this.item.to_avatar, chat_type: this.item.chat_type, callType: type === 'voice' ? 'callVoice' : 'callVideo' })
								if (res.code !== 0) {
									uni.showToast({
									    icon:'none',
									    title:'腾讯IM呼叫失败' + res.msg
									})
								}
							});
						}
					})
				} else {
					getUserInfo(this.item.from_id).then(res => {
						if(res) {
							const username = res.username
							const options = {
							  userID: username,
							  callMediaType: num, // 语音通话(callMediaType = 1)、视频通话(callMediaType = 2)
							};
							TUICallKit.call(options, (res) => {
								uni.$emit('trtc', { id: this.item.from_id, name: this.item.from_name, avatar: this.item.from_avatar, chat_type: this.item.chat_type, callType: type === 'voice' ? 'callVoice' : 'callVideo' })
								if (res.code !== 0) {
									uni.showToast({
									    icon:'none',
									    title:'腾讯IM呼叫失败' + res.msg
									})
								}
							});
						}
					})
				}
			}
		}
	};
</script>

<style scoped>
	.chat-left-icon {
		left: 100rpx;
	}

	.chat-right-icon {
		right: 100rpx;
	}

	.chat-animate {
		/* #ifdef APP-PLUS-NVUE */
		opacity: 0;
		/* #endif */
	}
</style>