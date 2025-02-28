<template>
	<view class="flex justify-center align-center" hover-class="bg-hover-light" style="height: 90rpx;width: 90rpx;" @click="$emit('click')">
		<slot>
			<text class="iconfont font-md">{{ icon }}</text>
		</slot>
	</view>
</template>

<script>
export default {
	props: {
		icon: {
			type: String,
			default: ''
		}
	}
};
</script>

<style></style>
