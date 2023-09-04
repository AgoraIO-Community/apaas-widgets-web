import ReactDOM from 'react-dom';
import { App } from './app';
import {
  AgoraExtensionWidgetEvent,
  AgoraWidgetTrackMode,
  BoardConnectionState,
  FcrBoardShape,
  FcrBoardTool,
} from 'agora-classroom-sdk';
import { AgoraEduToolWidget } from '../../common/edu-tool-widget';
import { AgoraWidgetController, EduRoleTypeEnum } from 'agora-edu-core';
import { Lodash, Log, Logger, bound } from 'agora-rte-sdk';
import { FcrBoardFactory } from '../whiteboard/factory';
import { FcrBoardRoom } from '../whiteboard/wrapper/board-room';
import { FcrBoardMainWindow } from '../whiteboard/wrapper/board-window';
import {
  FcrBoardRegion,
  FcrBoardRoomJoinConfig,
  FcrBoardRoomEvent,
} from '../whiteboard/wrapper/type';
import { observable, action } from 'mobx';

@Log.attach({ proxyMethods: false })
export class FcrCanvasLayerWidget extends AgoraEduToolWidget {
  logger!: Logger;
  private _dom?: HTMLElement;
  private _privilege = false;
  private _boardRoom?: FcrBoardRoom;
  private _boardMainWindow?: FcrBoardMainWindow;
  private _boardDom?: HTMLDivElement | null;
  private _collectorDom?: HTMLDivElement | null;
  private _mounted = false;
  private _joined = false;
  private _initArgs?: {
    appId: string;
    region: FcrBoardRegion;
  };

  @observable
  counter = 0;

  /**
   * Widget unique identifier.
   * Note: widget name cannot include hyphen symbol.
   *
   */
  get widgetName() {
    return 'canvas';
  }

  set boardDom(dom: HTMLDivElement | null) {
    this._boardDom = dom;
  }

  get hasPrivilege() {
    const { role } = this.classroomConfig.sessionInfo;
    return [EduRoleTypeEnum.teacher, EduRoleTypeEnum.assistant].includes(role) || this._privilege;
  }

  get minWidth() {
    return 400;
  }
  get minHeight() {
    return 300;
  }
  get trackMode() {
    return AgoraWidgetTrackMode.TrackPositionAndDimensions;
  }

  onInstall(controller: AgoraWidgetController) {
    controller.broadcast(AgoraExtensionWidgetEvent.RegisterCabinetTool, {
      id: this.widgetName,
      name: 'Canvas',
      iconType: 'answer',
    });
  }

  onCreate(properties: any) {
    this._syncCounter(properties);

    this.broadcast(AgoraExtensionWidgetEvent.RequestGrantedList, this.widgetId);

    this._initArgs = { appId: '646/P8Kb7e_DJZVAQw', region: FcrBoardRegion.CN };

    /**
     * replace below with your whiteboard credentials
     */
    this._join({
      roomId: '0085c330489411ee928e6554980fdf2f',
      roomToken:
        'NETLESSROOM_YWs9VkJmMjI5ZEQtVFFQQW9YZiZub25jZT0xNjkzNTUxMTAwMDE1MDAmcm9sZT0wJnNpZz01NTNkYjVhZDcwY2IwYWQzMTdlMzAwNGNiN2IzZTQ5YWU0YTIzNmE5NjU5Y2JkMzdjNjZmMDM2NDA1MDhmZWE3JnV1aWQ9MDA4NWMzMzA0ODk0MTFlZTkyOGU2NTU0OTgwZmRmMmY',
      userId: '73ec7259dfeb6d0d817d708d7e6642491',
      userName: '',
      hasOperationPrivilege: true,
    });
  }

  @Lodash.throttled(100)
  handleBoardContentResize({ width, height }: { width: number; height: number }) {
    const aspectRatio = height / width;

    this._boardMainWindow?.setAspectRatio(aspectRatio);
  }

  @action.bound
  private _syncCounter(properties: any) {
    this.counter = properties.extra?.counter || 0;
  }

