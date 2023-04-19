import { Log, bound } from 'agora-common-libs/lib/annotation';
import { FcrBoardWidgetBase } from '../board-widget-base';
import ReactDOM from 'react-dom';
import {
  BoardUIContext,
  ScenePaginationUIContext,
  ScenePaginationUIContextValue,
  ToolbarUIContext,
  ToolbarUIContextValue,
} from '../ui-context';
import { App } from './app';
import {
  FcrBoardMainWindowEvent,
  FcrBoardPageInfo,
  FcrBoardShape,
  FcrBoardTool,
} from '../wrapper/type';
import { observable, action, runInAction } from 'mobx';
import tinycolor from 'tinycolor2';
import { AgoraViewportBoundaries } from 'agora-common-libs/lib/widget';
import { transI18n } from 'agora-common-libs/lib/i18n';
import dayjs from 'dayjs';
import { downloadCanvasImage } from '../wrapper/utils';

@Log.attach({ proxyMethods: false })
export class FcrBoardWidget extends FcrBoardWidgetBase {
  private _toolbarContext?: ToolbarUIContextValue;
  private _paginationContext?: ScenePaginationUIContextValue;
  private _boardDomResizeObserver?: ResizeObserver;

  locate() {
    const dom = document.querySelector('.fcr-layout-board-view');
    if (dom) {
      return dom as HTMLElement;
    }
    this.logger.info('Cannot find a proper DOM to render the FCR board widget');
  }

  render(dom: HTMLElement): void {
    super.render(dom);

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

  @bound
  mount(): void {
    super.mount();
    this._connectObservables();
  }

  @bound
  unmount(): void {
    super.unmount();
    this._disconnectObservables();
  }

  createBoardUIContext() {
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
      isMiniSize: false,
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
        this._boardMainWindow?.getSnapshotImage();
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

    runInAction(() => {
      if (this._toolbarContext) {
        const defaultStrokeColor = '#fed130';
        const defaultStrokeWidth = 2;
        const defaultTool = FcrBoardTool.Clicker;
        this._boardMainWindow?.changeStrokeColor(tinycolor(defaultStrokeColor).toRgb());
        this._toolbarContext.observables.currentColor = defaultStrokeColor;
        this._boardMainWindow?.changeStrokeWidth(defaultStrokeWidth);
        this._toolbarContext.observables.currentStrokeWidth = defaultStrokeWidth;
        this._boardMainWindow?.selectTool(defaultTool);
        this._toolbarContext.observables.currentTool = defaultTool;
      }
    });

    if (this._boardDom) {
      const resizeObserver = new ResizeObserver(this._notifyViewportChange);

      resizeObserver.observe(this._boardDom);

      this._boardDomResizeObserver = resizeObserver;
    }

    this._notifyViewportChange();
  }

  private _disconnectObservables() {
    const mainWindow = this._boardMainWindow;
    mainWindow?.off(FcrBoardMainWindowEvent.PageInfoUpdated, this._updatePageInfo);
    mainWindow?.off(FcrBoardMainWindowEvent.RedoStepsUpdated, this._updateRedo);
    mainWindow?.off(FcrBoardMainWindowEvent.UndoStepsUpdated, this._updateUndo);
    mainWindow?.off(FcrBoardMainWindowEvent.SnapshotSuccess, this._saveSnapshot);
    this._boardDomResizeObserver?.disconnect();
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

        this._toolbarContext.observables.isMiniSize = boardClientRect.height < 770;

        const toolbarOffsetTop = (boardClientRect.height - toolbarDom.clientHeight) / 2;

        this._toolbarContext.setToolbarPosition({ x: 0, y: toolbarOffsetTop });

        this._calculateDockPosition();
      }
    }
  }

  onViewportBoundaryUpdate(boundaries: AgoraViewportBoundaries): void {
    this._notifyViewportChange();
  }
}
