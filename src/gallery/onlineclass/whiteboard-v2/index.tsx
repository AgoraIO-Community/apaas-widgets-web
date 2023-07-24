import {
  AgoraUiCapable,
  AgoraOnlineclassSDKWidgetBase,
  AgoraWidgetLifecycle,
  AgoraOnlineclassSDKDialogWidget,
  bound,
  Lodash,
  Log,
  Logger,
  transI18n,
  FcrUIConfig,
  FcrTheme,
} from 'agora-common-libs';
import { EduRoleTypeEnum } from 'agora-edu-core/lib/type';
import type { AgoraWidgetController, EduClassroomStore } from 'agora-edu-core';
import dayjs from 'dayjs';
import ReactDOM from 'react-dom';
import { reaction, IReactionDisposer, observable, action, runInAction } from 'mobx';
import { AgoraExtensionRoomEvent, AgoraExtensionWidgetEvent } from '../../../events';
import { FcrBoardRoom } from '../../../common/whiteboard-wrapper/board-room';
import { FcrBoardMainWindow } from '../../../common/whiteboard-wrapper/board-window';
import {
  FcrBoardRegion,
  FcrBoardRoomJoinConfig,
  FcrBoardRoomEvent,
  BoardConnectionState,
  FcrBoardMainWindowEvent,
  BoardMountState,
  FcrBoardMainWindowFailureReason,
  BoardWindowAnimationOptions,
  FcrBoardPageInfo,
  FcrBoardShape,
  FcrBoardTool,
} from '../../../common/whiteboard-wrapper/type';
import { downloadCanvasImage } from '../../../common/whiteboard-wrapper/utils';
import {
  BoardUIContext,
  BoardUIContextValue,
  ScenePaginationUIContext,
  ScenePaginationUIContextValue,
  ToolbarUIContext,
  ToolbarUIContextValue,
} from './ui-context';
import { App } from './app';
import tinycolor from 'tinycolor2';
import { FcrBoardFactory } from '../../../common/whiteboard-wrapper/factory';
import {
  WINDOW_ASPECT_RATIO,
  WINDOW_MIN_SIZE,
  WINDOW_TITLE_HEIGHT,
  defaultToolsRetain,
  heightPerColor,
  heightPerTool,
  layoutContentClassName,
  sceneNavHeight,
  toolbarClassName,
  verticalPadding,
  widgetContainerClassName,
  windowClassName,
} from './utils';
import { SvgIconEnum } from '@components/svg-img';