  @action.bound
  handleCountIncrement() {
    this.updateWidgetProperties({ extra: { counter: this.counter + 1 } });
  }

  @bound
  handleSelectTool(tool: FcrBoardTool) {
    this._boardMainWindow?.selectTool(tool);
  }

  handleSelectShape(shape: FcrBoardShape) {
    this._boardMainWindow?.drawShape(shape, 4, { r: 220, g: 50, b: 50 });
  }

  private _join(config: FcrBoardRoomJoinConfig) {
    this._joined = true;

    const { roomId, roomToken, userId, userName, hasOperationPrivilege } = config;

    this.logger.info('create board client with config', config);

    this._boardRoom = FcrBoardFactory.createBoardRoom({
      appId: this._initArgs?.appId || '',
      region: this._initArgs?.region || FcrBoardRegion.CN,
    });

    const joinConfig = {
      roomId,
      roomToken,
      userId,
      userName,
      hasOperationPrivilege,
    };

    const boardRoom = this._boardRoom;

    boardRoom.on(FcrBoardRoomEvent.JoinSuccess, async (mainWindow) => {
      this.logger.info('Fcr board join success');
      await mainWindow.updateOperationPrivilege(this.hasPrivilege);
      this.unmount();
      this._boardMainWindow = mainWindow;
      this.mount();
    });

    boardRoom.on(FcrBoardRoomEvent.JoinFailure, (e) => {
      this.logger.error('Fcr board join failure', e);
    });

    boardRoom.on(FcrBoardRoomEvent.ConnectionStateChanged, (state) => {
      this.logger.info('Fcr board connection state changed to', state);
      // this.broadcast(FcrBoardRoomEvent.ConnectionStateChanged, state);
      if (state === BoardConnectionState.Disconnected && this._joined) {
        this.logger.info('Fcr board start reconnecting');
        // boardRoom.join(joinConfig);
      }
      if (state === BoardConnectionState.Connected) {
        if (this._boardMainWindow) {
          this._boardMainWindow.emitPageInfo();
        }
      }
      this.broadcast(AgoraExtensionWidgetEvent.BoardConnStateChanged, state);
    });

    boardRoom.on(FcrBoardRoomEvent.MemberStateChanged, (state) => {
      this.logger.info('Fcr board member state changed to', state);
      // this.broadcast(FcrBoardRoomEvent.ConnectionStateChanged, state);
      this.broadcast(AgoraExtensionWidgetEvent.BoardMemberStateChanged, state);
    });
    boardRoom.join(joinConfig);
  }

  private _leave() {
    this._joined = false;
    if (this._boardRoom) {
      this._boardRoom.leave();
      this._boardRoom = undefined;
    }
  }

  mount() {
    const { _boardMainWindow, _boardDom } = this;

    if (_boardDom && _boardMainWindow) {
      this._mounted = true;
      const aspectRatio = _boardDom.clientHeight / _boardDom.clientWidth;
      _boardMainWindow.mount(_boardDom, {
        containerSizeRatio: aspectRatio,
        collectorContainer: this._collectorDom ?? undefined,
      });
    }
  }

  unmount() {
    if (this._mounted && this._boardMainWindow) {
      this._boardMainWindow.destroy();
      this._boardMainWindow = undefined;
    }
    this._mounted = false;
  }

  render(dom: HTMLElement) {
    this._dom = dom;
    dom.classList.add('h-full');
    ReactDOM.render(<App widget={this} />, dom);
  }

  unload() {
    if (this._dom) {
      ReactDOM.unmountComponentAtNode(this._dom);
      this._dom = undefined;
    }
  }

  onPropertiesUpdate(properties: any): void {
    this._syncCounter(properties);
  }

  onDestroy() {
    this._leave();
  }

  onUninstall(controller: AgoraWidgetController) {
    controller.broadcast(AgoraExtensionWidgetEvent.UnregisterCabinetTool, this.widgetName);
  }
}
