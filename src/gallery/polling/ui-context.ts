import { createContext } from 'react';
import { PollingType, PollingInputData, PollingState, PollingResultInfo } from './type';

const pollingUIContextDefaultValue = {
  observables: {
    pollingState: PollingState.POLLING_EDIT,
    pollingType: PollingType.SINGLE,
    isOwner: false,
    question: '',
    options: [] as PollingInputData[],
    selectedOptions: new Set<number>(),
    resultInfo: undefined as PollingResultInfo | undefined,
    isActionLoading: false,
  },
  create: () => {},
  submit: () => {},
  end: () => {},
  setPollingState: (state: PollingState) => {},
  setPollingType: (type: PollingType) => {},
  setQuestion: (question: string) => {},
  setSelectedOptions: (selections: Set<number>) => {},
  addOption: () => {},
  removeOption: (id: number) => {},
  updateOption: (id: number, content: string) => {},
};

export const PollingUIContext = createContext(pollingUIContextDefaultValue);
export type PollingUIContextValue = typeof pollingUIContextDefaultValue;