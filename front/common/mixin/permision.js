

import permision from '@/common/lib/permission.js';
export default {
	methods:{
		// 录音相关
		// #ifdef APP-PLUS
		async checkPermissionRecord() {
			let status = permision.isIOS ? await permision.requestIOS('record') : await permision.requestAndroid('android.permission.RECORD_AUDIO');
			if (status === null || status === 1) {
				status = 1;
			} else if (status === 2) {
				uni.showModal({
					content: '系统麦克风已关闭',
					confirmText: '确定',
					showCancel: false,
					success: function(res) {}
				});
			} else {
				uni.showModal({
					content: '需要麦克风权限',
					confirmText: '设置',
					success: function(res) {
						if (res.confirm) {
							permision.gotoAppSetting();
						}
					}
				});
			}
			return status;
		},
		// 相机
		async checkPermissionCamera() {
			let status = permision.isIOS ? await permision.requestIOS('camera') : await permision.requestAndroid('android.permission.CAMERA');
			if (status === null || status === 1) {
				status = 1;
			} else if (status === 2) {
				uni.showModal({
					content: '相机已关闭',
					confirmText: '确定',
					showCancel: false,
					success: function(res) {}
				});
			} else {
				uni.showModal({
					content: '需要相机权限',
					confirmText: '设置',
					success: function(res) {
						if (res.confirm) {
							permision.gotoAppSetting();
						}
					}
				});
			}
			return status;
		},
		// 通知
		checkPermissionNotice() {
			let platform = uni.getSystemInfoSync().platform; //首先判断app是安卓还是ios
			console.log(platform);
			if (platform == "ios") { //这里是ios的方法
				console.log("我是iOS");
				var UIApplication = plus.ios.import("UIApplication");
				var app = UIApplication.sharedApplication();
				var enabledTypes = 0;
				if (app.currentUserNotificationSettings) {
					var settings = app.currentUserNotificationSettings();
					enabledTypes = settings.plusGetAttribute("types");
					console.log("enabledTypes1:" + enabledTypes);
					if (enabledTypes == 0) { //如果enabledTypes = 0 就是通知权限没有开启
						uni.showModal({
							title: '提示',
							content: '是否前往打开通知权限',
							success: res => {
								if (res.confirm) {
									this.openTongZhi()
								} else if (res.cancel) {
									console.log('用户点击取消');
								}
							}
						});
					}
				}
				plus.ios.deleteObject(settings);
			} else if (platform == "android") { //下面是安卓的方法
				console.log("我是安卓", plus.android);
				var main = plus.android.runtimeMainActivity();
				var pkName = main.getPackageName();
				var uid = main.getApplicationInfo().plusGetAttribute("uid");
				var NotificationManagerCompat = plus.android.importClass(
					"android.support.v4.app.NotificationManagerCompat"
				);
				//android.support.v4升级为androidx
				if (NotificationManagerCompat == null) {
					NotificationManagerCompat = plus.android.importClass(
						"androidx.core.app.NotificationManagerCompat"
					);
				}
				var areNotificationsEnabled =
					NotificationManagerCompat.from(main).areNotificationsEnabled();
				console.log(areNotificationsEnabled);
				// 未开通‘允许通知’权限，则弹窗提醒开通，并点击确认后，跳转到系统设置页面进行设置
				if (!areNotificationsEnabled) {
					uni.showModal({
						title: '提示',
						content: '是否前往打开通知权限',
						success: res => {
							if (res.confirm) {
								this.openTongZhi()
							} else if (res.cancel) {
								console.log('用户点击取消');
							}
						}
					});
				}
			}
		},
		openTongZhi() { //弹窗按钮绑定方法
			let platform = uni.getSystemInfoSync().platform; //获取安卓还是ios
			if (platform == "ios") { //如果机型是ios，ios由于权限问题，可能需要手动开启
				var UIApplication = plus.ios.import("UIApplication");
				var app = UIApplication.sharedApplication();
				var settings = app.currentUserNotificationSettings();
				enabledTypes = settings.plusGetAttribute("types");
				var NSURL2 = plus.ios.import("NSURL");
				var setting2 = NSURL2.URLWithString("app-settings:");
				var application2 = UIApplication.sharedApplication();
				application2.openURL(setting2);
				plus.ios.deleteObject(setting2);
				plus.ios.deleteObject(NSURL2);
				plus.ios.deleteObject(application2);
				plus.ios.deleteObject(settings);
			} else if (platform == "android") { //如果机型是安卓
				var main = plus.android.runtimeMainActivity();
				var pkName = main.getPackageName();
				var uid = main.getApplicationInfo().plusGetAttribute("uid");
				var Intent = plus.android.importClass("android.content.Intent");
				var Build = plus.android.importClass("android.os.Build");
				//android 8.0引导
				if (Build.VERSION.SDK_INT >= 26) { //判断安卓系统版本
					var intent = new Intent("android.settings.APP_NOTIFICATION_SETTINGS");
					intent.putExtra("android.provider.extra.APP_PACKAGE", pkName);
				} else if (Build.VERSION.SDK_INT >= 21) { //判断安卓系统版本
					//android 5.0-7.0
					var intent = new Intent("android.settings.APP_NOTIFICATION_SETTINGS");
					intent.putExtra("app_package", pkName);
					intent.putExtra("app_uid", uid);
				} else {
					//(<21)其他--跳转到该应用管理的详情页
					intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
					var uri = Uri.fromParts(
						"package",
						mainActivity.getPackageName(),
						null
					);
					intent.setData(uri);
				}
				// 跳转到该应用的系统通知设置页
				main.startActivity(intent);
			}
		},
		// #endif
	}
}