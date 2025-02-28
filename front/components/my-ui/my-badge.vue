<template>
	<text class=" my-badge bg-danger text-white rounded-circle font-sm" :class="badgeClass" :style="badgeStyle">{{ num }}</text>
</template>

<script>
export default {
	data() {
		return {};
	},
	props: {
		badgeClass: {
			type: String,
			default: ''
		},
		badgeStyle: {
			type: String,
			default: ''
		},
		num: {
			type: Number,
			default: 0
		}
	},
	methods: {}
};
</script>

<style scoped>
.my-badge {
	padding-left: 14rpx;
	padding-right: 14rpx;
	padding-top: 6rpx;
	padding-bottom: 6rpx;
}
</style>
