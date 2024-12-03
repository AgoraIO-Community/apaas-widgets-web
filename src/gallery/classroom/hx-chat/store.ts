import { action, observable, runInAction, computed } from 'mobx';
import { AgoraHXChatWidget } from '.';
import { OrientationEnum } from './type';
import { Lodash, bound } from 'agora-common-libs';
import type { FetchUserParam } from 'agora-edu-core';
import { WebIM } from './legacy/utils/WebIM';
import { AgoraChat } from 'agora-chat';

export class WidgetChatUIStore {
  private _matchMedia = window.matchMedia('(orientation: portrait)');
  private _isFetchingList = false;

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

    let isFullSize = false;

    if (sessionInfo.roomType === 2 && isH5) {
      isFullSize = true;
    }
    //  else if (sessionInfo.roomType === 2 && isH5) {
    //   isFullSize = this.orientation === 'portrait' ? false : true;
    // }
    else {
      isFullSize = sessionInfo.roomType === 2 || sessionInfo.roomType === 0;
    }

    runInAction(() => (this.isFullSize = isFullSize));

    let isShowChat = isH5 ? true : false;

    if (sessionInfo.roomType === 2 && isH5) {
      isShowChat = true;
    }
    //  else if (sessionInfo.roomType === 2 && isH5) {
    //   isShowChat = this.orientation === 'portrait' ? false : true;
    // }
    else if ([0, 2].includes(sessionInfo.roomType)) {
      isShowChat = true;
    }

    runInAction(() => (this.showChat = isShowChat));
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
      count: 200,
      // all
      type: '0' as FetchUserParam['type'],
      // student
      role: 2,
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
  private _usersList: any[] = [];

  /**
   * 用户列表
   */
  @computed
  get userList() {
    return [...this._usersList];
  }
  /**
   * 是否有更多
   */
  @computed
  get hasMoreUsers() {
    // return (
    //   this._usersList.length % 10 == 0 && !(this._usersNextPageId == 0 || !this._usersNextPageId)
    // );
    // 单次查询200条，不再继续查询更多
    return false;
  }

  /**
   * 获取下一页的用户列表
   */
  @bound
  @Lodash.debounced(300, { trailing: true })
  async fetchNextUsersList(override?: Partial<FetchUserParam>, reset?: boolean) {
    if (this._isFetchingList) {
      return;
    }

    if (reset) {
      const list = [] as any[];

      let nextId: number|string | undefined = undefined;

      try {
        this._isFetchingList = true;

        const teacherList = await this.fetchNextListByParam(
          this.searchKeyword
            ? {
                ...this.fetchUsersListParams,
                // teacher
                role: 1,
                userName: this.searchKeyword,
              }
            : {
                ...this.fetchUsersListParams,
                // teacher
                role: 1,
              },
        );

        list.push(...teacherList.list);
      } catch (e) {
        console.error(e);
      }

      try {
        const assistantList = await this.fetchNextListByParam({
          // assistant
          role: 3,
          ...override,
        });

        list.push(...assistantList.list);
      } catch (e) {
        console.error(e);
      }

      try {
        const studentList = await this.fetchNextListByParam({
          // student
          role: 2,
          ...override,
        });

        list.push(...studentList.list);

        nextId = studentList.nextId;
      } catch (e) {
        console.error(e);
      }

      runInAction(() => {
        this._usersNextPageId = nextId;

        this._usersList = list;
      });

      this._isFetchingList = false;
    } else {
      try {
        this._isFetchingList = true;

        //下一页数据，直接获取学生列表就好
        const studentList = await this.fetchNextListByParam({
          // student
          role: 2,
          ...override,
        });

        runInAction(() => {
          this._usersNextPageId = studentList.nextId;
          //@ts-ignore
          this._usersList = this._usersList.concat(studentList.list);
        });
      } catch (e) {
        console.error(e);
      }

      this._isFetchingList = false;
    }
  }

  /**
   * 获取学生列表
   */
  private async fetchNextListByParam(override?: Partial<FetchUserParam>) {
    const params = {
      ...this.fetchUsersListParams,
      ...override,
    };

    const data: { nextId: string | number | undefined; list: any[] } =
      await this._widget.classroomStore.userStore.fetchUserList({
        ...params,
        userName: this.searchKeyword,
      });

    const list = await this.getUserInfoList(
      data.list.map((item) => item.userProperties.widgets.easemobIM.userId),
    );

    return { nextId: data.nextId, list };
  }

  /**
   * 重置用户列表及查询条件
   */
  @action.bound
  resetUsersList() {
    this._usersNextPageId = 0;
    this.fetchNextUsersList({}, true);
  }

  onKeyWordChange(data: string) {
    this.setSearchKeyword(data);
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

    const res = await Promise.all(
      newArr.map((item, index) => {
        console.log(`start fetchUserInfoById [${index}/${newArr.length}]`);
        //@ts-ignore
        return WebIM.conn.fetchUserInfoById(item);
      }),
    );

    const newUserList: Record<string, AgoraChat.UpdateOwnUserInfoParams> = {};

    res.forEach((i: { data: unknown }) => Object.assign(newUserList, i.data));

    return Object.keys(newUserList).map((userId) => {
      const user: AgoraChat.UpdateOwnUserInfoParams = newUserList[userId];

      return {
        avatarurl: user.avatarurl || '',
        ext: user?.ext,
        id: userId,
        nickname: user.nickname || '',
      };
    });
  }
}