@Log.attach({ proxyMethods: false })
export class FcrBoardWidget
  extends AgoraOnlineclassSDKWidgetBase
  implements AgoraWidgetLifecycle, AgoraOnlineclassSDKDialogWidget
{
  logger!: Logger;
  protected static _installationDisposer?: CallableFunction;
  protected static _animationOptions: BoardWindowAnimationOptions;
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

  minimizable = true;
  closeable = true;
  fullscreenable = true;
  defaultFullscreen = true;
  defaultWidth = WINDOW_MIN_SIZE.width;
  defaultHeight = WINDOW_MIN_SIZE.height;

  minimizeProperties = {
    minimizedIcon: SvgIconEnum.FCR_WHITEBOARD,
  };
  get minWidth() {
    return WINDOW_MIN_SIZE.width;
  }
  get minHeight() {
    return WINDOW_MIN_SIZE.height;
  }
  get aspectRatio() {
    return WINDOW_ASPECT_RATIO;
  }
  get aspectRatioExtraHeight() {
    return WINDOW_TITLE_HEIGHT;
  }

  get widgetName() {
    return 'netlessBoard';
  }
  get displayName() {
    return transI18n('fcr_board_display_name');
  }
  unload() {
    if (this._outerDom) {
      ReactDOM.unmountComponentAtNode(this._outerDom);
      this._outerDom = undefined;
    }
  }

  constructor(
    _widgetController: AgoraWidgetController,
    _classroomStore: EduClassroomStore,
    _ui: AgoraUiCapable,
    _uiConfig: FcrUIConfig,
    _theme: FcrTheme,
  ) {
    super(_widgetController, _classroomStore, _ui, _uiConfig, _theme);
    //@ts-ignore
    window.boardWidget = this;
  }

  onInstall(controller: AgoraWidgetController): void {
    const handleOpen = (toggle: boolean) => {
      const widgetId = this.widgetId;
      if (toggle) {
        // set the widget to be active
        controller.setWidegtActive(widgetId);
        // open the widget locally
        controller.broadcast(AgoraExtensionWidgetEvent.WidgetBecomeActive, {
          widgetId,
        });
      } else {
        // set the widget to be inactive
        controller.setWidgetInactive(widgetId);
        // close the widget locally
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

    const broadcastListeners = [
      {
        messageType: AgoraExtensionRoomEvent.SetMinimize,
        onMessage: ({ widgetId, minimized }: { widgetId: string; minimized: boolean }) => {
          if (widgetId === this.widgetId) {
            runInAction(() => {
              if (this._boardContext) {
                this._setDomVisibility(minimized);
                this._boardContext.observables.minimized = minimized;
              }
              if (!minimized) {
                setTimeout(() => {
                  if (this._boardDom && this._boardMainWindow) {
                    const aspectRatio = this._boardDom.clientHeight / this._boardDom.clientWidth;
                    this._mounted = true;
                    this._boardMainWindow
                      .mount(this._boardDom, {
                        containerSizeRatio: aspectRatio,
                        collectorContainer: this._collectorDom ?? undefined,
                      })
                      .catch(() => {
                        this._mounted = false;
                      });
                  }
                }, 300);
              } else {
                if (this._boardMainWindow) {
                  this._boardMainWindow.destroy();
                }
                this._mounted = false;
              }
            });
          }
        },
      },
      {
        messageType: AgoraExtensionRoomEvent.LayoutChanged,
        onMessage: () => {
          setTimeout(this.onViewportBoundaryUpdate);
          setTimeout(this._repositionToolbar);
        },
      },
      {
        messageType: AgoraExtensionRoomEvent.WidgetDialogBoundariesChanged,
        onMessage: ({ widgetId }: { widgetId: string }) => {
          if (widgetId === this.widgetId) {
            setTimeout(this.onViewportBoundaryUpdate);
            setTimeout(this._repositionToolbar);
          }
        },
      },
    ];

    broadcastListeners.forEach((listener) => {
      this.addBroadcastListener(listener);
    });

    this._listenerDisposer = () => {
      disposers.forEach((d) => d());
      broadcastListeners.forEach((listener) => {
        this.removeBroadcastListener(listener);
      });
    };

    this._checkBoard(props);

    this._checkPrivilege(props);
    this._disposers.push(
      reaction(
        () => this.classroomStore.roomStore.flexProps?.boardBackgroundImage,
        this._setBackgourndImage,
      ),
    );
    this.broadcast(AgoraExtensionWidgetEvent.WidgetCreated, { widgetId: this.widgetId });
  }

  onDestroy() {
    this._leave();
    this.broadcast(AgoraExtensionWidgetEvent.WidgetDestroyed, { widgetId: this.widgetId });
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

    if (_boardDom && _boardMainWindow && !this._mounted) {
      this._mounted = true;
      const aspectRatio = _boardDom.clientHeight / _boardDom.clientWidth;
      _boardMainWindow
        .mount(_boardDom, {
          containerSizeRatio: aspectRatio,
          collectorContainer: this._collectorDom ?? undefined,
        })
        .catch(() => {
          this._mounted = false;
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
  private _getSnapshotImage(background?: string) {
    const mainWindow = this._boardMainWindow;

    if (mainWindow) {
      mainWindow.getSnapshotImage(background);
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
    mainWindow.on(FcrBoardMainWindowEvent.MountSuccess, async () => {
      await mainWindow.updateOperationPrivilege(this.hasPrivilege);
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
      this.ui.addToast(transI18n('fcr_savecanvas_tips_save_successfully'));
    });
    mainWindow.on(FcrBoardMainWindowEvent.Failure, (reason) => {
      this.logger.error('operation failure, reason: ', reason);
      if (reason === FcrBoardMainWindowFailureReason.ResourceWindowAlreadyOpened) {
        this.ui.addToast(transI18n('fcr_board_resource_already_opened'), 'error');
      }
      if (reason === FcrBoardMainWindowFailureReason.SnapshotFailure) {
        this.ui.addToast(transI18n('fcr_board_snapshot_save_error'));
      }
    });
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
    }

    this.broadcast(AgoraExtensionWidgetEvent.BoardGrantedUsersUpdated, grantedUsers);
  }

  get hasPrivilege() {
    const { userUuid, role } = this.classroomConfig.sessionInfo;
    const granted = this._grantedUsers.has(userUuid);
    return [EduRoleTypeEnum.teacher, EduRoleTypeEnum.assistant].includes(role) ? true : granted;
  }

  get contentAreaSize() {
    const layoutContentDom = document.querySelector(`.${layoutContentClassName}`);

    const contentAreaSize = { width: 0, height: 0, top: 0, left: 0 };
    if (layoutContentDom) {
      const { width, height, left, top } = layoutContentDom.getBoundingClientRect();
      contentAreaSize.width = width;
      contentAreaSize.height = height;
      contentAreaSize.left = left;
      contentAreaSize.top = top;
    }

    return contentAreaSize;
  }

  onPropertiesUpdate(props: any) {
    this._checkBoard(props);
    this._checkPrivilege(props);
  }

  onUserPropertiesUpdate(userProps: any) {
    this._isInitialUser = userProps.initial;
  }

  onUninstall(controller: AgoraWidgetController) {
    if (FcrBoardWidget._installationDisposer) {
      FcrBoardWidget._installationDisposer();
    }
  }

  render(dom: HTMLElement): void {
    dom.classList.add(widgetContainerClassName);
    this._outerDom = dom;
    ReactDOM.render(
      <BoardUIContext.Provider value={this._createBoardUIContext()}>
        <ToolbarUIContext.Provider value={this._createToolbarUIContext()}>
          <ScenePaginationUIContext.Provider value={this._createScenePaginationUIContext()}>
            <App />
          </ScenePaginationUIContext.Provider>
        </ToolbarUIContext.Provider>
      </BoardUIContext.Provider>,
      dom,
    );
  }

  @bound
  onViewportBoundaryUpdate() {
    this._updateDockPosition();
  }

  private _createBoardUIContext() {
    const observables = observable({
      canOperate: this.hasPrivilege,
      minimized: false,
      contentAreaSize: this.contentAreaSize,
    });

    this._boardContext = {
      observables,
      handleDrop: (e: unknown) => {
        this.broadcast(AgoraExtensionWidgetEvent.BoardDrop, e);
      },
      handleDragOver: (e: unknown) => {
        this.broadcast(AgoraExtensionWidgetEvent.BoardDragOver, e);
      },
      handleBoardDomLoad: (ref: HTMLDivElement | null) => {
        this._boardDom = ref;

        if (this._boardDom) {
          this._setBackgourndImage();

          const resizeObserver = new ResizeObserver(this._repositionToolbar);

          resizeObserver.observe(this._boardDom);

          this._boardDomResizeObserver = resizeObserver;

          this.mount();
        } else {
          this._boardDomResizeObserver?.disconnect();
          this.unmount();
        }
      },
      handleCollectorDomLoad: (ref: HTMLDivElement | null) => {
        this._collectorDom = ref;
      },

      setPrivilege: action((canOperate: boolean) => {
        observables.canOperate = canOperate;
        if (this._toolbarContext) {
          this._toolbarContext.observables.toolbarDockPosition = {
            x: 0,
            y: 0,
            initialized: false,
            placement: 'left',
          };
        }
        // wait until the UI rerenders, then actual dimensions can be obtained
        setTimeout(this._repositionToolbar);
      }),
    };
    return this._boardContext;
  }

  private _createToolbarUIContext() {
    const observables = observable({
      currentTool: undefined as FcrBoardTool | undefined,
      currentColor: '',
      currentShape: undefined as FcrBoardShape | undefined,
      lastPen: undefined as FcrBoardShape | undefined,
      lastShape: undefined as FcrBoardShape | undefined,
      currentStrokeWidth: 2,
      toolbarPosition: { x: 0, y: 0 },
      toolbarDockPosition: { x: 0, y: 0, placement: 'left' as const, initialized: false },
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
        this._updateDockPosition();
        this._updateMaxVisibleTools();
        setTimeout(this._updateDockPosition);
      }),
      captureApp: () => {},
      captureScreen: () => {},
      saveDraft: () => {
        this._getSnapshotImage();
      },
    };
    return this._toolbarContext;
  }

  private _setDomVisibility(minimized: boolean) {
    if (minimized) {
      setTimeout(() => {
        if (this._outerDom) {
          this._outerDom.style.display = 'none';
        }
      }, 500);
    } else {
      if (this._outerDom) {
        this._outerDom.style.display = 'block';
      }
      setTimeout(this._repositionToolbar, 500);
    }
  }

  private _createScenePaginationUIContext() {
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

  private _connectObservables() {
    const mainWindow = this._boardMainWindow;
    mainWindow?.on(FcrBoardMainWindowEvent.PageInfoUpdated, this._updatePageInfo);
    mainWindow?.on(FcrBoardMainWindowEvent.RedoStepsUpdated, this._updateRedo);
    mainWindow?.on(FcrBoardMainWindowEvent.UndoStepsUpdated, this._updateUndo);
  }

  @bound
  @Lodash.throttled(200)
  private _updateDockPosition() {
    if (this._toolbarContext) {
      const toolbarDom = document.querySelector(`.${toolbarClassName}`);
      const containerDom = document.querySelector(`.${windowClassName}`);
      if (containerDom && toolbarDom) {
        const containerClientRect = containerDom.getBoundingClientRect();
        const toolbarClientRect = toolbarDom.getBoundingClientRect();
        /* scene page bar 42 px height */
        const toolbarOffsetTop = (containerClientRect.height - toolbarDom.clientHeight - 42) / 2;
        const toolbarCenterPos =
          toolbarClientRect.left - containerClientRect.left + toolbarClientRect.width / 2;
        const toolbarContext = this._toolbarContext;
        runInAction(() => {
          if (toolbarCenterPos > containerClientRect.width / 2) {
            // right
            toolbarContext.observables.toolbarDockPosition = {
              x: containerClientRect.width - toolbarClientRect.width,
              y: toolbarOffsetTop + sceneNavHeight / 2,
              placement: 'right',
              initialized: true,
            };
          } else {
            // left
            toolbarContext.observables.toolbarDockPosition = {
              x: 0,
              y: toolbarOffsetTop,
              placement: 'left',
              initialized: true,
            };
          }
        });
      }
    }
  }

  @bound
  private _updateDockPlacement() {
    if (this._toolbarContext) {
      const toolbarDom = document.querySelector(`.${toolbarClassName}`);
      const containerDom = document.querySelector(`.${windowClassName}`);
      if (containerDom && toolbarDom) {
        const containerClientRect = containerDom.getBoundingClientRect();
        const toolbarClientRect = toolbarDom.getBoundingClientRect();
        const toolbarCenterPos =
          toolbarClientRect.left - containerClientRect.left + toolbarClientRect.width / 2;
        const toolbarContext = this._toolbarContext;
        runInAction(() => {
          if (toolbarCenterPos > containerClientRect.width / 2) {
            // right
            toolbarContext.observables.toolbarDockPosition.placement = 'right';
          } else {
            // left
            toolbarContext.observables.toolbarDockPosition.placement = 'left';
          }
        });
      }
    }
  }

  @action.bound
  private _repositionToolbar() {
    if (this._toolbarContext) {
      const toolbarDom = document.querySelector(`.${toolbarClassName}`);
      const containerDom = document.querySelector(`.${windowClassName}`);

      if (containerDom && toolbarDom) {
        this._updateDockPlacement();
        this._updateMaxVisibleTools();
        // wait until the UI rerenders, then actual dimensions can be obtained
        setTimeout(this._updateDockPosition);
      }
    }
  }

  @bound
  private _updateMaxVisibleTools() {
    const containerDom = document.querySelector(`.${windowClassName}`);

    if (this._toolbarContext && containerDom) {
      const containerClientRect = containerDom.getBoundingClientRect();

      const { placement } = this._toolbarContext.observables.toolbarDockPosition;
      const toolbarContext = this._toolbarContext;
      runInAction(() => {
        if (placement === 'right') {
          const availableHeight =
            containerClientRect.height - verticalPadding - defaultToolsRetain + sceneNavHeight;
          toolbarContext.observables.maxCountVisibleTools = Math.floor(
            availableHeight / heightPerTool,
          );
          if (toolbarContext.observables.maxCountVisibleTools >= 9) {
            const visibleTools = toolbarContext.observables.maxCountVisibleTools;
            toolbarContext.observables.maxCountVisibleTools += Math.floor(
              (availableHeight - visibleTools * heightPerTool) / heightPerColor,
            );
          }
        } else {
          const availableHeight = containerClientRect.height - verticalPadding - defaultToolsRetain;
          toolbarContext.observables.maxCountVisibleTools = Math.floor(
            availableHeight / heightPerTool,
          );

          if (toolbarContext.observables.maxCountVisibleTools >= 9) {
            const visibleTools = toolbarContext.observables.maxCountVisibleTools;
            toolbarContext.observables.maxCountVisibleTools += Math.floor(
              (availableHeight - visibleTools * heightPerTool) / heightPerColor,
            );
          }
        }
      });
    }
  }

  private _resetToolIfNeed() {
    if (this.hasPrivilege && this._boardMainWindow?.mounted) {
      const { strokeColor, strokeWidth, tool } = this._defaultBoardState;
      this._toolbarContext?.setStrokeColor(strokeColor);
      this._toolbarContext?.setStrokeWidth(strokeWidth);
      this._toolbarContext?.setTool(tool);
    }
    this._boardContext?.setPrivilege(this.hasPrivilege);
  }
  @bound
  private _setBackgourndImage() {
    const imageUrl = this.classroomStore.roomStore.flexProps?.boardBackgroundImage;
    if (imageUrl && this._boardDom) {
      this._boardDom.style.background = `url(${imageUrl}) no-repeat bottom center / cover`;
    }
  }
}
