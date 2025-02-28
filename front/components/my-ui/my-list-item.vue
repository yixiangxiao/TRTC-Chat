<template>
	<view class="bg-white flex align-stretch" hover-class="bg-light" @click="clickEvent">
		<view class="flex align-center justify-between py-2 pl-3" v-if="isShowIcon">
			<slot name="icon"></slot>
			<image v-if="imgUrl" :src="imgUrl" mode="aspectFill" :style="getImageStyle"></image>
		</view>
		<view class="flex-1 flex align-center justify-between pr-2 py-3 pl-3" :class="borderBottom ? 'border-bottom': ''">
			<slot>
				<text class="font-md text-dark">{{ title }}</text>
			</slot>
			<view class="flex align-center" v-if="isShowRight">
				<slot name="right"></slot>
				<!-- 右箭头 -->
				<text v-if="isShowRightIcon" class="iconfont font-md text-light-muted">&#xe60c;</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	props: {
		//是否显示下边线
		borderBottom:{
			type: Boolean,
			default: true
		},
		imgUrl: {
			type: String,
			default: ''
		},
		title: {
			type: String,
			default: ''
		},
		//是否显示右边
		isShowRight: {
			type: Boolean,
			default: false
		},
		imageSize:{
			type: Number,
			default: 75
		},
		//是否显示图标
		isShowIcon:{
			type: Boolean,
			default: true
		},
		//是否显示右箭头
		isShowRightIcon:{
			type: Boolean,
			default: true
		},
		isNeedStopPropagation: {
			type: Boolean,
			default: false
		}
	},
	computed:{
		getImageStyle(){
			return `width: ${this.imageSize}rpx;height: ${this.imageSize}rpx;`
		}
	},
	methods: {
		clickEvent(e) {
			if (this.isNeedStopPropagation) {
				// #ifdef APP-PLUS-NVUE
				e.stopPropagation();
				// #endif
			}
			this.$emit('click')
		}
	}
};
</script>

<style></style>
