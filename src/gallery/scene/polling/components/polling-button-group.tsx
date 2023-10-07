import './polling-button-group.css';
import React, { useContext } from 'react';
import { PollingUIContext } from '../ui-context';
import { POLL_INPUT_MAX_COUNT, PollingState } from '../type';
import { observer } from 'mobx-react';
import { PollingIcon } from './polling-icon';
import { SvgIconEnum } from '@components/svg-img';
import { Button } from '@components/button';

import { ButtonSize } from '@components/button';
import { useI18n } from 'agora-common-libs';

export type PollingButtonType = 'add' | 'center' | 'minus';
export type PollingButtonStyle = 'danger' | 'gray';

const PollingButtonGroup: React.FC = observer(() => {
  const {
    observables: { pollingState, options, question, isActionLoading, selectedOptions },
    addOption,
    create,
    submit,
    end,
  } = useContext(PollingUIContext);
  const transI18n = useI18n();

  const PollingButtonTextMap: {
    [key in PollingState]: {
      centerText: string;
      centerButtonStyle?: PollingButtonStyle;
      size?: ButtonSize;
      block?: boolean;
    };
  } = {
    [PollingState.POLLING_EDIT]: {
      centerText: transI18n('fcr_poll_start'),
      block: true,
    },
    [PollingState.POLLING_END]: {
      centerText: transI18n('fcr_poll_end'),
      centerButtonStyle: 'danger',
      size: 'XS',
      block: true,
    },
    [PollingState.POLLING_SUBMIT]: {
      centerText: transI18n('fcr_poll_submit'),
      block: true,
      size: 'XS',
    },
    [PollingState.POLLING_SUBMIT_END]: {
      centerText: '',
    },
  };

  const isAllowedToAdd = options.length < POLL_INPUT_MAX_COUNT;
  const centerText = PollingButtonTextMap[pollingState].centerText;

  const size = PollingButtonTextMap[pollingState].size || 'S';
  const block = PollingButtonTextMap[pollingState].block || false;

  const centerBtnStyleType = PollingButtonTextMap[pollingState].centerButtonStyle;
  const isShowAddMinusBtn = pollingState == PollingState.POLLING_EDIT;
  const isAllowedToCreate =
    question &&
    !options.some(({ content }) => content === '') &&
    new Set(options.map(({ content }) => content)).size === options.length;
  const isAllowedToSubmit = !!selectedOptions.size;
  let isDisabled = false;

  switch (pollingState) {
    case PollingState.POLLING_EDIT:
      isDisabled = !isAllowedToCreate;
      break;
    case PollingState.POLLING_SUBMIT:
      isDisabled = !isAllowedToSubmit;
      break;
  }

  const innerOnClickAdd = () => {
    addOption();
  };

  const innerOnClickCenter = () => {
    if (PollingState.POLLING_EDIT === pollingState) {
      create();
    } else if (PollingState.POLLING_END === pollingState) {
      end();
    } else if (PollingState.POLLING_SUBMIT === pollingState) {
      submit();
    }
  };
  return (
    <div className="fcr-polling-btn-group">
      {isShowAddMinusBtn && (
        <PollingIcon
          onClick={innerOnClickAdd}
          disabled={!isAllowedToAdd}
          icon={SvgIconEnum.FCR_V2_POLL_ADD}></PollingIcon>
      )}

      <Button
        block={block}
        size={size}
        disabled={isDisabled}
        styleType={centerBtnStyleType}
        shape="circle"
        loading={isActionLoading}
        onClick={innerOnClickCenter}>
        {centerText}
      </Button>
    </div>
  );
});

export default PollingButtonGroup;
