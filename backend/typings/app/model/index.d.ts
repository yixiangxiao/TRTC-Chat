// This file is created by egg-ts-helper@1.35.1
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportApply = require('../../../app/model/apply');
import ExportAppVersion = require('../../../app/model/app_version');
import ExportFava = require('../../../app/model/fava');
import ExportFriend = require('../../../app/model/friend');
import ExportFriendTag = require('../../../app/model/friend_tag');
import ExportGroup = require('../../../app/model/group');
import ExportGroupUser = require('../../../app/model/group_user');
import ExportLoginLog = require('../../../app/model/login_log');
import ExportMoment = require('../../../app/model/moment');
import ExportMomentComment = require('../../../app/model/moment_comment');
import ExportMomentLike = require('../../../app/model/moment_like');
import ExportMomentTimeline = require('../../../app/model/moment_timeline');
import ExportOfflineMessage = require('../../../app/model/offline_message');
import ExportReport = require('../../../app/model/report');
import ExportTag = require('../../../app/model/tag');
import ExportUser = require('../../../app/model/user');
import ExportYzm = require('../../../app/model/yzm');

declare module 'egg' {
  interface IModel {
    Apply: ReturnType<typeof ExportApply>;
    AppVersion: ReturnType<typeof ExportAppVersion>;
    Fava: ReturnType<typeof ExportFava>;
    Friend: ReturnType<typeof ExportFriend>;
    FriendTag: ReturnType<typeof ExportFriendTag>;
    Group: ReturnType<typeof ExportGroup>;
    GroupUser: ReturnType<typeof ExportGroupUser>;
    LoginLog: ReturnType<typeof ExportLoginLog>;
    Moment: ReturnType<typeof ExportMoment>;
    MomentComment: ReturnType<typeof ExportMomentComment>;
    MomentLike: ReturnType<typeof ExportMomentLike>;
    MomentTimeline: ReturnType<typeof ExportMomentTimeline>;
    OfflineMessage: ReturnType<typeof ExportOfflineMessage>;
    Report: ReturnType<typeof ExportReport>;
    Tag: ReturnType<typeof ExportTag>;
    User: ReturnType<typeof ExportUser>;
    Yzm: ReturnType<typeof ExportYzm>;
  }
}
