import { EduApiService } from "agora-edu-core/lib/services/api";
import { PollingType } from "./type";

export enum PollingMode {
  SINGLE = 1,
  MULTI = 2,
}
export enum PollingState {
  // 2 为老师或者助教出题阶段 只可老师或者助教可见
  // 1 为中间答题阶段，不同为老师或者助教和学生的权限问题
  // 0 为最后结果展示阶段
  IDLE = 2,
  STARTED = 1,
  STOPPED = 0,
}
export type PollingDetails = {
  num: number;
  percentage: number;
};
export type PollingItems = string[];

class PollingFSM {
  mode: PollingMode = PollingMode.SINGLE;
  pollDetails: PollingDetails[] = [];
  pollId?: string;
  pollItems: PollingItems = [];
  pollState = PollingState.IDLE;
  pollTitle = '';

  constructor(private _session:{roomUuid:string,userUuid:string}, private _api : EduApiService){
    
  }
  
  update() {}



   async create()  {
    const { roomUuid } = this._session;

    
      await this._api.startPolling(roomUuid, {
        mode: observables.pollingType === PollingType.SINGLE ? 1 : 2,
        pollItems: observables.options.map(({ content }) => content),
        pollTitle: observables.question,
        position: { xaxis: 0.5, yaxis: 0.5 },
      });

  }
   async submit()  {
    const { roomUuid, userUuid } = this.classroomConfig.sessionInfo;

    context.setActionLoading(true);
    try {
      await this.classroomStore.api.submitResult(roomUuid, `${this._pollId}`, userUuid, {
        selectIndex: [],
      });
      runInAction(() => {
        observables.pollingState = PollingState.POLLING_SUBMIT_END;
      });
    } catch (e) {
      this.ui.addToast('Cannot submit poll as something is wrong', 'error');
    } finally {
      context.setActionLoading(false);
    }
  },
  end ()  {
    const { roomUuid } = this.classroomConfig.sessionInfo;

    try {
      this.classroomStore.api.stopPolling(roomUuid, `${this._pollId}`);

      runInAction(() => {
        observables.pollingState = PollingState.POLLING_SUBMIT_END;
      });
    } catch (e) {
      this.ui.addToast('Cannot submit poll as something is wrong', 'error');
    }
  },


}

export default PollingFSM;
