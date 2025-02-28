<template>
	<image :src="src" mode="aspectFill" lazy-load :style="imageStyle" :class="imageCalss" @load="loadImage"
		@click="handleClick" class="bg-hover-light" @error="onError"></image>
</template>

<script>
	export default {
		data() {
			return {
				w: 100,
				h: 100
			}
		},
		props: {
			src: {
				type: String,
				default: ''
			},
			imageCalss: {
				type: String,
				default: ''
			},
			maxH: {
				type: Number,
				default: 350
			},
			maxW: {
				type: Number,
				default: 500
			},
			stopPropagation:{
				type: Boolean,
				default: false
			}
		},
		computed: {
			//图片宽高
			imageStyle() {
				const height = this.h
				const width = this.w
				return `height:${height}px;width:${width}px`
			}
		},
		methods: {
			//加载图片
			loadImage(res) {
				// w/h = maxW / maxH
				// maxH = maxW * (h/w)
				// console.log(res,'11')
				const w = res.detail.width
				const h = res.detail.height
				//最大宽度
				const maxW = uni.upx2px(this.maxW)
				//最大高度
				const maxH = uni.upx2px(this.maxH)
				if (h <= maxH) { //如果当前高度小于最大高度

					this.w = w <= maxW ? w : maxW //如果当前宽度小于最大宽度用原来的宽度 否则用最大宽度
					this.h = h //用原来的高度
					this.$emit('load',{width:this.w,height:this.h})
					return
				}

				this.h = maxH //如果当前高度大于最大高度 用最大高度
				const w2 = maxH * (w / h)
				this.w = w2 <= maxW ? w2 : maxW //如果计算后宽度小于等于最大宽度就用计算后宽度，否则用最大宽度
				// console.log(this.w,this.h)
				this.$emit('load',{width:this.w,height:this.h})
			},
			onError(e) {
				console.log('error', e)
			},
			handleClick(e){
				// #ifdef APP-PLUS-NVUE
				if(this.stopPropagation){
					e.stopPropagation();
				}
				// #endif
				this.$emit('click')
			}
		}
		
	}
</script>

<style>
</style>