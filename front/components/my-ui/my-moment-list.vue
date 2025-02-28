<template>
	<view class="p-3 flex align-start border-bottom border-light-secondary">
		<my-avatar size="80" :src="item.avatar" @click="openUser($event, item.user_id)"></my-avatar>
		<view class="pl-2 flex-1 flex flex-column">
			<!-- 昵称 -->
			<text class="font-md text-hover-primary">{{item.user_name}}</text>
			<!-- 内容 -->
			<my-text-expend :content="item.content"></my-text-expend>
			<!-- <text class="font-md text-dark mb-1 mt-2">{{item.content}}</text> -->
			<!-- 图片 -->
			<view v-if="item.image.length" class="py-2 flex flex-wrap">
				<block v-for="(image, imageIndex) in item.image" :key="imageIndex">
					<!-- 单图 -->
					<my-image v-if="item.image.length === 1" :src="image" image-calss="rounded" :max-h="350"
						:max-w="500" @click="preview(image)"></my-image>
					<!-- 多图 -->
					<image mode="aspectFit" v-else :src="image" style="height: 170rpx;width: 170rpx;"
						class="bg-secondary mr-2 mb-2 rounded" @click="preview(image)"></image>
				</block>
			</view>
			<!-- 视频-->
			<view v-if="item.video" @tap="openVideo">
				<my-image :src="item.video.poster" :max-w="500" :max-h="350" @load="loadPoster"></my-image>
				<text class="iconfont text-white position-absolute" style="font-size: 80rpx;width: 80rpx;height: 80rpx;" :style="posterIconStyle">&#xe737;</text>
			</view>
			
			<!-- 位置 -->
			<view v-if="item.location"  class="flex align-center" @click="openLocation(item.location)">
				<text class="font text-hover-primary">{{item.location.name}}</text>
			</view>
			
			<!-- 时间|操作 -->
			<view class="flex align-center justify-between">
				<view class="flex">
					<text class="font-sm text-light-muted">{{item.created_at | formatTime}}</text>
					<image @click="openPermission" v-if="(user.id === item.user_id) && (getSee.type !== 'all' && getSee.type !== 'none')" class="ml-2" src="/static/images/mail/permission.png" style="height: 32rpx;width: 32rpx;"></image>
					<image v-if="user.id === item.user_id && getSee.type === 'none'" class="ml-2" src="/static/images/mail/lock.png" style="height: 32rpx;width: 32rpx;"></image>
					<image @click="deleteMoment" v-if="self === 'me'" class="ml-2" src="/static/images/mail/delete.png" style="height: 32rpx;width: 32rpx;"></image>
				</view>
				<view class="rounded p-1 bg-light" @click="$emit('action',{item, index})">
					<text class="iconfont font text-hover-primary">&#xe62a;</text>
				</view>
			</view>

			<!-- 点赞列表|评论列表 -->
			<view class="bg-light mt-2" v-if="item.likes.length || item.comments.length">
				<!-- 点赞 -->
				<view v-if="item.likes.length" class="border-bottom flex align-start p-2">
					<text class="iconfont flex-shrink font text-hover-primary">&#xe637;</text>
					<view class="flex flex-1 flex-wrap ml-1">
						<text v-for="(s, si) in item.likes" @click="openUser($event, s.id)" style="max-width: 200rpx;" :key="si" class="font text-hover-primary ml-1 text-ellipsis">{{s.name}}</text>
					</view>
				</view>
				<!-- 评论 -->
				<!-- #ifdef APP-PLUS-NVUE -->
				<view v-if="item.comments.length" class="p-2">
					<text class="iconfont font-md text-hover-primary">&#xe64e;</text>
						<view v-for="(c, ci) in item.comments" :key="ci" class="mt-2">
							<view v-if="!c.reply" @longpress="replyLong($event, c)" @touchend="touchendReply"  hover-class="bg-hover-light" @click="reply($event,{ item, index, reply: c.user })">
								<view class="flex">
									<text class="text-hover-primary font"  @click="openUser($event,c.user.id)">{{c.user.name}}：</text>
								</view>
								<my-text-overflow @click="reply($event,{ item, index, reply: c.user })" :content="c.content"></my-text-overflow>
							</view>
							<view v-else @longpress="replyLong($event, c)" @touchend="touchendReply" hover-class="bg-hover-light" @click="reply($event,{ item, index, reply: c.user })">
								<view class="flex align-center">
									<!-- 套一层view是为了缩小点击text的范围 不然点哪里都是跳转到用户页 回复出不来 -->
									<view class="flex">
										<text @click="openUser($event,c.user.id)" class="text-hover-primary font">{{ c.user && c.user.name}} </text>
									</view>
									<view class="flex">
										<text class="text-muted font-sm">回复</text>
									</view>
									<view class="flex">
										<text @click="openUser($event,c.reply.id)" class="text-hover-primary font">{{c.reply && c.reply.name}}：</text>
									</view>
								</view>
								<my-text-overflow @click="reply($event,{ item, index, reply: c.user })" :content="c.content"></my-text-overflow>
							</view>
						</view>
				</view>
				<!-- #endif -->
				<!-- #ifdef MP -->
				<view class="p-2" style="display: block;">
					<view class="py-1">
						<text class="iconfont font-md text-hover-primary">&#xe64e;</text>
					</view>
					<block v-for="(c, ci) in item.comments" :key="ci">
						<view v-if="!c.reply" class="flex align-center">
							<text class="text-hover-primary font" @click="openUser($event, c.user.id)">{{c.user.name}}：</text>
							<text class="font text-dark flex-1">{{c.content}}</text>
						</view>
						<view v-else class="flex align-center" @click="$emit('reply',{ item, index, reply: c.user })">
							<text class="text-hover-primary font">{{ c.user && c.user.name}} </text>
							<text class="text-muted font-sm">回复</text>
							<text class="text-hover-primary font">{{c.reply && c.reply.name}}：</text>
							<text class="font text-dark flex-1">{{c.content}}</text>
						</view>
						<view style="height: 20rpx;"></view>
					</block>
				</view>
				<!-- #endif -->
			</view>
		</view>
		
		<div v-if="showPermission" @click="clickModal" class="fixed-bottom" style="background-color: rgba(0, 0, 0, 0.3);" :style="'height:' + height + 'px'">
			<view @click="stopPropagation" ref="permission" class="my-animation bg-white fixed-bottom" style="height: 500rpx;border-radius: 15rpx 15rpx 0rpx 0rpx">
				<view class="p-1 ml-1 flex align-center justify-between">
					<view @click="cancelPermission" class="rounded-circle flex align-center justify-center"
						style="height: 48rpx;width: 48rpx;background-color: rgba(0, 0, 0, 0.1);">
						<image src="/static/images/arrowB.png" style="height: 32rpx;width: 32rpx;"></image>
					</view>
					<text class="text-dark font">{{getText}}</text>
				</view>
				<scroll-view scroll-y :show-scrollbar="false">
					<my-list-item v-for="(item, index) in list" :key="index" :title="item.name"
					:imgUrl="item.avatar || '/static/images/userpic.png'" isNeedStopPropagation @click="getUserInfo(item.user_id)"></my-list-item>
				</scroll-view>
			</view>
		</div>
	</view>
