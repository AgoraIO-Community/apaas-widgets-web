import { action, autorun, observable, runInAction ,computed} from 'mobx';
import { AgoraHXChatWidget } from '.';
import { OrientationEnum } from './type';
import { Lodash, bound } from 'agora-rte-sdk';
import { EduRoleTypeEnum, FetchUserParam, FetchUserType } from 'agora-edu-core';
import { WebIM } from './legacy/utils/WebIM';
import { AgoraChat } from 'agora-chat';

export class WidgetChatUIStore {
  private _matchMedia = window.matchMedia('(orientation: portrait)');

  @observable
  orientation: OrientationEnum = OrientationEnum.portrait;

  @observable
  isFullSize = false;

  @observable
  showChat = false;

  /**
   * 检索字符串
   */
  @observable
  searchKeyword = '';

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
    //初始化用户成员列表
    this.resetUsersList()
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

  /**
   * 设置检索字符串
   * @param keyword
   */
  @action.bound
  setSearchKeyword(keyword: string) {
    this.searchKeyword = keyword;
  }

  /**
   * 查询下一页的参数
   */
  get fetchUsersListParams() {
    return {
      nextId: this._usersNextPageId,
      count: 10,
      type: FetchUserType.all,
      role: EduRoleTypeEnum.student,
    };
  }

  /**
   * 查询下一页的ID
   */
  @observable
  private _usersNextPageId: number | string | undefined = 0;

  /**
   * 分页查询到的用户列表
   */
  @observable
  private _usersList:any[] = [];

  /**
   * 用户列表
   */
  @computed
  get userList() {
    return [...this._usersList]
  }
  /**
   * 获取下一页的用户列表
   */
  @bound
  @Lodash.debounced(300, { trailing: true })
  fetchNextUsersList(override?: Partial<FetchUserParam>, reset?: boolean) {
    if (reset || this._usersList.length == 0) {
      //如果是重置或者没有获取过列表那么要先获取老师的信息，然后再获取学生的信息
      this._widget.classroomStore.userStore.fetchUserList({
        ...this.fetchUsersListParams,
        role: EduRoleTypeEnum.teacher,
        userName: this.searchKeyword,
      }).then(async (data: { nextId: string | number | undefined; list: []; }) => {
        //@ts-ignore
        const list = await this.getUserInfoList(data.list.map((item) => item.userProperties.widgets.easemobIM.userId))
        runInAction(() => {
          this._usersList = list
        })
      }).catch((e) => {
        runInAction(() => {
          this._usersList = []
        })
      }).finally(() => {
        //不管教师是否获取成功，都要获取学生列表
        this.fetchNextStudentList(override)
      })
    } else {
      //下一页数据，直接获取学生列表就好
      this.fetchNextStudentList(override)
    }
  }
  /**
   * 获取学生列表
   */
  private fetchNextStudentList(override?: Partial<FetchUserParam>) {
    const params = {
      ...this.fetchUsersListParams,
      ...override,
    };
    this._widget.classroomStore.userStore.fetchUserList({
      ...params,
      userName: this.searchKeyword,
    }).then(async (data: { nextId: string | number | undefined; list: ConcatArray<never>; }) => {
      //@ts-ignore
      const list = await this.getUserInfoList(data.list.map((item) => item.userProperties.widgets.easemobIM.userId))
      runInAction(() => {
        this._usersNextPageId = data.nextId;
        //@ts-ignore
        this._usersList = this._usersList.concat(list)
      });
    })
  }

  /**
   * 重置用户列表及查询条件
   */
  @action.bound
  resetUsersList() {
    this._usersNextPageId = 0;
    this.fetchNextUsersList({},true)
  }

  onKeyWordChange(data: string) {
    this.setSearchKeyword(data)
    this.fetchNextUsersList({ nextId: null }, true);
  }

  async getUserInfoList(userIdList: string[]): Promise<any[]> {
    const newArr = userIdList.reduce((acc, cur, index) => {
      const groupIndex = Math.floor(index / 100);
      if (!acc[groupIndex]) {
        acc[groupIndex] = [];
      }
      acc[groupIndex].push(cur);
      return acc;
    }, [] as string[][]);
    //@ts-ignore
    const res = await Promise.all(newArr.map((item) => WebIM.conn.fetchUserInfoById(item)));
    const newUserList: Record<string, AgoraChat.UpdateOwnUserInfoParams> = {};
    res.forEach((i: { data: unknown; }) => Object.assign(newUserList, i.data));
    return Object.keys(newUserList).map((userId) => {
      const user: AgoraChat.UpdateOwnUserInfoParams = newUserList[userId];
      return {
        avatarurl: user.avatarurl || '',
        ext: user?.ext,
        id: userId,
        nickname
          : user.nickname || '',
      };
    });
  }
}

