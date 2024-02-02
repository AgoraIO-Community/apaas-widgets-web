import { action, autorun, observable, runInAction } from 'mobx';
import { AgoraHXChatWidget } from '.';
import { OrientationEnum } from './type';

export class WidgetChatUIStore {
  private _matchMedia = window.matchMedia('(orientation: portrait)');

  @observable
  orientation: OrientationEnum = OrientationEnum.portrait;

  @observable
  isFullSize = false;

  @observable
  showChat = false;

  constructor(private _widget: AgoraHXChatWidget) {
    const { sessionInfo, platform } = _widget.classroomConfig;
    const isH5 = platform === 'H5';
    this.handleOrientationchange();
    autorun(() => {
      let isFullSize = false;
      if (sessionInfo.roomType === 2 && isH5) {
        isFullSize = true;
      } else if (sessionInfo.roomType === 2 && isH5) {
        isFullSize = this.orientation === 'portrait' ? false : true;
      } else {
        isFullSize = sessionInfo.roomType === 2 || sessionInfo.roomType === 0;
      }
      runInAction(() => (this.isFullSize = isFullSize));
    });

    autorun(() => {
      let isShowChat = isH5 ? true : false;

      if (sessionInfo.roomType === 2 && isH5) {
        isShowChat = true;
      } else if (sessionInfo.roomType === 2 && isH5) {
        isShowChat = this.orientation === 'portrait' ? false : true;
      } else if ([0, 2].includes(sessionInfo.roomType)) {
        isShowChat = true;
      }
      runInAction(() => (this.showChat = isShowChat));
    });
  }

  @action.bound
  handleOrientationchange() {
    // If there are matches, we're in portrait
    if (this._matchMedia.matches) {
      // Portrait orientation
      this.orientation = OrientationEnum.portrait;
    } else {
      // Landscape orientation
      this.orientation = OrientationEnum.landscape;
    }
  }

  addOrientationchange = () => {
    this._matchMedia.addListener(this.handleOrientationchange);
    this.handleOrientationchange();
  };

  removeOrientationchange = () => {
    this._matchMedia.removeListener(this.handleOrientationchange);
  };
}
