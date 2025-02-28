'use strict';
/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  // 发送验证码
  router.get('/sendmail', controller.yzm.sendMail);
  // 注册
  router.post('/register', controller.user.register);
  // 登录
  router.post('/login', controller.user.login);
  // 退出
  router.post('/logout', controller.user.logout);
  // 查找用户
  router.post('/search_user', controller.user.searchUser);
  // 用户名是否存在
  router.post('/check_username', controller.user.checkUserName);
  // 邮箱是否存在
  router.post('/check_email', controller.user.checkEmail);
  // 忘记密码
  router.post('/forget_password', controller.user.forgetPassword);
  // 添加好友
  router.post('/apply/add_friend', controller.apply.addFriend);
  // 好友申请列表
  router.get('/apply/apply_list', controller.apply.applyList);
  // 处理好友申请
  router.post('/apply/apply_handle/:id', controller.apply.applyHandle);
  // 通讯录列表
  router.get('/friend/get_list', controller.friend.getList);
  // 获取用户信息
  router.get('/friend/get_info/:id', controller.friend.getInfo);
  // 移入/移出黑名单
  router.post('/friend/set_black/:id', controller.friend.setBlack);
  // 设为/取消星标好友
  router.post('/friend/set_star/:id', controller.friend.setStar);
  // 设置朋友圈权限
  router.post('/friend/set_moment_auth/:id', controller.friend.setMomentAuth);
  // 投诉好友/群组
  router.post('/report/friend', controller.report.reportFriend);
  // 设置备注和标签
  router.post('/friend/set_remark_tag/:id', controller.friend.setRemarkAndTag);
  // 获取所有标签
  router.get('/friend/get_all_tag', controller.friend.getAllTag);
  // 创建群聊
  router.post('/group/create', controller.group.createGroup);
  // 获取群聊列表
  router.get('/group/get_list', controller.group.getGroupList);
  // 获取群信息
  router.get('/group/get_info/:id', controller.group.getGroupInfo);
  // 修改群名称
  router.post('/group/rename', controller.group.rename);
  // 修改群公告
  router.post('/group/remark', controller.group.remark);
  // 修改我在本群的昵称
  router.post('/group/update_nickname', controller.group.updateNickname);
  // 解散群聊或退出群聊
  router.post('/group/quit_group', controller.group.quitGroup);
  // 生成群二维码
  router.get('/group/qrcode/:id', controller.group.qrcode);
  // 生成个人二维码名片
  router.get('/user/qrcode/:id', controller.user.qrcode);
  // 文件上传
  router.post('/upload', controller.minio.upload);
  router.post('/upload_base64', controller.minio.uploadBase64);
  // 创建收藏
  router.post('/fava/create', controller.fava.create);
  // 获取收藏列表
  router.get('/fava/get_list', controller.fava.list);
  // 删除收藏
  router.post('/fava/destroy', controller.fava.destroy);
  // 修改用户资料
  router.post('/user/update_info', controller.user.updateInfo);
  // 删除好友
  router.post('/friend/destroy', controller.friend.destroy);
  // 踢出某个群成员
  router.post('/group/kickoff', controller.group.kickoff);
  // 邀请加入群聊
  router.post('/group/invite', controller.group.invite);
  // 批量邀请加入群聊
  router.post('/group/batch_invite', controller.group.batchInvite);
  // 标签列表
  router.get('/tag/list', controller.tag.list);
  // 标签用户列表
  router.get('/tag/read/:id', controller.tag.read);
  // 验证群聊和当前用户的关系
  router.post('/group/checkrelation', controller.group.checkrelation);
  // 加入群聊
  router.post('/group/join', controller.group.join);
  // 创建朋友圈
  router.post('/moment/create', controller.moment.create);
  // 朋友圈点赞
  router.post('/moment/like', controller.moment.like);
  // 朋友圈评论
  router.post('/moment/comment', controller.moment.comment);
  // 朋友圈列表
  router.get('/moment/timeline', controller.moment.timeline);
  // 某个用户的朋友圈列表
  router.get('/moment/list', controller.moment.list);
  // 修改朋友圈封面
  router.post('/user/momentcover', controller.user.updateCover);
  // 删除朋友圈
  router.post('/moment/destroy', controller.moment.deleteMoment);
  // 删除评论
  router.post('/moment/comment_destroy', controller.moment.deleteComment);
  app.ws.use(async (ctx, next) => {
    // 获取参数 ws://localhost:7001/ws?token=123456
    // ctx.query.token
    // 验证用户token
    let user = {};
    const token = ctx.query.token;
    try {
      user = ctx.verifyToken(token);
      // 判断token是否有效
      const t = await ctx.service.cache.get('user_' + user.id);
      if (!t || t !== token) {
        return ctx.websocket.close({ code: 1000, reason: 'Token 令牌不合法' });
      }
      // 验证用户状态
      const userCheck = await app.model.User.findByPk(user.id);
      if (!userCheck) {
        ctx.websocket.send(JSON.stringify({
          msg: 'fail',
          data: '用户不存在',
        }));
        return ctx.websocket.close({ code: 1000, reason: '用户不存在' });
      }
      if (!userCheck.status) {
        ctx.websocket.send(JSON.stringify({
          msg: 'fail',
          data: '你已被禁用',
        }));
        return ctx.websocket.close({ code: 1000, reason: '你已被禁用' });
      }
      // 用户上线
      app.ws.user = app.ws.user ? app.ws.user : {};
      // 记录当前用户id
      ctx.websocket.user_id = user.id;
      app.ws.user[user.id] = ctx.websocket;
      ctx.online(user.id);
      ctx.addLoginLog(user.id);
      await next();
    } catch (err) {
      console.log(err);
      const fail = err.name === 'TokenExpiredError'
        ? 'token 已过期! 请重新获取令牌'
        : 'Token 令牌不合法!';
      ctx.websocket.send(JSON.stringify({
        msg: 'fail',
        data: fail,
      }));
      // 关闭连接
      ctx.websocket.close({ code: 1000, reason: fail });
    }
  });

  // websocket
  app.ws.route('/ws', controller.chat.connect);
  // 发送消息
  router.post('/chat/send', controller.chat.send);
  // 客户端接收到消息
  router.post('/chat/receive', controller.chat.receiveMessage);
  // 获取离线消息
  router.get('/chat/get_offline_message', controller.chat.getOfflineMessage);
  // 撤回消息
  router.post('/chat/recall', controller.chat.recall);
  // 删除聊天信息
  router.post('/chat/delete_chat_message', controller.chat.deleteChatMessage);
  // 文件下载
  router.get('/download/:filename', controller.download.download);

  // rtc
  // 拒绝
  router.post('/rtc/reject', controller.rtc.rejectCall);
  // 忙线
  router.post('/rtc/busy', controller.rtc.busyCall);
  // 未响应
  router.post('/rtc/no_response', controller.rtc.noResponseCall);
  // 多人通话请求
  router.post('/rtc/group_call', controller.rtc.groupCall);
  // 多人通话结束
  router.post('/rtc/group_call_end', controller.rtc.groupCallEnd);
  // 加入多人通话
  router.post('/rtc/join_group_call', controller.rtc.joinGroupCall);
  // 离开多人通话
  router.post('/rtc/leave_group_call', controller.rtc.leaveGroupCall);
  // 结束多人通话
  router.post('/rtc/end_group_call', controller.rtc.endGroupCall);
  // 查询群通话人数
  router.get('/rtc/group_call_count', controller.rtc.getGroupCallCount);
};
