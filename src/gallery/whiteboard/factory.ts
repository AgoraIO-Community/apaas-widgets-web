import { AgoraEduSDK } from 'agora-classroom-sdk';
import { FcrBoardRoom } from './wrapper/board-room';
import { FcrBoardRegion, URLDelegate } from './wrapper/type';

export class FcrBoardFactory {
  static createBoardRoom({
    appId,
    region,
    urlDelegate
  }: {
    appId: string;
    region: FcrBoardRegion;
    urlDelegate: URLDelegate;
  }) {
    return new FcrBoardRoom(appId, region, {
      // debug: !isProduction,
      debug: false,
      urlDelegate,
      ...AgoraEduSDK.boardWindowAnimationOptions,
    });
  }
}
