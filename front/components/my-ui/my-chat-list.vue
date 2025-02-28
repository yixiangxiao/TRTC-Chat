<template>
	<view :class="item.istop ? 'bg-light' : 'bg-white'" class="flex align-stretch" hover-class="bg-hover-light" @touchend="touchend" @click="onClick" @longpress="onLong">
		<view class="flex align-center justify-center position-relative ml-2 mt-1" style="width: 145rpx;height: 135rpx;">
			<my-avatar @click="onClick" :size="110" :src="item.avatar"></my-avatar>
			<my-badge v-if="item.noreadnum > 0 && !item.nowarn" badgeClass="position-absolute" badgeStyle="right: 0rpx;top: 0rpx;" :num="item.noreadnum"></my-badge>
			<!-- 消息免打扰 -->
			<view v-if="item.noreadnum > 0 && item.nowarn" class="position-absolute bg-danger rounded-circle" style="right: 5rpx;top: 5rpx;height: 20rpx;width: 20rpx;">	</view>
		</view>
		<view class="flex flex-column border-bottom flex-1 py-3 pr-3 pl-2 border-light-secondary">
			<view class="flex align-center justify-between mb-1">
				<text class="font-md">{{ item.name }}</text>
				<!-- <text class="font-sm text-light-muted">{{ item.update_time | formatTime  }}</text> -->
				<text class="font-sm text-light-muted">{{ formatTime  }}</text>
			</view>
			<view class="flex justify-between">
				<!-- @提示 -->
			   <view class="flex flex-start">
			   	<text v-if="item.need_notice" class="font text-ellipsis text-danger mr-1">[有人@我]</text>
			   	<text class="font text-ellipsis text-light-muted" :style="item.need_notice ? 'width: 350rpx;' : 'width: 450rpx;'">{{item.data}}</text>
			   </view>
			   <!-- 消息免打扰图标 -->
			   <text v-if="item.nowarn" class="font-md text-light-muted iconfont">&#xe78e;</text>
			</view>
		</view>
	</view>
</template>

<script>
import MyAvatar from '@/components/my-ui/my-avatar.vue';
import MyBadge from '@/components/my-ui/my-badge.vue';
// import mixin from '@/common/mixin/base.js';
import { mapState } from 'vuex';
import { _getTimeStringAutoShort2 } from '@/common/lib/wechat-time.js'
export default {
	components: { MyAvatar, MyBadge },
	// mixins: [mixin],
	data() {
		return {
			isLongPress: false,
			timer: null,
			formatTime: null
		};
	},
	props: {
		item: Object,
		index: Number
	},
	
	computed:{
		...mapState({
			chat:state=>state.user.chat
		})
	},
	beforeDestroy() {
		clearInterval(this.timer)
	},
	watch: {
		'item.update_time': {
			immediate: true,
			handler(value){
				clearInterval(this.timer)
				this.formatTime = this.item?.update_time ? _getTimeStringAutoShort2(this.item?.update_time) : null
				if (this.formatTime === "刚刚") {
					this.listenTime()
				}
			}
		},
	},
	methods: {
		// 每30秒中检查一下格式化时间是否为刚刚
		listenTime() {
			this.timer = setInterval(() => {
				this.formatTime = this.item?.update_time ? _getTimeStringAutoShort2(this.item?.update_time) : null
				if (this.formatTime !== "刚刚") {
					clearInterval(this.timer)
				}
			}, 1000 * 30)
		},
		onClick() {
			if (this.isLongPress) return
			uni.navigateTo({
				url: `/pages/chat/chat?params=${encodeURIComponent(JSON.stringify({
					id: this.item.id,
					name: this.item.name,
					avatar: this.item.avatar,
					chat_type: this.item.chat_type
				}))}`
			})
		},
		touchend(){
			//延时执行为了防止 click() 还未判断 islongPress 的值就被置为 fasle
			setTimeout(() => {
				this.isLongPress = false
			},300)
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
			this.$emit('long', { x, y, index: this.index });
		}
	}
};
</script>

<style></style>
