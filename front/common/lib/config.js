export default {
	// #ifndef H5
	baseUrl: "http://192.168.31.225:7001",
	// #endif
	
	// #ifdef H5
	baseUrl: "/api",
	// #endif
	
	socketUrl: "ws://192.168.31.225:7001/ws",
	env: "dev",
	codeUrl: "http://192.168.31.225:7001",
	
	audioUrl: 'http://192.168.31.225:7001/public/audio',
	
	SDKAppID: '', //腾讯音视频 SDKAppID
	
	emojiUrl: [{ // 表情包地址 部署后只需要把 http://192.168.31.225:7001/ 替换成你的域名或者ip即可
			url: "http://192.168.31.225:7001/public/images/emoji/",
			urlPng: "http://192.168.31.225:7001/public/images/emoji-png/",
			total: 20,
			isActive: false
		},
		{
			url: "http://192.168.31.225:7001/public/images/ggb/",
			urlPng: "http://192.168.31.225:7001/public/images/ggb-png/",
			total: 32,
			isActive: false
		}
	],
   mapKey: '', //高德静态地图key
}