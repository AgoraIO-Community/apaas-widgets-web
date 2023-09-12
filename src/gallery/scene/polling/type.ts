export enum PollingType {
  SINGLE = 'SINGLE',
  MULTI = 'MULTI',
}

export const POLL_INPUT_MIN_COUNT = 2;
export const POLL_INPUT_MAX_COUNT = 5;

export interface PollingInputData {
  id: number;
  content: string;
}

export const enum PollingState {
  POLLING_EDIT,
  POLLING_END,
  POLLING_SUBMIT,
  POLLING_SUBMIT_END,
}

export type PollingCreateData = {
  question: string;
  isMuti: boolean;
  list?: PollingInputData[];
};

export type PollingResultInfo = {
  isMuti: boolean;
  question: string;
  optionList: {
    id: number;
    content: string;
    selectCount: number;
    percent: number;
  }[];
  total: number;
};
