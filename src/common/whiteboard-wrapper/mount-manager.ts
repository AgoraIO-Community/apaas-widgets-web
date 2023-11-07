import { Log } from 'agora-common-libs';
import { observable, action } from 'mobx';
@Log.attach()
export class BoardMountManager {
  @observable
  static isMounting = false;
  @action
  static setIsMounting(isMounting: boolean) {
    BoardMountManager.isMounting = isMounting;
  }
}
