// This file is created by egg-ts-helper@1.35.1
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
type AnyClass = new (...args: any[]) => any;
type AnyFunc<T = any> = (...args: any[]) => T;
type CanExportFunc = AnyFunc<Promise<any>> | AnyFunc<IterableIterator<any>>;
type AutoInstanceType<T, U = T extends CanExportFunc ? T : T extends AnyFunc ? ReturnType<T> : T> = U extends AnyClass ? InstanceType<U> : U;
import ExportCache = require('../../../app/service/cache');
import ExportChat = require('../../../app/service/chat');
import ExportGroupAvatar = require('../../../app/service/group_avatar');
import ExportMinio = require('../../../app/service/minio');
import ExportYzm = require('../../../app/service/yzm');

declare module 'egg' {
  interface IService {
    cache: AutoInstanceType<typeof ExportCache>;
    chat: AutoInstanceType<typeof ExportChat>;
    groupAvatar: AutoInstanceType<typeof ExportGroupAvatar>;
    minio: AutoInstanceType<typeof ExportMinio>;
    yzm: AutoInstanceType<typeof ExportYzm>;
  }
}
