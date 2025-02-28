<template>
	<view>
		<!-- 导航栏 -->
		<view :class="getClass">
			<!-- 状态栏 -->
			<view :style="'height:' + statusBarHeight + 'px'"></view>
			<!-- 导航 -->
			<view class="w-100 flex justify-between align-center" style="height: 90rpx;">
				<!-- 左边 -->
				<view class="flex align-center">
					<!-- 返回按钮 -->
					<my-icon-button v-if="isShowBack" @click="back" :icon="'\ue60d'"></my-icon-button>
					<!-- 标题 -->
					<slot>
						<text v-if="title" class="font-md ml-3">{{ getTitle }}</text>
					</slot>
				</view>
				<!-- 右边 -->
				<view class="flex align-center" v-if="isShowRight">
					<slot name="right">
						<my-icon-button :icon="'\ue6e3'" @click="search"></my-icon-button>
						<my-icon-button @click="openExtend" :icon="'\ue682'"></my-icon-button>
					</slot>
					<!-- <my-icon-button>&#xe682;</my-icon-button> -->
				</view>
			</view>
		</view>
		<!-- 占位 -->
		<view v-if="fixed" :style="fixedStyle"></view>
		<!-- 扩展菜单 -->
		<my-pop-up ref="extend" bodyBgColor="bg-dark" transformOrigin="right top" :body-height="525" :body-width="320">
			<view class="flex flex-column " style="width:320rpx;height:525rpx;">
				<view v-for="(item, index) in myExtends" :key="index" @click="clickEvent(item)" hover-class="bg-hover-dark" class=" flex-1 flex align-center">
					<text class="iconfont pl-3 font-md text-white">{{ item.icon }}</text>
					<text class="font-md pl-3 text-white">{{ item.name }}</text>
				</view>
			</view>
		</my-pop-up>
	</view>
</template>

<script>
import MyIconButton from '@/components/my-ui/my-icon-button.vue';
import MyPopUp from './my-pop-up.vue';
import { checkrelation } from '@/api/group.js'
export default {
	components: { MyIconButton, MyPopUp },
	props: {
		//是否显示返回按钮
		isShowBack:{
			type: Boolean,
			default: false
		},
		title: {
			type: [String, Boolean],
			default: false
		},
		fixed: {
			type: Boolean,
			default: true
		},
		isNeedBack:{ //是否需要返回
			type: Boolean,
			default: true
		},
		//未读消息数
		noreadnum: {
			type: Number,
			default: 0
		},
		//背景颜色
		bgColor: {
			type: String,
			default: 'bg-light'
		},
		//是否显示右边按钮（搜索，添加）
		isShowRight:{
			type: Boolean,
			default: true
		}
	},
	data() {
		return {
			statusBarHeight: 0,
			navBarHeight: 0,
			myExtends: [
				{
					name: '发起群聊',
					event:"navigateTo",
					path:"/pages/mail/mail/mail?type=createGroup",
					icon: '\ue633'
				},
				{
					name: '添加好友',
					event:"navigateTo",
					path:"/pages/mail/search-friends/search-friends",
					icon: '\ue65d'
				},
				{
					name: '扫一扫',
					event: 'scan',
					icon: '\ue614'
				},
				{
					name: '收付款',
					event: '',
					icon: '\ue667'
				},
				{
					name: '帮助与反馈',
					event: '',
					icon: '\ue61c'
				}
			]
		};
	},
	mounted() {
		// #ifdef APP-PLUS-NVUE
		this.statusBarHeight = plus.navigator.getStatusbarHeight();
		// #endif
		this.navBarHeight = this.statusBarHeight + uni.upx2px(90);
	},
	computed: {
		fixedStyle() {
			return `height:${this.navBarHeight}px`;
		},
		getTitle() {
			let noreadnum = this.noreadnum > 0 ? `(${this.noreadnum})` : '';
			// console.log(noreadnum)
			return `${this.title}${noreadnum}`;
		},
		getClass() {
			let fixed = this.fixed ? 'fixed-top' : '';
			return `${this.bgColor} ${fixed}`;
		}
	},
	methods: {
		openExtend() {
			this.$refs.extend.show(uni.upx2px(415), uni.upx2px(150));
		},
		clickEvent(item) {
			this.$refs.extend.hide()
			switch (item.event) {
				case 'navigateTo':
				uni.navigateTo({
					url: item.path,
				});
					break;
				case "scan":
				uni.scanCode({
				    success: (res)=> {
						if(res.scanType === 'QR_CODE'){
							let result = JSON.parse(res.result)
							switch (result.type){
								case 'group':
								checkrelation({ id:parseInt(result.id) }).then(res2=>{
									if(res2.status){
										// 已经在群内
										uni.navigateTo({
											url: '/pages/chat/chat?params='+encodeURIComponent(JSON.stringify({
												id:res2.group.id,
												name:res2.group.name,
												avatar:res2.group.avatar,
												chat_type:'group',
											})),
										});
										this.chat.readChatItem(res2.group.id,'group')
									} else {
										// 加入群聊
										uni.navigateTo({
											url: '/pages/chat/scan-add/scan-add?params='+encodeURIComponent(JSON.stringify(res2.group)),
										});
									}
								})
									break;
								case 'user':
								uni.navigateTo({
									url: '/pages/mail/user-base/user-base?user_id='+result.id,
								});
									break;
							}
						}
				    }
				});
					break;
				default: 
				uni.showToast({
					icon:'none',
					title:'敬请期待'
				})
				break;
			}
		},
		search(){
			uni.navigateTo({
				url:'/pages/common/search/search'
			})
		},
		back() {
			if (this.isNeedBack) {
				uni.navigateBack({
					delta:1
				})
			} else {
				this.$emit('back')
			}
			
		}
	}
};
</script>

<style></style>
