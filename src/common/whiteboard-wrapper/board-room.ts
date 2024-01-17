import { bound, Log, Logger } from 'agora-common-libs';
import { AGEventEmitter } from 'agora-common-libs';
import {
  WhiteWebSdk,
  Room,
  WhiteWebSdkConfiguration,
  DeviceType,
  LoggerReportMode,
  createPlugins,
  ViewMode,
  RoomPhase,
  RoomState,
} from 'white-web-sdk';
import * as netlessVideoPlugin from '@netless/video-js-plugin';
import { WindowManager } from '@netless/window-manager';
import { FcrBoardMainWindow } from './board-window';
import {
  FcrBoardRoomEventEmitter,
  FcrBoardRegion,
  FcrBoardRoomOptions,
  FcrBoardRoomJoinConfig,
  FcrBoardRoomEvent,
  BoardState,
  BoardConnectionState,
  FcrBoardTool,
  FcrBoardShape,
} from './type';
import { convertToFcrBoardToolShape, hexColorToWhiteboardColor, textColors } from './helper';
import { retryAttempt } from 'agora-common-libs';

@Log.attach()
export class FcrBoardRoom implements FcrBoardRoomEventEmitter {
  logger!: Logger;
  private _client: WhiteWebSdk;
  private _room?: Room;
  private _boardView?: FcrBoardMainWindow;
  private _eventBus: AGEventEmitter = new AGEventEmitter();
  private _connState: BoardConnectionState = BoardConnectionState.Disconnected;
  private _joined = false;

  constructor(
    private _appId: string,
    private _region: FcrBoardRegion,
    private _options: FcrBoardRoomOptions,
  ) {
    const plugins = this._createPlugins();

    const config: WhiteWebSdkConfiguration = {
      useMobXState: true,
      pptParams: {
        useServerWrap: true,
      },
      deviceType: DeviceType.Surface,
      plugins,
      appIdentifier: _appId,
      preloadDynamicPPT: true,
      loggerOptions: {
        reportQualityMode: LoggerReportMode.AlwaysReport,
        reportDebugLogMode: LoggerReportMode.AlwaysReport,
        reportLevelMask: _options.debug ? 'debug' : 'info',
        printLevelMask: _options.debug ? 'debug' : 'info',
      },
    };

    this._client = new WhiteWebSdk(config);
  }

  @Log.silence
  private _createPlugins() {
    const plugins = createPlugins({
      [netlessVideoPlugin.PluginId]: netlessVideoPlugin.videoJsPlugin(),
    });

    plugins.setPluginContext(netlessVideoPlugin.PluginId, { enable: true, verbose: true });
    return plugins;
  }

  async join(config: FcrBoardRoomJoinConfig) {
    this._joined = true;
    if (this._connState !== BoardConnectionState.Disconnected) {
      return;
    }
    const joinParams = {
      region: this._region,
      uuid: config.roomId,
      uid: config.userId,
      roomToken: config.roomToken,
      isWritable: config.hasOperationPrivilege,
      disableDeviceInputs: !config.hasOperationPrivilege,
      disableCameraTransform: true,
      disableNewPencil: false,
      disableEraseImage: false,
      wrappedComponents: [],
      invisiblePlugins: [WindowManager],
      useMultiViews: true,
      disableMagixEventDispatchLimit: true,
      userPayload: {
        userId: config.userId,
        avatar: '',
        cursorName: config.userName,
        disappearCursor: true,
      },
      floatBar: {
        colors: textColors.map((color) => hexColorToWhiteboardColor(color)),
      },
    };

    try {
      this.logger.info('Join board room with params', joinParams);
      const retriesMax = 10;
      this._updateConnnectionState(BoardConnectionState.Connecting);
      await retryAttempt(
        async () => {
          const room = await this._client.joinRoom(joinParams, {
            onPhaseChanged: this._handleConnectionStateUpdated,
            onRoomStateChanged: this._handleRoomStateUpdated,
          });

          this._room = room;

          if (config.hasOperationPrivilege) {
            room.setViewMode(ViewMode.Broadcaster);
          } else {
            room.setViewMode(ViewMode.Follower);
          }

          this._boardView = new FcrBoardMainWindow(
            room,
            config.hasOperationPrivilege,
            this._options,
          );

          this._eventBus.emit(FcrBoardRoomEvent.JoinSuccess, this._boardView);
        },
        [],
        {
          retriesMax,
        },
      )
        .fail(async ({ error, timeFn, currentRetry }) => {
          this.logger.info(
            `failed to join board room, error: ${error.message}, current retry: ${currentRetry}`,
          );
          if (this._joined) {
            await timeFn();
          }
          this.logger.info(`continue attemptting? ${this._joined}`);
          return this._joined;
        })
        .abort(() => {
          this._updateConnnectionState(BoardConnectionState.Disconnected);
        })
        .exec();
    } catch (e) {
      this._eventBus.emit(FcrBoardRoomEvent.JoinFailure, e);
      this._updateConnnectionState(BoardConnectionState.Disconnected);
    }
  }

