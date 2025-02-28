class webViewRtc {
  constructor(opt) {
    this.offerParams = opt.otherEle ? {
      offerToRecieveAudio: 1,
      offerToRecieveVideo: 1
    } : {
      offerToRecieveAudio: 1,
      offerToRecieveVideo: 0
    }
    this.myVideo = opt.ele,
	this.callType = "callVoice"
    this.localVideo = opt.otherEle
    this.horn = true // 听筒 false 扬声器true
    this.streamType = 1; //1 对方 2 自己
    this.idfer = '' //主动：0 被动：1 
    this.localStream = null // 本地流
    this.otherStream = null
    this.platform = 'h5' // 平台
    this.plus = null
    this.callFlag = false // 是否接通
    this.headset = true //麦克风 打开true 关闭false,
    this.facingMode = 'user' //前置摄像头还是后置摄像头 user-前置 environment-后置
    this.senders = null // 数据流
    this.timeString = '00-00-00' // 通话时间
	this.config = {
	    'iceServers': [{
	        'urls': ['stun:stun.xten.com', 'stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302',
	          'stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302', 'stun:stun4.l.google.com:19302'
	        ]
	      },
	      {
	        'urls': opt.url ? [opt.url] : [], // 自己搭建服务器地址
	
	        "username": opt.username,
	        "credential": opt.credential
	      },
	    ],
	  },
    this.pc = new RTCPeerConnection(this.config); // rtc
  }
  init(platform) { //platform {app , h5} callType {video, voice}
    this.platform = platform
    if (platform === 'app') {
      document.addEventListener('plusready', () => {
        console.log('设置扬声器')
        this.plus = plus.audio.createPlayer();
        this.plus.setRoute(plus.audio.ROUTE_SPEAKER);
      });
    }
  }
  callVoice() {
	  this.callType = "callVoice"
    this.getUserMedia(false, true, (mediastream) => {
      this.localStream = mediastream
      this.localStream.getTracks().forEach(track => this.pc.addTrack(track, this.localStream));
      console.log('success')
      this.postMsg({
        localStream: 'localStream'
      })
    }, () => {
      this.postMsg({
        mediaDevices: 'mediaDevices',
      })
    })
  }
  receiveVoice() {
	  this.callType = "callVoice"
    this.getUserMedia(false, true, (mediastream) => {
      this.localStream = mediastream
      this.localStream.getTracks().forEach(track => this.pc.addTrack(track, this.localStream));
    }, () => {
      this.postMsg({
        mediaDevices: 'mediaDevices',
      })
    })
  }
  callVideo() {
	  this.callType = "callVideo"
    this.getUserMedia({
      width: window.screen.height,
      height: window.screen.width
    }, true, (mediastream) => {
      this.myVideo.srcObject = mediastream;
	  this.localVideo.srcObject=mediastream;
      this.localStream = mediastream
      // 同步音频
      this.localStream.getTracks().forEach(track => this.pc.addTrack(track, this.localStream));
	  console.log('success')
      this.postMsg({
        localStream: 'localStream',
      })
    }, () => {
      this.postMsg({
        mediaDevices: 'mediaDevices',
      })
    })
  }
  receiveVideo() {
	  this.callType = "callVideo"
    this.getUserMedia({
      width: window.screen.height,
      height: window.screen.width
    }, true, (mediastream) => {
      this.myVideo.srcObject = mediastream;
	  this.localVideo.srcObject=mediastream;
      this.localStream = mediastream;
      // 同步音频
      this.localStream.getTracks().forEach(track => this.pc.addTrack(track, this.localStream));
    }, () => {
      this.postMsg({
        mediaDevices: 'mediaDevices',
      })
    })
  }
  postMsg(data) { // 页面通讯
    if (this.platform === 'app') {
      this.unipostmessage(data)
    } else {
      window.parent.postMessage(data)
    }
  }
  getUserMedia(video, audio, success, fail) {
    navigator.mediaDevices.getUserMedia({
      video: video,
      audio: audio
    }).then((mediastream) => {
      success && success(mediastream)
      // 同步音频
    }).catch((e) => {
      fail && fail()
    });
  }
  ontrack(callback) {// 监听数据流
    this.pc.ontrack = (event) => {
      this.callFlag = true
      if (this.localVideo) {
        this.otherStream = event.streams[0];
        this.localVideo.srcObject = event.streams[0];
        try {
          this.localVideo.load()
          this.myVideo.play()
          // setTimeout(() => {
          //   this.localVideo.muted = false;
          // }, 500)
        } catch (e) {
          //TODO handle the exception
        }
       callback && callback()
        return
      }
      this.myVideo.srcObject = event.streams[0];
      try {
        this.myVideo.load()
        this.myVideo.play()

        // setTimeout(() => {
        //   this.myVideo.muted = false;
        // }, 500)
      } catch (e) {
        //TODO handle the exception
      }
      callback && callback()
    };
  }
  callMessage() { // h5 拨打方监听父级端发了的消息
    window.addEventListener('message', (e) => {
      this.callMessagecallback(e)
    }, false);
  }
  callAppMessage(getUniAppMessage) { // App 拨打方监听父级端发了的消息
    window.getUniAppMessage = (arg) => {
      console.log('网页接收到消息')
      const data = {
        data: jsonly(arg)
      }
      this.callMessagecallback(data)
    }
  }
  receiveMessage() { // h5 接听方监听父级端发了的消息
    window.addEventListener('message', (e) => {
      this.receiveMessagecallback(e)
    }, false);
  }
  receiveAppMessage() { // App 接听方监听父级端发了的消息
    window.getUniAppMessage = (arg) => {
      console.log('网页接收到消息')
      const data = {
        data: jsonly(arg)
      }
      this.receiveMessagecallback(data)
    }
  }
  callMessagecallback(e) {
    if (e.data && e.data['acceptRtc'] === "acceptRtc") {
      // 同意接电话
      this.createOffer()
      this.pc.onicecandidate = (event) => {
        // 监听ice
        var iceCandidate = event.candidate;
        if (iceCandidate) {
          this.postMsg({
            iceCandidate: 'iceCandidate',
            candidate: JSON.parse(JSON.stringify(iceCandidate))
          }, '*');
        }
      };
    }
    if (e.data && e.data['answer'] === "answer") {
      // console.log('同步answer信息...')
      //同步answer信息...
      this.pc.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: e.data['sdp']
      }));
    }
    if (e.data && e.data['transmitIce'] === "transmitIce") {
      // 添加ice
      if (typeof(e.data['iceCandidate']) === 'object') {
        this.pc.addIceCandidate(new RTCIceCandidate(e.data['iceCandidate']));
      } else {
        this.pc.addIceCandidate(new RTCIceCandidate(JSON.parse(e.data['iceCandidate'])));
      }
    }
    if (e.data && e.data['busyCall'] === "busyCall") {
      // 对方忙线
      this.busyCall()
    }

    if (e.data && e.data['rejectCall'] === "rejectCall") {
      // 拒绝通话
      this.idfer = 1
      this.rejectCall(this.idfer)
    }
    if (e.data && e.data['handleUp'] === "handleUp") {
      // 挂断通话
      this.idfer = 1
      this.hangupAction(this.idfer)
    }
  }
  createOffer() {
    this.pc.createOffer(this.offerParams).then((offer) => {
      this.pc.setLocalDescription(offer);
      this.postMsg({
        offer: 'offer',
        sdp: offer.sdp
      }, '*');
    });
  }
  receiveMessagecallback(e) {
    if (e.data && e.data['acceptOffer'] === "acceptOffer") {
      this.pc.setRemoteDescription(new RTCSessionDescription({
        type: 'offer',
        sdp: e.data['sdp']
      }));
      this.createAnswer()
    }
    if (e.data && e.data['transmitIce'] === "transmitIce") {
      if (typeof(e.data['iceCandidate']) === 'object') {
        this.pc.addIceCandidate(new RTCIceCandidate(e.data['iceCandidate']));
      } else {
        this.pc.addIceCandidate(new RTCIceCandidate(JSON.parse(e.data['iceCandidate'])));
      }
    }
    if (e.data && e.data['cancelCall'] === "cancelCall") {
      // 取消通话
      this.idfer = 1
      this.cancelCall(this.idfer)
    }
    if (e.data && e.data['handleUp'] === "handleUp") {
      // 挂断通话
      this.idfer = 1
      this.hangupAction(this.idfer)
    }
  }
  createAnswer() {
    this.pc.createAnswer(this.offerParams).then((answer) => {
      this.pc.setLocalDescription(answer);
      this.postMsg({
        answer: 'answer',
        sdp: answer.sdp
      }, '*');
      this.pc.onicecandidate = (event) => {
        var iceCandidate = event.candidate;
        if (iceCandidate) {
          this.postMsg({
            iceCandidate: 'iceCandidate',
            candidate: JSON.parse(JSON.stringify(iceCandidate))
          }, '*');
        }
      };
    });
  }
  hangupAction(idfer) { //挂断电话
    this.localStream.getTracks().forEach(track => track.stop());
    this.pc && this.pc.close();
    this.pc = null;
    this.postMsg({
      hangup: 'hangup',
      idfer: idfer,
      time: this.timeString,
	  callType: this.callType
    }, '*');
  }
  rejectCall(idfer) { //拒绝电话
    this.localStream.getTracks().forEach(track => track.stop());
    this.pc && this.pc.close();
    this.pc = null;
    this.postMsg({
      rejectCall: 'rejectCall',
      idfer: idfer,
	  callType: this.callType
    }, '*');
  }
  cancelCall(idfer) { //取消呼叫电话
    try {
      this.localStream.getTracks().forEach(track => track.stop());
      this.pc && this.pc.close();
      this.pc = null;
    } catch (err) {
      console.log('取消通话rtc失败', err)
    }
    this.postMsg({
      cancelCall: 'cancelCall',
      idfer: idfer,
	  callType: this.callType
    }, '*');
  }
  busyCall() { //对方忙线
    this.localStream.getTracks().forEach(track => track.stop());
    this.pc && this.pc.close();
    this.pc = null;
    this.postMsg({
      busyCall: 'busyCall',
	  callType: this.callType
    }, '*');
  }
  cancelBtn() {
    console.log('取消通话...')
    this.idfer = 0
    if (this.callFlag) {
      this.hangupAction(this.idfer)
    } else {
      this.cancelCall(this.idfer)
    }
  }
  cancelBtnd() {
    this.idfer = 0
    if (this.callFlag) {
      this.hangupAction(this.idfer)
    } else {
      this.rejectCall(this.idfer)
    }
  }
  changeVideo(callback) {
    this.localStream.getTracks().forEach(track => track.stop());
    if (this.facingMode == 'user') this.facingMode = 'environment'
    else this.facingMode = 'user'
    this.getUserMedia({
      width: window.screen.height,
      height: window.screen.width,
      facingMode: {
        exact: this.facingMode
      }
    }, true, (mediastream) => {
      this.senders = this.pc.getSenders()
      let videoTrack = mediastream.getVideoTracks()[0];
      let audioTrack = mediastream.getAudioTracks()[0];
      var sender = this.senders.find((s) => {
        return s.track.kind == 'video';
      });
      var sender2 = this.senders.find((s) => {
        return s.track.kind == 'audio';
      });
      sender.replaceTrack(videoTrack);
      sender2.replaceTrack(audioTrack);
      if (this.streamType === 1) this.myVideo.srcObject = mediastream;
      else this.localVideo.srcObject = mediastream
      this.localStream = mediastream
      setTimeout(() => {
        this.localVideo.muted = false;
      }, 500)
      if(this.horn){
      	this.horn = !this.horn
      }else{
      	this.horn = !this.horn
      }
      callback && callback(this.platform, !this.horn)
    }, () => {
      this.postMsg({
        mediaDevices: 'mediaDevices',
      })
    })
  }
  // 交换摄像头
  exchangeVideo() {
    // console.log('开始交换摄像头。。。')
    if (this.streamType === 1) {
      this.myVideo.srcObject = this.otherStream;
      this.localVideo.srcObject = this.localStream
      this.streamType = 2
    } else {
      this.myVideo.srcObject = this.localStream;
      this.localVideo.srcObject = this.otherStream
      this.streamType = 1
    }
  }
  speakBtn(callBack) { //打开关闭扬声器 h5端就是静音 ROUTE_EARPIECE 听筒 ROUTE_SPEAKER 扬声器
    if (this.horn) { //扬声器 => 听筒    
      this.horn = !this.horn
      if (this.platform === 'h5') {
        this.myVideo.muted = true
      }
      if (this.platform === 'app') {
        this.plus.setRoute(plus.audio.ROUTE_EARPIECE);
      }
    } else { //听筒 => 扬声器
      this.horn = !this.horn
      if (this.platform === 'h5') {
        myVideo.muted = false
      }
      if (this.platform === 'app') {
        this.plus.setRoute(plus.audio.ROUTE_SPEAKER);
      }
    }
    callBack && callBack(this.platform, !this.horn)
  }
  voiceBtn(callBack) { //打开麦克风和关闭麦克风
    if (this.headset) { //打开 => 关闭
      this.headset = !this.headset
      this.localStream.getTracks().forEach(track => track.enabled = false);
    } else {
      this.headset = !this.headset
      this.localStream.getTracks().forEach(track => track.enabled = true);
    }
    callBack && callBack(this.platform, !this.headset)
  }
  videoBtn(callBack) {
    if (this.headset) { //打开 => 关闭
      this.headset = !this.headset
      this.localStream.getTracks().forEach(track => {
        if (track.kind === 'audio') {
          track.enabled = false
        }
      });
    } else {
      this.headset = !this.headset
      this.localStream.getTracks().forEach(track => {
        if (track.kind === 'audio') {
          track.enabled = true
        }
      });
    }
    callBack && callBack(this.platform, !this.headset)
  }
  setCallTime(timeString) {
    this.timeString = timeString
  }
  unipostmessage(data) {
    uni.postMessage({
      data: data
    })
  }
}
