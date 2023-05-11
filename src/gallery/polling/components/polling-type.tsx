import { ButtonSize } from '@components/button';
import { PollingState } from '../type';
import { PollingButtonStyle } from './polling-button-group';

export const PollingButtonTextMap: {
  [key in PollingState]: {
    centerText: string;
    centerButtonStyle?: PollingButtonStyle;
    size?: ButtonSize;
    block?: boolean;
  };
} = {
  [PollingState.POLLING_EDIT]: {
    centerText: 'Create Poll',
    block: true,
  },
  [PollingState.POLLING_END]: {
    centerText: 'End',
    centerButtonStyle: 'danger',
    size: 'XS',
    block: true,
  },
  [PollingState.POLLING_SUBMIT]: {
    centerText: 'Submit',
    block: true,
    size: 'XS',
  },
  [PollingState.POLLING_SUBMIT_END]: {
    centerText: '',
  },
};
