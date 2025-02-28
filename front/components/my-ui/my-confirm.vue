<template>
	<my-pop-up ref="confirm" maskColor isCenter transform-origin="center center">
		<view class="bg-white rounded flex flex-column" style="width: 600rpx">
			<!-- 头部 -->
			<view class="p-4 flex flex-column">
				<text class="font-md font-weight-bold mb-3">{{title}}</text>
				<slot></slot>
			</view>
			<!-- 底部 -->
			<view class="border-top flex align-stretch" style="height: 100rpx;">
				<view class="flex-1 border-right flex align-center justify-center" @click="cancel">
					<text class="font-md text-muted">取消</text>
				</view>
				<view class="flex-1  flex align-center justify-center" @click="confirm">
					<text class="font-md main-text-color">确定</text>
				</view>
			</view>
		</view>
	</my-pop-up>
</template>

<script>
	import MyPopUp from '@/components/my-ui/my-pop-up.vue';
	export default {
		components: {
			MyPopUp
		},
		data() {
			return {
				callback: false
			}
		},
		props: {
			title: {
				type: String,
				default: ''
			}
		},
		methods: {
			//显示
			show(callback = false) {
				this.callback = callback
				this.$refs.confirm.show()
			},
			//取消
			cancel() {
				this.$refs.confirm.hide()
			},
			//确定
			confirm(){
				if(typeof this.callback === 'function') {
					this.callback(this.cancel)
				}
			}
		}
	}
</script>

<style>
</style>