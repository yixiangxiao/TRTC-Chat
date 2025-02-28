
<template>
		<view class="mb-1 mt-2 position-relative">
			<text selectable class="font-md text-dark" :ref="id" :style="textStyle">
				{{content}}
			</text>
			<text v-if="!allHeight" class="font-md text-dark position-absolute" :ref="id2" style="top: 100000rpx; right: 0;" :style="'width:' +  width + 'px'">{{content}}</text>
			<text @click="toggle" v-if="show" class="text-hover-primary font mt-1">{{tip}}</text>
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
			},
		},
		data() {
			return {
				id: $U.guid(),
				id2: $U.guid(),
				width: 0,
				height:0,
				allHeight: 0,
				tip: "展开",
				isOpen: false,
				textStyle: "text-overflow: ellipsis;overflow: hidden;lines: 4;"
			}
		},
		watch: {
			height(val) {
				if (val) {
					this.getHeight2()
				}
			},
		},
		computed:{
			show() {
				if (this.height && this.allHeight && (this.height !== this.allHeight)) {
					return true
				} else {
					return false
				}
			},
		},
		mounted() {
			this.getHeight()
		},
		methods: {
			getHeight(height) {
				// #ifdef APP-NVUE
				const ref = this.$refs[this.id]
				this.$nextTick(() => {
					setTimeout(() => {
						dom.getComponentRect(ref, (res) => {
							this.height = res.size.height
							this.width = res.size.width
						})
					}, 100)
				})
				// #endif
			},
			getHeight2() {
				// #ifdef APP-NVUE
				const ref = this.$refs[this.id2]
				this.$nextTick(() => {
					setTimeout(() => {
						dom.getComponentRect(ref, (res) => {
							this.allHeight = res.size.height
						})
					}, 100)
				})
				// #endif
			},
			toggle() {
				this.isOpen = !this.isOpen
				if (!this.isOpen) {
					this.tip = "展开"
					this.textStyle = "text-overflow: ellipsis;overflow: hidden;lines: 4;"
				} else {
					this.tip = "收起"
					this.textStyle = ""
				}
			}
		},
	}
</script>

<style>
</style>

<!-- <template>
		<view class="mb-1 mt-2">
			<text selectable class="font-md text-dark" :ref="id" :style="textStyle">
				{{content}}
			</text>
			<text @click="toggle" v-if="show" class="text-hover-primary font mt-1">{{tip}}</text>
			</view>
		</view>
</template>

<script>
	//方案一 一开始加载完所有文本 获取真实高度，获取完成后再给css样式截断，然后再获取截断后的高度，如果两者不一致则显示详情(这种方案页面会闪烁)
	//方案二 加载两个 一个加载完所有文本(需要藏起来或者挤到屏幕外面) 获取真实高度，一个加载截断的文本 再比较高度 绝对定位后不会换行
	import $U from "@/common/lib/util.js"
	// #ifdef APP-NVUE
	const dom = uni.requireNativePlugin('dom')
	// #endif
	export default {
		props: {
			content: {
				type: [String],
				default: ''
			},
		},
		data() {
			return {
				id: $U.guid(),
				height:0,
				allHeight: 0,
				tip: "展开",
				isOpen: false,
				textStyle: ""
			}
		},
		watch: {
			allHeight(val) {
				if(val) {
					this.textStyle = "text-overflow: ellipsis;overflow: hidden;lines: 4;"
					this.getHeight('height')
				}
			}
		},
		computed:{
			show() {
				if (this.height !== this.allHeight) {
					return true
				} else {
					return false
				}
			},
		},
		mounted() {
			this.getHeight('allHeight')
		},
		methods: {
			getHeight(height) {
				// #ifdef APP-NVUE
				const ref = this.$refs[this.id]
				this.$nextTick(() => {
					setTimeout(() => {
						dom.getComponentRect(ref, (res) => {
							this[height] = res.size.height
							this.width = res.size.width
						})
					}, 100)
				})
				// #endif
			},
			toggle() {
				this.isOpen = !this.isOpen
				if (!this.isOpen) {
					this.tip = "展开"
					this.textStyle = "text-overflow: ellipsis;overflow: hidden;lines: 4;"
				} else {
					this.tip = "收起"
					this.textStyle = ""
				}
			}
		},
	}
</script>

<style>
</style> -->