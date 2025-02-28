import $U from '@/common/lib/util.js';
export default {
	onShow() {
		let token = $U.getStorage('token')
		if(!token){
			uni.showToast({
				title: '请先登录',
				icon: 'none'
			});
			setTimeout(()=>{
				uni.reLaunch({
					url:"/pages/common/login/login"
				})
			},2000)
		}
	},
	methods:{
		navigate(path){
			uni.navigateTo({
				url: '/pages/'+path,
			});
		},
		// 返回并提示
		backToast(msg = '非法参数'){
			uni.showToast({
				title: msg,
				icon:"none"
			});
			setTimeout(() => {
				uni.navigateBack({
					delta: 1,
				});
			}, 1000)
		}
	}
}