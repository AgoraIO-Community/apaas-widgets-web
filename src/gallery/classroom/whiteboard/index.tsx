import { AgoraCloudClassWidget, transI18n, bound, Log, Logger } from 'agora-common-libs';
import type { AgoraWidgetController } from 'agora-edu-core';
import dayjs from 'dayjs';
import ReactDOM from 'react-dom';
import { reaction, IReactionDisposer } from 'mobx';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../events';
import { FcrBoardFactory } from '../../../common/whiteboard-wrapper/factory';
import { FcrBoardRoom } from '../../../common/whiteboard-wrapper/board-room';
import { FcrBoardMainWindow } from '../../../common/whiteboard-wrapper/board-window';
import {
  BoardWindowAnimationOptions,
  FcrBoardRegion,
  FcrBoardRoomJoinConfig,
  FcrBoardRoomEvent,
  BoardConnectionState,
  FcrBoardMainWindowEvent,
  BoardMountState,
  FcrBoardMainWindowFailureReason,
} from '../../../common/whiteboard-wrapper/type';
import { downloadCanvasImage } from '../../../common/whiteboard-wrapper/utils';
import { BoardUIContext } from './ui-context';
import { App } from './app';
import { DialogProgressApi } from '../../../components/progress';
import isNumber from 'lodash/isNumber';
import { addResource } from './i18n/config';

@Log.attach({ proxyMethods: false })
export class FcrBoardWidget extends AgoraCloudClassWidget {
  protected static _installationDisposer?: CallableFunction;
  protected static _animationOptions: BoardWindowAnimationOptions;
  logger!: Logger;
  protected _boardRoom?: FcrBoardRoom;
  protected _boardMainWindow?: FcrBoardMainWindow;
  protected _outerDom?: HTMLElement;
  protected _boardDom?: HTMLDivElement | null;
  protected _collectorDom?: HTMLDivElement | null;
  protected _listenerDisposer?: CallableFunction;
  protected _initialized = false;
  protected _mounted = false;
  protected _isInitialUser = false;
  protected _joined = false;
  protected _initArgs?: {
    appId: string;
    region: FcrBoardRegion;
  };
  protected _grantedUsers = new Set<string>();
  protected _disposers: IReactionDisposer[] = [];

  get widgetName() {
    return 'netlessBoard';
  }

  set collectorDom(dom: HTMLDivElement | null) {
    this._collectorDom = dom;
  }

  set boardDom(dom: HTMLDivElement | null) {
    this._boardDom = dom;
  }

  render(dom: HTMLElement) {
    dom.classList.add('netless-whiteboard-wrapper');
    this._outerDom = dom;

    this.setBackgourndImage();

    ReactDOM.render(
      <BoardUIContext.Provider value={this.createUIContext()}>
        <App />
      </BoardUIContext.Provider>,
      dom,
    );
  }

  unload() {
    if (this._outerDom) {
      ReactDOM.unmountComponentAtNode(this._outerDom);
      this._outerDom = undefined;
    }
  }

