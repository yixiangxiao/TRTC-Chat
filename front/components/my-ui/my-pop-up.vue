<template>
	<!-- 弹出层 -->
	<div style="z-index: 9999;overflow: hidden;" v-if="status">
		<!-- 蒙版 -->
		<div v-if="mask" @click="hide" class="position-fixed left-0 right-0 top-0 bottom-0" :style="getMaskColor">
		</div>
		<!-- 弹出框内容 -->
		<div ref="mypopup" class="position-fixed" :style="getBodyStyle" :class="getBodyClass" @click="$emit('click')">
			<slot></slot>
		</div>
	</div>
</template>

<script>
	// #ifdef APP-PLUS-NVUE
	const animation = weex.requireModule('animation');
	// #endif

	export default {
		data() {
			return {
				status: false,
				x: -1,
				y: -1,
				res: {}
			};
		},
		props: {
			//蒙版颜色
			maskColor: {
				type: Boolean,
				default: false
			},
			//是否需要蒙版
			mask: {
				type: Boolean,
				default: true
			},
			//是否处于底部
			fixBottom: {
				type: Boolean,
				default: false
			},
			//弹出层内容高度
			bodyHeight: {
				type: Number,
				default: 0
			},
			//弹出层内容宽度
			bodyWidth: {
				type: Number,
				default: 0
			},
			//背景颜色
			bodyBgColor: {
				type: String,
				default: 'bg-white'
			},
			tabbarHeight: {
				type: Number,
				default: 0
			},
			//动画原点
			transformOrigin:{
				type: String,
				default:'left top'
			},
			//是否需要动画
			isNeedAnimate: {
				type: Boolean,
				default: true
			},
			//是否需要居中
			isCenter:{
				type: Boolean,
				default: false
			}
		},
		mounted() {
			const res = uni.getSystemInfoSync();
			this.res = res
		},
		computed: {
			getMaskColor() {
				let color = this.maskColor ? 0.5 : 0;
				return `background-color: rgba(0,0,0,${color})`;
			},
			getBodyClass() {
				let animate = this.isNeedAnimate ? 'my-animation' : ''
				if(this.isCenter) {
					return 'left-0 right-0 bottom-0 top-0 flex align-center justify-center'
				}
				let fixBottom = this.fixBottom ? 'left-0 right-0 bottom-0' : 'rounded border';
				return `${this.bodyBgColor} ${fixBottom} ${animate}`;
			},
			getBodyStyle() {
				let left = this.x > -1 ? `left:${this.x}px;` : '';
				let top = this.y > -1 ? `top:${this.y}px;` : '';
				return `${left}${top}`;
			},
			maxX() {
				return this.res.windowWidth - uni.upx2px(this.bodyWidth);
			},
			maxY() {
				return this.res.windowHeight - uni.upx2px(this.bodyHeight) - this.tabbarHeight
			}
		},
		methods: {
			show(x = -1, y = -1) {
				this.status = true;
				this.$nextTick(() => {
					this.x = x > this.maxX ? this.maxX : x;
					this.y = y > this.maxY ? this.maxY : y;
					if (this.isNeedAnimate) {
						this.animationShow()
					}
				})
			},
			hide() {
				if (this.isNeedAnimate) {
					this.animationHide()
				} else {
					this.status = false;
				}
				
			},
			//需要动画
			animationShow() {
				// #ifdef APP-PLUS-NVUE
				animation.transition(
					this.$refs.mypopup, {
						styles: {
							transform: 'scale(1,1)',
							transformOrigin: this.transformOrigin,
							opacity: 1
						},
						duration: 500, //ms
						timingFunction: 'ease',
						needLayout: false,
						delay: 0 //ms
					},
					function() {
						// console.log('动画执行成功')
					}
				);
				// #endif
			},
			animationHide() {
				// #ifdef APP-PLUS-NVUE
				animation.transition(
					this.$refs.mypopup, {
						styles: {
							transform: 'scale(0,0)',
							transformOrigin: this.transformOrigin,
							opacity: 0
						},
						duration: 500, //ms
						timingFunction: 'ease',
						needLayout: false,
						delay: 0 //ms
					},
					() => {
						this.status = false;
						// console.log('动画执行成功')
					}
				);
				// #endif
			}
		}
	};
</script>

<style scoped>
	.my-animation {
		/* #ifdef APP-PLUS-NVUE */
		transform: scale(0, 0);
		opacity: 0;
		/* #endif */
	}
</style>