import { BoardWindowAnimationOptions, FcrBoardRegion } from './type';
import { FcrBoardRoom } from './board-room';
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
