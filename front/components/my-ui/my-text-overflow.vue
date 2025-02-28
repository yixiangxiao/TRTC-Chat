<template>
		<view class="mt-1 position-relative">
			<text @click="clickEvent" class="font text-dark" :ref="id" style="text-overflow: ellipsis;overflow: hidden;lines: 4;">
				{{content}}
			</text>
			<text v-if="!allHeight" class="font text-dark position-absolute" :ref="id2" :style="'width:' +  width + 'px'" style="right: -100000rpx;bottom: 0;">
				{{content}}
			</text>
			
			<!-- 删除评论时使用 -->
			<text v-if="deletetd" class="font text-dark position-absolute" :ref="id2" :style="'width:' +  width + 'px'" style="right: -100000rpx;bottom: 0;">
				{{content}}
			</text>
			
			<view class="flex justify-end">
				<text @click="toMomentDetail" v-if="show" class="text-hover-primary font mt-1">详情</text>
			</view>
		</view>
</template>

<script>
	//方案一 一开始加载完所有文本 获取真实高度，获取完成后再给css样式截断，然后再获取截断后的高度，如果两者不一致则显示详情(这种方案页面会闪烁)
	//方案二 加载两个 一个加载完所有文本(需要藏起来或者挤到屏幕外面) 获取真实高度，一个加载截断的文本 再比较高度
	import $U from "@/common/lib/util.js"
	// #ifdef APP-NVUE
	const dom = uni.requireNativePlugin('dom')
	// #endif
	export default {
		props: {
			content: {
				type: [String],
				default: ''
			}
		},
		data() {
			return {
				id: $U.guid(),
				id2: $U.guid(),
				height:0,
				allHeight: 0,
				width: 0,
				deletetd: false
			}
		},
		watch: {
			height(val) {
				if (val) {
					this.getHeight2()
				}
			},
			// 删除评论时会触发 如果长的评论显示了详情 删除了之后 对应短的会残留
			content(content) {
				this.getHeight()
				this.deletetd = true
			},
			deletetd() {
				this.getHeight2(true)
			}
			// 结束
		},
		computed:{
			show() {
				if (this.height !== this.allHeight) {
					return true
				} else {
					return false
				}
			}
		},
		mounted() {
			this.getHeight()
		},
		methods: {
			clickEvent(e) {
				// #ifdef APP-PLUS-NVUE
				e.stopPropagation();
				// #endif
				this.$emit('click', e)
			},
			getHeight() {
				// #ifdef APP-NVUE
				const ref = this.$refs[this.id]
				this.$nextTick(() => {
					setTimeout(() => {
						dom.getComponentRect(ref, (res) => {
							if (res.size && res.size.height) {
								this.height = res.size.height
								this.width = res.size.width
							}
						})
					}, 100)
				})
				// #endif
			},
			getHeight2(deleted) {
				// #ifdef APP-NVUE
				const ref = this.$refs[this.id2]
				this.$nextTick(() => {
					setTimeout(() => {
						dom.getComponentRect(ref, (res) => {
							if (res.size && res.size.height) {
								this.allHeight = res.size.height
								if (deleted) this.deletetd = false
							}
						})
					}, 100)
				})
				// #endif
			},
			toMomentDetail(e) {
				// #ifdef APP-PLUS-NVUE
				e.stopPropagation();
				// #endif
				uni.navigateTo({
					url:'/pages/find/moment-detail/moment-detail?content=' + JSON.stringify(encodeURIComponent(this.content))
				})
			},
		},
	}
</script>

<style>
</style>