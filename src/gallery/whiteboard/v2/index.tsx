import { Log } from 'agora-common-libs/lib/annotation';
import { FcrBoardWidgetBase } from '../board-widget-base';
import ReactDOM from 'react-dom';
import { BoardUIContext, ScenePaginationUIContext, ToolbarUIContext } from '../ui-context';
import { App } from './app';
import { FcrBoardShape, FcrBoardTool } from '../wrapper/type';
import { observable, action, runInAction } from 'mobx';

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
      currentTool: FcrBoardTool.Clicker,
      currentColor: '',
      currentShape: FcrBoardShape.Straight,
      toolbarPosition: { x: 0, y: 0 },
      toolbarDockPosition: { x: 0, y: 0 },
      toolbarReleased: true,
    });
    return {
      observables,
      redo: () => {},
      undo: () => {},
      setTool: () => {},
      setShape: () => {},
      setStrokeColor: () => {},
      setStrokeWith: () => {},
      clickExpansionTool: () => {},
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
}
