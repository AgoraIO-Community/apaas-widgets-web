import { createContext } from 'react';
import { PollingType, PollingInputData, PollingState, PollingResultInfo } from './type';

const pollingUIContextDefaultValue = {
  observables: {
    pollingState: PollingState.POLLING_EDIT,
    pollingType: PollingType.SINGLE,
    isOwner: false,
    isAudience: false,
    question: '',
    options: [] as PollingInputData[],
    selectedOptions: new Set<number>(),
    selectIndex: null as null | number[],
    resultInfo: undefined as PollingResultInfo | undefined,
    isActionLoading: false,
    minimize: false,
    userCount: 0,
    canClose: false,
  },
  create: () => {},
  submit: () => {},
  end: () => {},
  setMinimize: (minimize: boolean) => {},

  setPollingState: (state: PollingState) => {},
  setPollingType: (type: PollingType) => {},
  setQuestion: (question: string) => {},
  setSelectedOptions: (selections: Set<number>) => {},
  addOption: () => {},
  removeOption: (id: number) => {},
  updateOption: (id: number, content: string) => {},
  onClose: () => {},
  onMinimize: (minimize: boolean) => {},
};

export const PollingUIContext = createContext(pollingUIContextDefaultValue);
export type PollingUIContextValue = typeof pollingUIContextDefaultValue;
