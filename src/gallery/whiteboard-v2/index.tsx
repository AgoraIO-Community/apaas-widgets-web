import { AgoraWidgetBase, AgoraWidgetLifecycle } from 'agora-common-libs/lib/widget';
import { AgoraWidgetController, EduRoleTypeEnum } from 'agora-edu-core';
import { bound, Log, Logger } from 'agora-rte-sdk';
import dayjs from 'dayjs';
import ReactDOM from 'react-dom';

import { reaction, IReactionDisposer } from 'mobx';
import { transI18n } from 'agora-common-libs/lib/i18n';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../events';
import { FcrBoardRoom } from '../../common/whiteboard-wrapper/board-room';
import { FcrBoardMainWindow } from '../../common/whiteboard-wrapper/board-window';
import {
  FcrBoardRegion,
  FcrBoardRoomJoinConfig,
  FcrBoardRoomEvent,
  BoardConnectionState,
  FcrBoardMainWindowEvent,
  BoardMountState,
  FcrBoardMainWindowFailureReason,
  BoardWindowAnimationOptions,
} from '../../common/whiteboard-wrapper//type';
import { downloadCanvasImage } from '../../common/whiteboard-wrapper//utils';
import {
  BoardUIContext,
  BoardUIContextValue,
  ScenePaginationUIContext,
  ScenePaginationUIContextValue,
  ToolbarUIContext,
  ToolbarUIContextValue,
} from './ui-context';
import { App } from './app';
import {
  FcrBoardPageInfo,
  FcrBoardShape,
  FcrBoardTool,
} from '../../common/whiteboard-wrapper/type';
import { observable, action } from 'mobx';
import tinycolor from 'tinycolor2';
import { FcrBoardFactory } from '../../common/whiteboard-wrapper/factory';
import { DialogProgressApi } from '../../components/progress';

@Log.attach({ proxyMethods: false })
export class FcrBoardWidget extends AgoraWidgetBase implements AgoraWidgetLifecycle {
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

  private _toolbarContext?: ToolbarUIContextValue;
  private _paginationContext?: ScenePaginationUIContextValue;
  private _boardContext?: BoardUIContextValue;
  private _boardDomResizeObserver?: ResizeObserver;
  private _defaultBoardState = {
    tool: FcrBoardTool.Clicker,
    strokeColor: '#fed130',
    strokeWidth: 2,
  };

