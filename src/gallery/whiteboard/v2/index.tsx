import { Log } from 'agora-common-libs/lib/annotation';
import { FcrBoardWidgetBase } from '../board-widget-base';
import ReactDOM from 'react-dom';
import { BoardUIContext, ScenePaginationUIContext, ToolbarUIContext } from '../ui-context';
import { App } from './app';

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
    return {
      observables: {
        visible: true,
      },
      show: () => {},
      hide: () => {},
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