  onInstall(controller: AgoraWidgetController): void {
    const handleOpen = (toggle: boolean) => {
      const widgetId = this.widgetId;
      if (toggle) {
        // 打开远端
        controller.setWidegtActive(widgetId);
        // 打开本地
        controller.broadcast(AgoraExtensionWidgetEvent.WidgetBecomeActive, {
          widgetId,
        });
      } else {
        // 关闭远端
        controller.setWidgetInactive(widgetId);
        // 关闭本地
        controller.broadcast(AgoraExtensionWidgetEvent.WidgetBecomeInactive, {
          widgetId,
        });
      }
    };

    const setAnimationOptions = (animationOptions: BoardWindowAnimationOptions) => {
      FcrBoardWidget._animationOptions = animationOptions;
    };

    controller.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.ToggleBoard,
      onMessage: handleOpen,
    });
    controller.addBroadcastListener({
      messageType: AgoraExtensionRoomEvent.BoardSetAnimationOptions,
      onMessage: setAnimationOptions,
    });

    FcrBoardWidget._installationDisposer = () => {
      controller.removeBroadcastListener({
        messageType: AgoraExtensionRoomEvent.ToggleBoard,
        onMessage: handleOpen,
      });
    };
  }

  /**
   * 组件创建
   */
  onCreate(props: any, userProps: any) {
    addResource();
    this._isInitialUser = userProps.initial;
    const boardEvents = Object.values(AgoraExtensionRoomEvent).filter((key) =>
      key.startsWith('board-'),
    );

    const disposers = boardEvents.map((key) => {
      const listener = {
        messageType: key,
        onMessage: this._extractMessage(key as AgoraExtensionRoomEvent),
      };

      this.addBroadcastListener(listener);

      return () => {
        this.removeBroadcastListener(listener);
      };
    });

    this._listenerDisposer = () => {
      disposers.forEach((d) => d());
    };

    // 处理
    this._checkBoard(props);
    // 处理授权列表变更
    this._checkPrivilege(props);
    // 处理讲台隐藏/显示，重新计算白板宽高比
    this._disposers.push(
      reaction(
        // () => !!(this.classroomStore.roomStore.flexProps?.stage ?? true),
        () => {
          enum LayoutMaskCode {
            None = 0,
            StageVisible = 1,
            VideoGalleryVisible = 2,
          }

          const { flexProps } = this.classroomStore.roomStore;

          const getLayoutCode = () => {
            if (!isNumber(flexProps.area)) {
              // 1v1和大班课默认讲台不开启
              if (
                this.classroomConfig.sessionInfo.roomType === 0 ||
                this.classroomConfig.sessionInfo.roomType === 2
              ) {
                return LayoutMaskCode.None;
              }
              // 小班课默认开启讲台
              return LayoutMaskCode.None | LayoutMaskCode.StageVisible;
            }
            return flexProps.area;
          };

          const layoutCode = getLayoutCode();

          return !!(layoutCode & LayoutMaskCode.StageVisible);
        },
        () => {
          const { _boardDom } = this;
          if (_boardDom) {
            setTimeout(() => {
              const aspectRatio = _boardDom.clientHeight / _boardDom.clientWidth;

              this._boardMainWindow?.setAspectRatio(aspectRatio);
            });
          }
        },
      ),
    );

    this._disposers.push(
      reaction(
        () => {
          const scene = this.classroomStore.connectionStore.mainRoomScene;

          if (scene) {
            return this.classroomStore.roomStore.mainRoomDataStore.flexProps?.backgroundImage;
          }
          return undefined;
        },
        (backgroundImage) => {
          if (backgroundImage) {
            this.setBackgourndImage();
          }
        },
      ),
    );
  }

  /**
   * 组件销毁
   */
  onDestroy() {
    this._leave();

    if (this._listenerDisposer) {
      this._listenerDisposer();
    }
    this._disposers.forEach((d) => d());
    this._disposers = [];
  }

  private _checkBoard(props: any) {
    const { boardAppId, boardId, boardRegion, boardToken } = props.extra || {};

    if (!this._initialized && boardAppId && boardId && boardRegion && boardToken) {
      const { userUuid: userId, userName } = this.classroomConfig.sessionInfo;

      this._initArgs = {
        appId: boardAppId,
        region: boardRegion,
      };

      this._join({
        roomId: boardId,
        roomToken: boardToken,
        userId,
        userName,
        hasOperationPrivilege: this.hasPrivilege,
      });

      this._initialized = true;
    }
  }

  private _extractMessage(event: AgoraExtensionRoomEvent) {
    return (args: unknown[]) => this._handleMessage({ command: event, args });
  }

  private _handleMessage(message: unknown) {
    const { command, args = [] } = message as {
      command: AgoraExtensionRoomEvent;
      args: unknown[];
    };

    if (!command) {
      this.logger.warn('No command specified');
      return;
    }

    const mainWindow = this._boardMainWindow;

    let cmdMapping: Record<string, CallableFunction> = {
      [AgoraExtensionRoomEvent.BoardGrantPrivilege]: this._grantPrivilege,
    };
    // these commands can only be executed after main window created
    if (mainWindow) {
      cmdMapping = Object.assign(cmdMapping, {
        [AgoraExtensionRoomEvent.BoardSelectTool]: mainWindow.selectTool,
        [AgoraExtensionRoomEvent.BoardAddPage]: mainWindow.addPage,
        [AgoraExtensionRoomEvent.BoardRemovePage]: mainWindow.removePage,
        [AgoraExtensionRoomEvent.BoardDrawShape]: mainWindow.drawShape,
        [AgoraExtensionRoomEvent.BoardClean]: mainWindow.clean,
        [AgoraExtensionRoomEvent.BoardGotoPage]: mainWindow.setPageIndex,
        [AgoraExtensionRoomEvent.BoardPutImageResource]: mainWindow.putImageResource,
        [AgoraExtensionRoomEvent.BoardPutImageResourceIntoWindow]:
          mainWindow.putImageResourceIntoWindow,
        [AgoraExtensionRoomEvent.BoardOpenMaterialResourceWindow]:
          mainWindow.createMaterialResourceWindow,
        [AgoraExtensionRoomEvent.BoardOpenMediaResourceWindow]:
          mainWindow.createMediaResourceWindow,
        [AgoraExtensionRoomEvent.BoardRedo]: mainWindow.redo,
        [AgoraExtensionRoomEvent.BoardUndo]: mainWindow.undo,
        [AgoraExtensionRoomEvent.BoardChangeStrokeWidth]: mainWindow.changeStrokeWidth,
        [AgoraExtensionRoomEvent.BoardChangeStrokeColor]: mainWindow.changeStrokeColor,
        [AgoraExtensionRoomEvent.BoardSaveAttributes]: this._saveAttributes,
        [AgoraExtensionRoomEvent.BoardLoadAttributes]: this._loadAttributes,
        [AgoraExtensionRoomEvent.BoardGetSnapshotImageList]: this._getSnapshotImage,
        [AgoraExtensionRoomEvent.BoardSetDelay]: mainWindow.setTimeDelay,
        [AgoraExtensionRoomEvent.BoardOpenH5ResourceWindow]: mainWindow.createH5Window,
      });
    }

    if (cmdMapping[command]) {
      // @ts-ignore
      cmdMapping[command](...args);
    } else {
      this.logger.warn(
        'Cannot execute [',
        command,
        '] command whether the command is not supported or the main window is not created!',
      );
    }
  }

  @bound
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

  @bound
  unmount() {
    if (this._mounted && this._boardMainWindow) {
      this._boardMainWindow.destroy();
      this._boardMainWindow = undefined;
    }
    this._mounted = false;
  }

  @bound
  private _grantPrivilege(userUuid: string, granted: boolean) {
    if (granted) {
      this.updateWidgetProperties({
        extra: {
          [`grantedUsers.${userUuid}`]: true,
        },
      });
    } else {
      this.removeWidgetExtraProperties([`grantedUsers.${userUuid}`]);
    }
  }

  @bound
  private async _saveAttributes() {
    const mainWindow = this._boardMainWindow;
    const { sessionInfo } = this.classroomConfig;
    if (mainWindow) {
      const attr = mainWindow.getAttributes();
      await this.classroomStore.api.setWindowManagerAttributes(sessionInfo.roomUuid, attr);
    }
  }

  @bound
  private async _getSnapshotImage(background: string) {
    const mainWindow = this._boardMainWindow;

    if (mainWindow) {
      mainWindow.getSnapshotImage(background, (progress) => {
        if (progress !== 100) {
          DialogProgressApi.show({ key: 'saveImage', progress: 1, width: 100, auto: true });
        } else {
          DialogProgressApi.destroy('saveImage');
        }
      });
    }
  }

  @bound
  private async _loadAttributes() {
    if (!this._isInitialUser) {
      return;
    }
    const mainWindow = this._boardMainWindow;
    const { sessionInfo } = this.classroomConfig;
    if (mainWindow) {
      const attributes = await this.classroomStore.api.getWindowManagerAttributes(
        sessionInfo.roomUuid,
      );

      mainWindow.setAttributes(attributes);
    }
  }

  private _join(config: FcrBoardRoomJoinConfig) {
    this._joined = true;

    const { roomId, roomToken, userId, userName, hasOperationPrivilege } = config;

    this.logger.info('create board client with config', config);

    this._boardRoom = FcrBoardFactory.createBoardRoom({
      appId: this._initArgs?.appId || '',
      region: this._initArgs?.region || FcrBoardRegion.CN,
      animationOptions: FcrBoardWidget._animationOptions,
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
      this._deliverWindowEvents(mainWindow);
      // this.unmount();
      this._boardMainWindow = mainWindow;
      this.mount();
    });

    boardRoom.on(FcrBoardRoomEvent.JoinFailure, (e) => {
      this.logger.error('Fcr board join failure, error:', e.message);
      this.ui.addToast(transI18n('fcr_board_cannot_join_room'), 'warning');
    });

    boardRoom.on(FcrBoardRoomEvent.ConnectionStateChanged, (state) => {
      this.logger.info('Fcr board connection state changed to', state);
      // this.broadcast(FcrBoardRoomEvent.ConnectionStateChanged, state);
      if (state === BoardConnectionState.Disconnected && this._joined) {
        this.logger.info('Fcr board start reconnecting');
        boardRoom.join(joinConfig);
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

  private _deliverWindowEvents(mainWindow: FcrBoardMainWindow) {
    mainWindow.on(FcrBoardMainWindowEvent.MountSuccess, () => {
      if (this._boardMainWindow) {
        this._boardMainWindow.emitPageInfo();
      }
      this.broadcast(AgoraExtensionWidgetEvent.BoardMountStateChanged, BoardMountState.Mounted);
    });
    mainWindow.on(FcrBoardMainWindowEvent.Unmount, () => {
      this.broadcast(AgoraExtensionWidgetEvent.BoardMountStateChanged, BoardMountState.NotMounted);
    });
    mainWindow.on(FcrBoardMainWindowEvent.PageInfoUpdated, (info) => {
      this.broadcast(AgoraExtensionWidgetEvent.BoardPageInfoChanged, info);
    });
    mainWindow.on(FcrBoardMainWindowEvent.RedoStepsUpdated, (steps) => {
      this.broadcast(AgoraExtensionWidgetEvent.BoardRedoStepsChanged, steps);
    });
    mainWindow.on(FcrBoardMainWindowEvent.UndoStepsUpdated, (steps) => {
      this.broadcast(AgoraExtensionWidgetEvent.BoardUndoStepsChanged, steps);
    });
    mainWindow.on(FcrBoardMainWindowEvent.SnapshotSuccess, (canvas: HTMLCanvasElement) => {
      const fileName = `${this.classroomConfig.sessionInfo.roomName}_${dayjs().format(
        'YYYYMMDD_HHmmSSS',
      )}.jpg`;

      downloadCanvasImage(canvas, fileName);
      this.ui.addToast(transI18n('fcr_savecanvas_tips_save_successfully'));
    });
    mainWindow.on(FcrBoardMainWindowEvent.Failure, (reason) => {
      this.logger.error('operation failure, reason: ', reason);
      if (reason === FcrBoardMainWindowFailureReason.ResourceWindowAlreadyOpened) {
        this.ui.addToast(transI18n('fcr_board_resource_already_opened'), 'error');
      }
      if (reason === FcrBoardMainWindowFailureReason.SnapshotFailure) {
        this.ui.addToast(transI18n('fcr_savecanvas_tips_fail_to_save'));
      }
    });
  }

  @bound
  handleDragOver(e: unknown) {
    this.broadcast(AgoraExtensionWidgetEvent.BoardDragOver, e);
  }

  @bound
  handleDrop(e: unknown) {
    this.broadcast(AgoraExtensionWidgetEvent.BoardDrop, e);
  }

  private async _checkPrivilege(props: any) {
    const { userUuid } = this.classroomConfig.sessionInfo;
    const prev = this._grantedUsers.has(userUuid);
    const keys = Object.keys(props.extra?.grantedUsers || {});
    this._grantedUsers = new Set<string>(keys);
    const grantedUsers = this._grantedUsers;
    const hasPrivilege = this.hasPrivilege;
    if (prev !== hasPrivilege && this._boardMainWindow) {
      await this._boardMainWindow.updateOperationPrivilege(hasPrivilege);
    }

    this.broadcast(AgoraExtensionWidgetEvent.BoardGrantedUsersUpdated, grantedUsers);
  }

  get hasPrivilege() {
    const { userUuid, role } = this.classroomConfig.sessionInfo;
    const granted = this._grantedUsers.has(userUuid);
    return [1, 3].includes(role) ? true : granted;
  }

  /**
   * 房间属性变更
   * @param props
   */
  onPropertiesUpdate(props: any) {
    // 处理
    this._checkBoard(props);
    // 处理授权列表变更
    this._checkPrivilege(props);
  }
  /**
   * 用户属性变更
   * @param props
   */
  onUserPropertiesUpdate(userProps: any) {
    this._isInitialUser = userProps.initial;
  }

  onUninstall(controller: AgoraWidgetController) {
    if (FcrBoardWidget._installationDisposer) {
      FcrBoardWidget._installationDisposer();
    }
  }

  locate() {
    const dom = document.querySelector('.widget-slot-board');
    if (dom) {
      return dom as HTMLElement;
    }
    this.logger.info('Cannot find a proper DOM to render the FCR board widget');
  }

  createUIContext() {
    return {
      mount: this.mount,
      unmount: this.unmount,
      handleDrop: this.handleDrop,
      handleDragOver: this.handleDragOver,
      handleBoardDomLoad: (ref: HTMLDivElement | null) => {
        this.boardDom = ref;
      },
      handleCollectorDomLoad: (ref: HTMLDivElement | null) => {
        this.collectorDom = ref;
      },
    };
  }

  @bound
  setBackgourndImage() {
    const imageUrl = this.classroomStore.roomStore.mainRoomDataStore.flexProps?.backgroundImage;
    if (imageUrl && this._outerDom) {
      this._outerDom.style.background = `url(${imageUrl}) no-repeat bottom center / cover`;
    }
  }
}
