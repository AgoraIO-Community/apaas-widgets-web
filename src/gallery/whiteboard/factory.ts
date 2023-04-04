import { BoardWindowAnimationOptions } from './type';
import { FcrBoardRoom } from './wrapper/board-room';
import { FcrBoardRegion } from './wrapper/type';

export class FcrBoardFactory {
  static createBoardRoom({
    appId,
    region,
    animationOptions,
  }: {
    appId: string;
    region: FcrBoardRegion;
    animationOptions: BoardWindowAnimationOptions;
  }) {
    return new FcrBoardRoom(appId, region, {
      // debug: !isProduction,
      debug: false,
      ...animationOptions,
    });
  }
}