  async leave() {
    this._joined = false;
    if (this._room) {
      this._room.disconnect();
      this._room = undefined;
    }
  }

  @bound
  @Log.silence
  private _handleRoomStateUpdated(state: Partial<RoomState>) {
    const { memberState } = state;
    if (memberState) {
      const { strokeColor, strokeWidth, currentApplianceName, textSize, shapeType } = memberState;

      const localState: Partial<BoardState> = {};

      const [tool, shape] = convertToFcrBoardToolShape(currentApplianceName, shapeType);
      localState.tool = tool as FcrBoardTool;
      localState.shape = shape as FcrBoardShape;

      if (typeof strokeColor !== 'undefined') {
        const [r, g, b] = strokeColor;
        localState.strokeColor = { r, g, b };
      }

      if (typeof strokeWidth !== 'undefined') {
        localState.strokeWidth = strokeWidth;
      }

      if (typeof textSize !== 'undefined') {
        localState.textSize = textSize;
      }

      this._eventBus.emit(FcrBoardRoomEvent.MemberStateChanged, { ...localState });
    }
  }
  @bound
  @Log.silence
  private _updateConnnectionState(state: BoardConnectionState) {
    this._connState = state;
    this._eventBus.emit(FcrBoardRoomEvent.ConnectionStateChanged, state);
  }
  @bound
  @Log.silence
  private _handleConnectionStateUpdated(phase: RoomPhase) {
    if (phase === RoomPhase.Connecting) {
      this._updateConnnectionState(BoardConnectionState.Connecting);
    } else if (phase === RoomPhase.Connected) {
      this._updateConnnectionState(BoardConnectionState.Connected);
    } else if (phase === RoomPhase.Reconnecting) {
      this._updateConnnectionState(BoardConnectionState.Reconnecting);
    } else if (phase === RoomPhase.Disconnected) {
      this._updateConnnectionState(BoardConnectionState.Disconnected);
    } else if (phase === RoomPhase.Disconnecting) {
      this._updateConnnectionState(BoardConnectionState.Disconnecting);
    }
  }

  on(eventName: FcrBoardRoomEvent.JoinSuccess, cb: (mainWindow: FcrBoardMainWindow) => void): void;
  on(eventName: FcrBoardRoomEvent.JoinFailure, cb: (e: Error) => void): void;
  on(
    eventName: FcrBoardRoomEvent.ConnectionStateChanged,
    cb: (state: BoardConnectionState) => void,
  ): void;
  on(eventName: FcrBoardRoomEvent.MemberStateChanged, cb: (state: BoardState) => void): void;

  @Log.silence
  on(eventName: FcrBoardRoomEvent, cb: CallableFunction): void {
    this._eventBus.on(eventName, cb);
  }

  @Log.silence
  off(eventName: FcrBoardRoomEvent, cb: CallableFunction): void {
    this._eventBus.off(eventName, cb);
  }
}
