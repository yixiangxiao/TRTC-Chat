<template>
	<view style="overflow: scroll;">
		<!-- 状态栏占位 -->
		<!-- #ifdef APP-PLUS-NVUE -->
		<view :style="'height:' + statusBarHeight + 'px'"></view>
		<!-- #endif -->
		<!-- 取消全屏输入操作 -->
		<view class="bg-white p-3 flex " style="border-radius: 20rpx 20rpx 0 0;justify-content: space-around;">
			<!-- 108rpx -->
			<view @click="$emit('cancelSelectUser')" class="rounded-circle flex align-center justify-center"
				style="height: 48rpx;width: 48rpx;background-color: rgba(0, 0, 0, 0.1);">
				<image src="/static/images/arrowB.png" style="height: 32rpx;width: 32rpx;"></image>
			</view>
			<text>选择提醒的人</text>
			<my-main-button @click="handleNavbar" :name="multiple ? '确定' +'(' + selectedCount +')' : '多选'"
				slot="right"></my-main-button>
		</view>

		<!-- 搜索框 -->
		<view class="p-3 bg-light position-fixed left-0 right-0" :style="'top:' + top + 'px'" style="z-index: 9999;">
			<input type="text" v-model="keyword" class="bg-white rounded" placeholder="搜索" placeholder-class="text-center"
				style="height: 80rpx;">
		</view>
		<!-- 占位 -->
		<view style="height: 120rpx;"></view>
		
		<scroll-view class="bg-white" :style="contentStyle" scroll-y :show-scrollbar="false">
			<!-- #ifdef APP-PLUS-NVUE -->
			<my-list-item v-for="(item, index) in allList" :key="index" :img-url="item.avatar || '/static/images/userpic.png'" :title="item.name"
				:is-show-right="true" :is-show-right-icon="false" @click="selecetItem(item)">
				<view v-if="multiple" slot="right" style="width: 40rpx;height: 40rpx;"
					class="border rounded-circle flex align-center justify-center">
					<view v-if="item.checked" class="main-bg-color rounded-circle" style="width: 30rpx;height: 30rpx;">
					</view>
				</view>
			</my-list-item>
			<!-- #endif -->
			
			<!-- 无搜索结果 -->
			<view v-if=" keyword !== '' && searchList.length === 0 " 
			class="flex align-center justify-center" style="height: 100rpx;">
				<text class="font text-light-muted">暂无搜索结果</text>
			</view>
		</scroll-view>
		
	</view>
</template>

<script>
	import MyNavBar from '@/components/my-ui/my-nav-bar.vue';
	import MyMainButton from '@/components/my-ui/my-main-button.vue';
	import MyListItem from '@/components/my-ui/my-list-item.vue';
	import MyAvatar from '@/components/my-ui/my-avatar.vue';
	import { getGroupInfo } from '@/api/group.js';
	export default {
		components: {
			MyNavBar,
			MyMainButton,
			MyListItem,
			MyAvatar
		},
		data() {
			return {
				top: 0,
				keyword: '',
				multiple: false,
				item: {},
				list: [],
			}
		},
		props: {
			statusBarHeight: {
				type: Number,
				default: 0
			},
			bodyHeight: {
				type: Number,
				default: 0
			},
			groupId: {
				type: Number,
				default: null
			}
		},
		mounted() {
			this.top = this.statusBarHeight + uni.upx2px(100)
			this.getGroupInfo(this.groupId)
		},
		computed: {
			contentStyle() {
				const height = this.bodyHeight - this.top
				return `height:${height}px;`
			},
			//最终列表
			allList(){
				return this.keyword ? this.searchList : this.list
			},
			//搜索结果
			searchList(){
				if (this.keyword === '') return []
				return this.list.filter(item => item.name.indexOf(this.keyword) !== -1)
			},
			//选中列表
			selectedList() {
				return this.list.filter(item => item.checked)
			},
			//选中数量
			selectedCount() {
				return this.selectedList.length
			},
		},
		methods: {
			//点击导航栏多选
			handleNavbar() { // 群发
				if (!this.multiple) {
					return this.multiple = true
				}
				// 发送
				if(this.selectedCount === 0){
					return uni.showToast({
						title: '请先选择',
						icon: 'none'
					});
				}
				this.$emit('selectUserEvent', this.selectedList)
			},
			selecetItem(item) {
				// 多选
				if (this.multiple) {
					//选中|限制选中数量
					if (!item.checked && this.selectedCount === 9) {
						return uni.showToast({
							icon: 'none',
							title: '最多选中9个'
						})
					}
					//取消选中
					item.checked = !item.checked
					return 
				}
				
				// 单选
				this.item = item
				this.$emit('selectUserEvent',[item])
			},
			// 获取群信息
			getGroupInfo(id) {
				getGroupInfo(id).then(res => {
					const list = res.group_users.map(v => {
						return {
							id: v.user_id,
							name: v.nickname || v.user.nickname || v.user.username,
							avatar:v.user.avatar,
							checked: false
						}
					})
					this.list = list
				}).catch((err) => {
					uni.showToast({
						icon:'none',
						title:err
					})
				})
			},
		}
	}
</script>

<style>

</style>