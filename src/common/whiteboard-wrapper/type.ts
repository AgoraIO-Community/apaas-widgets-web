import type { WindowManager } from '@netless/window-manager';
import type { FcrBoardMainWindow } from './board-window';

export enum BoardConnectionState {
  Disconnected = 0,
  Connecting = 1,
  Connected = 2,
  Reconnecting = 3,
  Disconnecting = 4,
}

export enum BoardMountState {
  NotMounted = 0,
  Mounted = 1,
}

export enum FcrBoardTool {
  Selector = 1,
  LaserPointer = 2,
  Eraser = 3,
  Clicker = 4,
  Hand = 5,
  Text = 6,
}

export enum FcrBoardShape {
  Curve = 1,
  Straight = 2,
  Arrow = 3,
  Rectangle = 4,
  Triangle = 5,
  Rhombus = 6,
  Pentagram = 7,
  Ellipse = 8,
}

export enum FcrBoardRegion {
  CN = 'cn-hz',
  US = 'us-sv',
  IN = 'in-mum',
  SG = 'sg',
  GB = 'gb-lon',
}

export type FcrBoardPageInfo = {
  showIndex: number;
  count: number;
};

export type FcrBoardPage = {
  name: string;
  contentUrl: string;
  previewUrl: string;
  contentWidth: number;
  contentHeight: number;
};

export type FcrBoardRoomJoinConfig = {
  roomId: string;
  roomToken: string;
  userId: string;
  userName: string;
  hasOperationPrivilege: boolean;
};

export enum FcrBoardRoomEvent {
  JoinSuccess = 'join-success',
  JoinFailure = 'join-failure',
  ConnectionStateChanged = 'connection-state-changed',
  MemberStateChanged = 'member-state-changed',
}

export interface FcrBoardRoomEventEmitter {
  on(eventName: FcrBoardRoomEvent.JoinSuccess, cb: (mainWindow: FcrBoardMainWindow) => void): void;
  on(eventName: FcrBoardRoomEvent.JoinFailure, cb: (e: Error) => void): void;
  on(
    eventName: FcrBoardRoomEvent.ConnectionStateChanged,
    cb: (state: BoardConnectionState) => void,
  ): void;
  on(eventName: FcrBoardRoomEvent.MemberStateChanged, cb: (state: BoardState) => void): void;
  off(eventName: FcrBoardRoomEvent, cb: CallableFunction): void;
}

export enum FcrBoardMainWindowEvent {
  OpenedCoursewareListChanged = 'opened-courseware-list-changed',
  PageInfoUpdated = 'page-info-updated',
  RedoStepsUpdated = 'redo-steps-updated',
  UndoStepsUpdated = 'undo-steps-updated',
  MountSuccess = 'mount-success',
  Unmount = 'unmount',
  SnapshotSuccess = 'snapshot-success',
  Failure = 'failure',
}

export enum FcrBoardMainWindowFailureReason {
  ResourceWindowAlreadyOpened = 'resource-window-already-opened',
  SnapshotFailure = 'snapshot-failure',
  MountFailure = 'mount-failure',
}

export interface FcrBoardMainWindowEventEmitter {
  on(
    eventName: FcrBoardMainWindowEvent.MountSuccess,
    cb: (windowManager: WindowManager) => void,
  ): void;
  on(
    eventName: FcrBoardMainWindowEvent.PageInfoUpdated,
    cb: (pageInfo: FcrBoardPageInfo) => void,
  ): void;
  on(eventName: FcrBoardMainWindowEvent.RedoStepsUpdated, cb: (steps: number) => void): void;
  on(eventName: FcrBoardMainWindowEvent.UndoStepsUpdated, cb: (steps: number) => void): void;
  on(eventName: FcrBoardMainWindowEvent.Unmount, cb: () => void): void;
  on(eventName: FcrBoardMainWindowEvent.SnapshotSuccess, cb: () => void): void;
  on(
    eventName: FcrBoardMainWindowEvent.Failure,
    cb: (reason: FcrBoardMainWindowFailureReason) => void,
  ): void;
  off(eventName: FcrBoardMainWindowEvent, cb: CallableFunction): void;
}

export type SlideOptions = {
  minFPS?: number;
  maxFPS?: number;
  resolution?: number;
  autoResolution?: boolean;
  autoFPS?: boolean;
  maxResolutionLevel?: number;
  forceCanvas?: boolean;
};

export type MountOptions = {
  collectorContainer?: HTMLElement;
  containerSizeRatio?: number;
};

export type BoardState = {
  strokeColor: Color;
  strokeWidth: number;
  textSize: number;
  tool: FcrBoardTool;
  shape: FcrBoardShape;
};

export type FcrBoardRoomOptions = SlideOptions & { debug: boolean };

export type FcrBoardWindowOptions = SlideOptions & { debug: boolean };

/** Misc types */

export type FetchImageResult = {
  width: number;
  height: number;
  file: File;
  uuid: string;
  url: string;
};

export type BaseImageSize = {
  width: number;
  height: number;
};

export type Color = { r: number; g: number; b: number };

export type FcrBoardMaterialWindowConfig<T = unknown> = {
  resourceUuid: string;
  urlPrefix: string;
  title: string;
  pageList: T[];
  taskUuid: string;
  resourceHasAnimation: boolean;
};

export type FcrBoardMediaWindowConfig = {
  resourceUuid: string;
  resourceUrl: string;
  title: string;
  mimeType: string;
};

export type FcrBoardH5WindowConfig = {
  resourceUuid: string;
  resourceUrl: string;
  title: string;
};

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
