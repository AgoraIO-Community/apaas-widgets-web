import { PollingState } from '../type';
import { PollingButtonStyle } from './polling-button-group';

export const PollingButtonTextMap: {
  [key in PollingState]: {
    centerText: string;
    centerButtonStyle?: PollingButtonStyle;
  };
} = {
  [PollingState.POLLING_EDIT]: {
    centerText: 'Create Poll',
  },
  [PollingState.POLLING_END]: {
    centerText: 'End',
    centerButtonStyle: 'danger',
  },
  [PollingState.POLLING_SUBMIT]: {
    centerText: 'Submit',
  },
  [PollingState.POLLING_SUBMIT_END]: {
    centerText: '',
  },
};
