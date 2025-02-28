<template>
	<view class="flex flex-wrap">
		<view  v-for="(item, index) in imageList" :key="index" class="flex align-center justify-center pt-2 position-relative" style="width: 230rpx;">
			<image @click="preview(item)" class="bg-light rounded"
			style="width: 220rpx;height: 220rpx;" 
			mode="widthFix"
			:src="item"></image>
			<view @click="deleteImage(index)" class="flex align-center justify-center position-absolute rounded-circle" 
			style="height: 60rpx;width: 60rpx;top: 10rpx;right: 0;background-color: rgba(0, 0, 0, 0.5);">
				<text class="iconfont font-sm text-white">&#xe620;</text>
			</view>
		</view>
		<view v-if="imageList.length < 9" class="flex align-center justify-center" style="width: 230rpx;" @click="chooseImage">
			<view class="flex align-center justify-center bg-light rounded" style="width: 220rpx;height: 220rpx;">
				<text class="text-light-muted" style="font-size: 100rpx;">+</text>
			</view>	
		</view>
		
	</view>
</template>

<script>
	import { upload } from '@/api/chat.js';
	export default{
		props:{
			list:{
				type:Array,
				default:() => []
			}
		},
		data(){
			return {
				imageList:[]
			}
		},
		mounted() {
			this.imageList = this.list
		},
		methods:{
			//选择图片
			chooseImage(){
				uni.chooseImage({
					count: 9 - this.imageList.length,
					success: async (res) => {
						for(let i = 0; i < res.tempFilePaths.length; i++) {
							const uploadResult = await upload({ filePath: res.tempFilePaths[i], bucket: 'moments' })
							this.imageList.push(uploadResult.url)
							this.$emit('updateImage',this.imageList)
						}
					}
				})
			},
			//预览图片
			preview(url){
				uni.previewImage({
					urls:this.imageList,
					current:url
				})
			},
			//删除图片
			deleteImage(index){
				this.imageList.splice(index,1)
				this.$emit('updateImage',this.imageList)
			}
		}
	}
</script>

<style>
</style>