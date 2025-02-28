<template>
	<image :class="type" :src="src ? src : '/static/images/userpic.png'" mode="aspectFill" :style="getStyle" @click="clickEvent" />
</template>

<script>
export default {
	data() {
		return {};
	},
	props: {
		size: {
			type: [String, Number],
			default: 95
		},
		src: {
			type: String,
			default: ''
		},
		type: {
			type: String,
			default: 'rounded'
		},
		clickType: {
			type: String,
			default: 'none'
		},
		needStopPropagation: {
			type: Boolean,
			default: true
		}
	},
	computed: {
		getStyle() {
			return `height:${this.size}rpx;width:${this.size}rpx`;
		}
	},
	methods: {
		clickEvent(e){
			switch (this.clickType){
				case 'none':
				if (this.needStopPropagation) {
					// #ifdef APP-PLUS-NVUE
					e.stopPropagation();
					// #endif
				}
				this.$emit('click', e)
					break;
				case 'navigate':
				uni.navigateTo({
					url:'/pages/mail/user-base/user-base'
				})
				    break;
			}
		}
	}
};
</script>

<style></style>
