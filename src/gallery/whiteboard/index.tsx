import { reaction } from 'mobx';
import { Log, bound } from 'agora-common-libs/lib/annotation';
import { App } from './app';
import { FcrBoardWidgetBase } from './board-widget-base';
import ReactDOM from 'react-dom';
import { BoardUIContext } from './ui-context';

@Log.attach({ proxyMethods: false })
export class FcrBoardWidget extends FcrBoardWidgetBase {
  locate() {
    const dom = document.querySelector('.widget-slot-board');
    if (dom) {
      return dom as HTMLElement;
    }
    this.logger.info('Cannot find a proper DOM to render the FCR board widget');
  }
  render(dom: HTMLElement): void {
    super.render(dom);

    this.setBackgourndImage();

    ReactDOM.render(
      <BoardUIContext.Provider value={this.createUIContext()}>
        <App />
      </BoardUIContext.Provider>,
      dom,
    );
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
    const imageUrl = this.classroomStore.roomStore.flexProps?.backgroundImage;
    if (imageUrl && this._outerDom) {
      this._outerDom.style.background = `url(${imageUrl}) no-repeat bottom center / cover`;
    }
  }

  onCreate(props: any, userProps: any): void {
    super.onCreate(props, userProps);
    this._disposers.push(
      reaction(
        () => this.classroomStore.roomStore.flexProps?.backgroundImage,
        this.setBackgourndImage,
      ),
    );
  }
}
