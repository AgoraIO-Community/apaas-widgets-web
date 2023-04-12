import { Log } from 'agora-common-libs/lib/annotation';
import { FcrBoardWidgetBase } from '../board-widget-base';
import ReactDOM from 'react-dom';
import { BoardUIContext, ScenePaginationUIContext, ToolbarUIContext } from '../ui-context';
import { App } from './app';
import { FcrBoardShape, FcrBoardTool } from '../wrapper/type';
import { observable, action } from 'mobx';
import tinycolor from 'tinycolor2';

@Log.attach({ proxyMethods: false })
export class FcrBoardWidget extends FcrBoardWidgetBase {
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
      toolbarDockPosition: { x: 0, y: 0 },
      toolbarReleased: true,
      canRedo: false,
      canUndo: false,
    });
    this._connectToolbarState(observables);
    return {
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
      setToolbarDockPosition: action((pos: { x: number; y: number }) => {
        observables.toolbarDockPosition = pos;
      }),
      dragToolbar: action(() => {
        observables.toolbarReleased = false;
      }),
      releaseToolbar: action(() => {
        observables.toolbarReleased = true;
      }),
      captureApp: () => {},
      captureScreen: () => {},
      saveDraft: () => {},
    };
  }

  createScenePaginationUIContext() {
    return {
      observables: {
        visible: true,
      },
      show: () => {},
      hide: () => {},
    };
  }

  private _connectToolbarState(state: any) {}

  private _connectPaginationState() {}
}
