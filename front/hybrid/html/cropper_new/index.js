
function init() {
	window.getInitData = (arg) => {
		const data = jsonly(arg)
		const url = data.imageUrl
		var simpleCrop = new SimpleCrop({
		  src: url, //裁剪图片地址
		  size: {
		    //裁剪尺寸
		    width: 800,
		    height: 600,
		  },
		  cropSizePercent: 0.9, //裁剪框显示比例
		  cropCallback: function($resultCanvas) {
		    //图片裁剪完成回调函数
		    console.log("cropCallback");
			const postData = {
			  data: {
			    type: "croppedData",
			    dataUrl: $resultCanvas.toDataURL(),
			  },
			};
			uni.postMessage(postData);
		    // $resultCanvas.style.marginRight = "10px";
		    // $resultCanvas.style.width = "50%";
		    // document.body.appendChild($resultCanvas);
		  },
		  uploadCallback: function(src) {
		    //上传裁剪图片成功回调函数
		    console.log("uploadCallback " + src);
		  },
		  closeCallback: function() {
		    //关闭组件回调函数
		    console.log("closeCallback");
			const postData = {
			  data: {
			    type: "close",
			  },
			};
			uni.postMessage(postData);
		  },
		});
	}
}

/**
 * Base64字符串转二进制流
 * @param {String} dataurl Base64字符串(字符串包含Data URI scheme，例如：data:image/png;base64, )
 */
function dataURLtoBlob(dataurl) {
	var arr = dataurl.split(","),
		mime = arr[0].match(/:(.*?);/)[1],
		bstr = atob(arr[1]),
		n = bstr.length,
		u8arr = new Uint8Array(n);
	while (n--) {
		u8arr[n] = bstr.charCodeAt(n);
	}
	return new Blob([u8arr], {
		type: mime,
	});
}

/**
 * Base64字符串转二进制流
 * @param {String} base64 Base64字符串(字符串不包含Data URI scheme)
 * @param {String} type 文件类型(例如：image/png)
 */
function base64toBlob(base64, type) {
	// 将base64转为Unicode规则编码
	let bstr = atob(base64),
		n = bstr.length,
		u8arr = new Uint8Array(n);
	while (n--) {
		u8arr[n] = bstr.charCodeAt(n); // 转换编码后才可以使用charCodeAt 找到Unicode编码
	}
	return new Blob([u8arr], {
		type,
	})
}