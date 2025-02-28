// This file is created by egg-ts-helper@1.35.1
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportApply = require('../../../app/controller/apply');
import ExportChat = require('../../../app/controller/chat');
import ExportDownload = require('../../../app/controller/download');
import ExportFava = require('../../../app/controller/fava');
import ExportFriend = require('../../../app/controller/friend');
import ExportGroup = require('../../../app/controller/group');
import ExportMinio = require('../../../app/controller/minio');
import ExportMoment = require('../../../app/controller/moment');
import ExportReport = require('../../../app/controller/report');
import ExportRtc = require('../../../app/controller/rtc');
import ExportTag = require('../../../app/controller/tag');
import ExportUser = require('../../../app/controller/user');
import ExportVersion = require('../../../app/controller/version');
import ExportYzm = require('../../../app/controller/yzm');

declare module 'egg' {
  interface IController {
    apply: ExportApply;
    chat: ExportChat;
    download: ExportDownload;
    fava: ExportFava;
    friend: ExportFriend;
    group: ExportGroup;
    minio: ExportMinio;
    moment: ExportMoment;
    report: ExportReport;
    rtc: ExportRtc;
    tag: ExportTag;
    user: ExportUser;
    version: ExportVersion;
    yzm: ExportYzm;
  }
}