  get widgetName() {
    return 'netlessBoard';
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
        () => !!(this.classroomStore.roomStore.flexProps?.stage ?? true),
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
  private async _getSnapshotImage(background?: string) {
    const mainWindow = this._boardMainWindow;

    if (mainWindow) {
      mainWindow.getSnapshotImage(background, (progress: number) => {
        if (progress !== 100) {
          DialogProgressApi.show({ key: 'saveImage', progress: 1, width: 100, auto: true });
        } else {
          DialogProgressApi.destroy('saveImage');
        }
      });
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

    const boardRoom = FcrBoardFactory.createBoardRoom({
      appId: this._initArgs?.appId || '',
      region: this._initArgs?.region || FcrBoardRegion.CN,
      animationOptions: FcrBoardWidget._animationOptions,
    });

    this._boardRoom = boardRoom;

    const joinConfig = {
      roomId,
      roomToken,
      userId,
      userName,
      hasOperationPrivilege,
    };

    boardRoom.on(FcrBoardRoomEvent.JoinSuccess, async (mainWindow) => {
      this.logger.info('Fcr board join success');
      await mainWindow.updateOperationPrivilege(this.hasPrivilege);
      this._deliverWindowEvents(mainWindow);
      this._boardMainWindow = mainWindow;
      this._connectObservables();
      this.mount();
    });

    boardRoom.on(FcrBoardRoomEvent.JoinFailure, (e) => {
      this.logger.error('Fcr board join failure', e);
    });

    boardRoom.on(FcrBoardRoomEvent.ConnectionStateChanged, (state) => {
      this.logger.info('Fcr board connection state changed to', state);
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
      this._resetToolIfNeed();
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
      this.ui.addToast(transI18n('toast2.save_success'));
    });
    mainWindow.on(FcrBoardMainWindowEvent.Failure, (reason) => {
      this.logger.error('operation failure, reason: ', reason);
      if (reason === FcrBoardMainWindowFailureReason.ResourceWindowAlreadyOpened) {
        this.ui.addToast(transI18n('edu_error.600074'), 'error');
      }
      if (reason === FcrBoardMainWindowFailureReason.SnapshotFailure) {
        this.ui.addToast(transI18n('toast2.save_error'));
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
      this._resetToolIfNeed();
      this._boardContext?.setPrivilege(hasPrivilege);
    }

    this.broadcast(AgoraExtensionWidgetEvent.BoardGrantedUsersUpdated, grantedUsers);
  }

  get hasPrivilege() {
    const { userUuid, role } = this.classroomConfig.sessionInfo;
    const granted = this._grantedUsers.has(userUuid);
    return [EduRoleTypeEnum.teacher, EduRoleTypeEnum.assistant].includes(role) ? true : granted;
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
    const dom = document.querySelector('.fcr-layout-board-view');
    if (dom) {
      return dom as HTMLElement;
    }
    this.logger.info('Cannot find a proper DOM to render the FCR board widget');
  }

  render(dom: HTMLElement): void {
    dom.classList.add('netless-whiteboard-wrapper');
    this._outerDom = dom;

    ReactDOM.render(
      <BoardUIContext.Provider value={this.createBoardUIContext()}>
        <ToolbarUIContext.Provider value={this.createToolbarUIContext()}>
          <ScenePaginationUIContext.Provider value={this.createScenePaginationUIContext()}>
            <App />
          </ScenePaginationUIContext.Provider>
        </ToolbarUIContext.Provider>
      </BoardUIContext.Provider>,
      dom,
    );
  }

  createBoardUIContext() {
    const observables = observable({ canOperate: this.hasPrivilege });
    return {
      observables,
      mount: this.mount,
      unmount: this.unmount,
      handleDrop: this.handleDrop,
      handleDragOver: this.handleDragOver,
      handleBoardDomLoad: (ref: HTMLDivElement | null) => {
        this._boardDom = ref;

        if (this._boardDom) {
          const resizeObserver = new ResizeObserver(this._notifyViewportChange);

          resizeObserver.observe(this._boardDom);

          this._boardDomResizeObserver = resizeObserver;

          this._notifyViewportChange();
        } else {
          this._boardDomResizeObserver?.disconnect();
        }
      },
      handleCollectorDomLoad: (ref: HTMLDivElement | null) => {
        this._collectorDom = ref;
      },
      setPrivilege: action((canOperate: boolean) => {
        observables.canOperate = canOperate;
      }),
    };
  }

  createToolbarUIContext() {
    const observables = observable({
      currentTool: undefined as FcrBoardTool | undefined,
      currentColor: '',
      currentShape: undefined as FcrBoardShape | undefined,
      lastPen: undefined as FcrBoardShape | undefined,
      lastShape: undefined as FcrBoardShape | undefined,
      currentStrokeWidth: 2,
      toolbarPosition: { x: 0, y: 0 },
      toolbarDockPosition: { x: 0, y: 0, placement: 'left' as const },
      toolbarReleased: true,
      redoSteps: 0,
      undoSteps: 0,
      maxCountVisibleTools: 4,
      canOperate: this.hasPrivilege,
    });
    this._toolbarContext = {
      observables,
      redo: () => {
        this._boardMainWindow?.redo();
      },
      undo: () => {
        this._boardMainWindow?.undo();
      },
      clean: () => {
        this._boardMainWindow?.clean();
      },
      setTool: action((tool: FcrBoardTool) => {
        observables.currentTool = tool;
        observables.currentShape = undefined;
        this._boardMainWindow?.selectTool(tool);
      }),
      setPen: action((shape: FcrBoardShape) => {
        observables.currentShape = shape;
        observables.lastPen = shape;
        observables.currentTool = undefined;
        this._boardMainWindow?.drawShape(
          shape,
          observables.currentStrokeWidth,
          tinycolor(observables.currentColor).toRgb(),
        );
      }),
      setShape: action((shape: FcrBoardShape) => {
        observables.currentShape = shape;
        observables.lastShape = shape;
        observables.currentTool = undefined;
        this._boardMainWindow?.drawShape(
          shape,
          observables.currentStrokeWidth,
          tinycolor(observables.currentColor).toRgb(),
        );
      }),
      setStrokeColor: action((color: string) => {
        observables.currentColor = color;
        this._boardMainWindow?.changeStrokeColor(tinycolor(color).toRgb());
      }),
      setStrokeWidth: action((strokeWidth: number) => {
        observables.currentStrokeWidth = strokeWidth;
        this._boardMainWindow?.changeStrokeWidth(strokeWidth);
      }),
      clickExpansionTool: action(() => {}),
      setToolbarPosition: action((pos: { x: number; y: number }) => {
        observables.toolbarPosition = pos;
      }),
      dragToolbar: action(() => {
        observables.toolbarReleased = false;
      }),
      releaseToolbar: action(() => {
        observables.toolbarReleased = true;
        this._calculateDockPosition();
      }),
      captureApp: () => {},
      captureScreen: () => {},
      saveDraft: () => {
        this._getSnapshotImage();
      },
    };
    return this._toolbarContext;
  }

  createScenePaginationUIContext() {
    const observables = observable({
      currentPage: 1,
      totalPage: 1,
    });

    this._paginationContext = {
      observables,
      addPage: action(() => {
        this._boardMainWindow?.addPage({ after: true });
      }),
      changePage: action((page: number) => {
        this._boardMainWindow?.setPageIndex(page - observables.currentPage);
      }),
    };

    return this._paginationContext;
  }

  @action.bound
  private _updatePageInfo(info: FcrBoardPageInfo) {
    if (this._paginationContext) {
      this._paginationContext.observables.currentPage = info.showIndex + 1;
      this._paginationContext.observables.totalPage = info.count;
    }
  }
  @action.bound
  private _updateRedo(steps: number) {
    if (this._toolbarContext) {
      this._toolbarContext.observables.redoSteps = steps;
    }
  }
  @action.bound
  private _updateUndo(steps: number) {
    if (this._toolbarContext) {
      this._toolbarContext.observables.undoSteps = steps;
    }
  }

  private _saveSnapshot(canvas: HTMLCanvasElement) {
    const fileName = `${this.classroomConfig.sessionInfo.roomName}_${dayjs().format(
      'YYYYMMDD_HHmmSSS',
    )}.jpg`;
    downloadCanvasImage(canvas, fileName);
    this.ui.addToast(transI18n('toast2.save_success'), 'success');
  }

  private _connectObservables() {
    const mainWindow = this._boardMainWindow;
    mainWindow?.on(FcrBoardMainWindowEvent.PageInfoUpdated, this._updatePageInfo);
    mainWindow?.on(FcrBoardMainWindowEvent.RedoStepsUpdated, this._updateRedo);
    mainWindow?.on(FcrBoardMainWindowEvent.UndoStepsUpdated, this._updateUndo);
    mainWindow?.on(FcrBoardMainWindowEvent.SnapshotSuccess, this._saveSnapshot);
  }

  private _calculateDockPosition() {
    if (this._toolbarContext) {
      const toolbarDom = document.querySelector('.fcr-board-toolbar');

      if (this._boardDom && toolbarDom) {
        const boardClientRect = this._boardDom.getBoundingClientRect();
        const toolbarClientRect = toolbarDom.getBoundingClientRect();
        const toolbarOffsetTop = (boardClientRect.height - toolbarDom.clientHeight) / 2;
        const centerPos = toolbarClientRect.x + toolbarClientRect.width / 2;

        if (centerPos > boardClientRect.width / 2) {
          // right
          this._toolbarContext.observables.toolbarDockPosition = {
            x: boardClientRect.width - toolbarClientRect.width,
            y: toolbarOffsetTop,
            placement: 'right',
          };
        } else {
          // left
          this._toolbarContext.observables.toolbarDockPosition = {
            x: 0,
            y: toolbarOffsetTop,
            placement: 'left',
          };
        }
      }
    }
  }

  @action.bound
  private _notifyViewportChange() {
    if (this._toolbarContext) {
      // update dock position
      const toolbarDom = document.querySelector('.fcr-board-toolbar');
      if (this._boardDom && toolbarDom) {
        const boardClientRect = this._boardDom.getBoundingClientRect();
        this._toolbarContext.observables.maxCountVisibleTools = Math.floor(
          (boardClientRect.height - 60 - 200) / 40,
        );

        const toolbarOffsetTop = (boardClientRect.height - toolbarDom.clientHeight) / 2;

        this._toolbarContext.setToolbarPosition({ x: 0, y: toolbarOffsetTop });

        this._calculateDockPosition();
      }
    }
  }

  private _resetToolIfNeed() {
    if (this.hasPrivilege && this._mounted) {
      const { strokeColor, strokeWidth, tool } = this._defaultBoardState;
      this._toolbarContext?.setStrokeColor(strokeColor);
      this._toolbarContext?.setStrokeWidth(strokeWidth);
      this._toolbarContext?.setTool(tool);
    }
  }
}
