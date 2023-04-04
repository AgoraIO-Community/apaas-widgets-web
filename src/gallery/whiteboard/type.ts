import { BoardState, FcrBoardRegion, MountOptions, FcrBoardRoomJoinConfig } from './wrapper/type';

export type BoardConfig = {
  appId: string;
  region: FcrBoardRegion;
  defaultState: BoardState;
  mountOptions: MountOptions;
} & FcrBoardRoomJoinConfig;

export type BoardWindowAnimationOptions = {
  minFPS?: number;
  maxFPS?: number;
  resolution?: number;
  autoResolution?: boolean;
  autoFPS?: boolean;
  maxResolutionLevel?: number;
  forceCanvas?: boolean;
};