</template>

<script>
	import MyAvatar from '@/components/my-ui/my-avatar.vue';
	import MyImage from '@/components/my-ui/my-image.vue';
	import mixin from '@/common/mixin/base.js';
	import { destroy } from '@/api/moment.js';
	import { mapState } from 'vuex';
	import MyListItem from '@/components/my-ui/my-list-item.vue';
	import MyTextOverflow from '@/components/my-ui/my-text-overflow.vue';
	import MyTextExpend from '@/components/my-ui/my-text-expend.vue';
	// #ifdef APP-PLUS-NVUE
	const dom = weex.requireModule('dom')
	const animation = weex.requireModule('animation');
	// #endif
	export default {
		components: {
			MyAvatar,
			MyImage,
			MyListItem,
			MyTextOverflow,
			MyTextExpend
		},
		mixins: [mixin],
		data(){
			return {
				// 默认封面的宽高
				poster: {
					w: 100,
					h: 100
				},
				height: 0,
				list: [],
				showPermission: false,
				isLongPress: false
			}
		},
		props: {
			item: {
				type: Object,
				default: () => {}
			},
			index: {
				type: Number,
				default: 0
			},
			self: {
				type: [String],
				default: 'me'
			},
			getData: {
				type: Function,
				default: () => {}
			}
		},
		computed: {
			posterIconStyle() {
				let w = this.poster.w / 2 - uni.upx2px(80) / 2;
				let h = this.poster.h / 2 - uni.upx2px(80) / 2;
				return `left:${w}px;top:${h}px;`;
			}
		},
		mounted() {
			let res = uni.getSystemInfoSync()
			this.height = res.windowHeight
			let list = []
			// console.log(this.getSee.list)
			this.mailList.forEach(v => {
				list.push(...v.list)
			})
			
			list = list.filter(v => {
				// 取得 this.getSee.list里的数据
				if (this.getSee.list && this.getSee.list.length) {
					if (this.getSee.list.includes(v.user_id)) {
						return true
					}
				} else {
					return false
				}
			})
			this.list = list
		},
		computed: {
			...mapState({
				user: state => state.user.user,
				mailList: state => state.user.mailList,
			}),
			getSee() {
				const sees = this.item.see.split(':');
				const o = {
				    only: [],
				    except: [],
					all: [],
					none: []
				};
				const oType = sees[0];
				// 如果为指定人可见，谁不可看则拿到对应的id
				if ((oType === 'only' || oType === 'except') && sees[1]) {
				    o[oType] = sees[1].split(',').map(v => parseInt(v));
				}
				return { list: o[oType], type: oType }
			},
			getText(type) {
				const obj = {
					all: '全部人可看',
					only: '指定人可见',
					except: '谁不可看',
					none: '仅自己可见',
				}
				return obj[this.getSee.type]
			},
		},
		methods: {
			// 长按评论
			replyLong(e, c) {
				// #ifdef APP-PLUS-NVUE
				e.stopPropagation();
				// #endif
				this.isLongPress = true
				let itemList = ['复制评论']
				// 只能删除自己的评论
				if(c.user.id === this.user.id) {
					itemList = ['复制评论', '删除评论']
				}
				uni.showActionSheet({
					itemList,
					success: (res) => {
						const {
							tapIndex
						} = res
						if (tapIndex === 0) {
							// 复制
							uni.setClipboardData({
								data: c.content,
								success: () => {
									uni.showToast({
										icon: 'none',
										title: '复制成功'
									})
								}
							});
						} else {
							//删除评论
							this.$emit('deleteComment', {comment_id: c.id}, this.index)
						}
					}
				})
			},
			touchendReply(){
				//延时执行为了防止 click() 还未判断 islongPress 的值就被置为 fasle
				setTimeout(() => {
					this.isLongPress = false
				},300)
			},
			reply(e, item) {
				if (this.isLongPress) return
				// #ifdef APP-PLUS-NVUE
				e.stopPropagation();
				// #endif
				this.$emit('reply', item)
			},
			openUser(e, id) {
				// #ifdef APP-PLUS-NVUE
				e.stopPropagation();
				// #endif
				uni.navigateTo({
					url: `/pages/mail/user-base/user-base?user_id=${id}`
				});
			},
			preview(url) {
				uni.previewImage({
					current: url,
					urls: this.item.image
				})
			},
			// 加载封面
			loadPoster(e) {
				this.poster.w = e.width;
				this.poster.h = e.height;
			},
			// 打开视频
			openVideo() {
				uni.navigateTo({
					url: '/pages/chat/video/video?url=' + this.item.video.src + '&isAutoBack=false'
				});
				
			},
			//打开地图
			openLocation(item){
				uni.openLocation({
					latitude: item.latitude,
					longitude: item.longitude,
					name: item.name,
					success: function() {
						// console.log('success');
					}
				});
			},
			// 删除朋友圈
			deleteMoment() {
				uni.showModal({
					content: '确定删除改朋友圈？',
					confirmText:"确定",
					success:(res)=> {
						if (res.confirm) {
							destroy({ moment_id: this.item.moment_id, image: this.item.image, video: this.item.video }).then(res => {
								uni.showToast({
									icon:'none',
									title: '删除成功'
								})
								this.getData()
							})
						}
					}
				});
				
			},
			// 打开权限列表
			openPermission() {
				this.showPermission = true
				// #ifdef APP-PLUS-NVUE
				this.$nextTick(() => {
					animation.transition(
						this.$refs.permission, {
							styles: {
								transform: 'scale(1,1)',
								transformOrigin: 'left top',
								opacity: 1
							},
							duration: 300, //ms
							timingFunction: 'ease',
							needLayout: false,
							delay: 0 //ms
						},
						() => {
							
						}
					);
				})
				// #endif
			},
			stopPropagation(e) {
				// #ifdef APP-PLUS-NVUE
				e.stopPropagation();
				// #endif
			},
			clickModal(e) {
				// #ifdef APP-PLUS-NVUE
				e.stopPropagation();
				// #endif
				this.cancelPermission()
			},
			cancelPermission() {
				// #ifdef APP-PLUS-NVUE
				this.$nextTick(() => {
					animation.transition(
						this.$refs.permission, {
							styles: {
								transform: 'scale(0,0)',
								transformOrigin: 'left top',
								opacity: 0
							},
							duration: 300, //ms
							timingFunction: 'ease',
							needLayout: false,
							delay: 0 //ms
						},
						() => {
							this.showPermission = false
						}
					);
				})
				// #endif
			},
			//获取用户资料
			getUserInfo(id) {
				uni.navigateTo({
					url:'/pages/mail/user-base/user-base?user_id='+ id
				})
			}
		}
	}
</script>

<style scoped>
	.my-animation {
		/* #ifdef APP-PLUS-NVUE */
		opacity: 0;
		transform: scale(0, 0);
		/* #endif */
	}
</style>