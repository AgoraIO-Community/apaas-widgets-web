import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import PollingButtonGroup from './components/polling-button-group';
import PollingResultList from './components/polling-result-list';
import PollingInputList from './components/polling-input-list';
import './index.css';
import { TextArea } from '@components/textarea';
import { Radio, RadioGroup } from '@components/radio';
import { observer } from 'mobx-react';
import { PollingState, PollingType } from './type';
import { PollingUIContext } from './ui-context';
import classnames from 'classnames';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ToolTip } from '@components/tooltip';
import { useI18n } from 'agora-common-libs';
import { EduToolDialog } from '../common/dialog/base';
import { FcrPollingWidget } from '.';

type ActionIcon = {
  icon: SvgIconEnum;
  iconColor?: string;
  onClick: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseUp?: (e: React.MouseEvent) => void;
  disable?: boolean;
  tooltipContent?: string;
};
const PollingQuestion: React.FC = observer(() => {
  const {
    setQuestion,
    setPollingType,
    observables: { question, pollingState, resultInfo, isOwner },
  } = useContext(PollingUIContext);
  const onInputChange = (val: string) => {
    setQuestion(val);
  };

  const onClikSingleMuti = (value: PollingType) => {
    setPollingType(value);
  };

  const isInput = useMemo(() => pollingState == PollingState.POLLING_EDIT, [pollingState]);
  const showProgressLabel = !isOwner;
  const progressStatus = pollingState === PollingState.POLLING_SUBMIT_END ? 'ended' : 'in-progress';
  const transI18n = useI18n();
  return (
    <div className="fcr-polling-question">
      <div className="fcr-polling-title">
        {transI18n('fcr_poll_title')}
        {showProgressLabel && (
          <div
            className={classnames(
              'fcr-polling-title-label',
              `fcr-polling-title-label-${progressStatus}`,
            )}>
            {progressStatus === 'ended'
              ? transI18n('fcr_poll_state_ended')
              : transI18n('fcr_poll_state_in_progress')}
          </div>
        )}
      </div>
      {isInput ? (
        <>
          <div className="fcr-polling-question-hint fcr-drag-cancel">
            {transI18n('fcr_poll_input_placeholder')}
          </div>
          <div className="fcr-polling-input">
            <TextArea
              placeholder={transI18n('fcr_poll_enter_placeholder')}
              maxCount={100}
              value={question}
              onChange={onInputChange}
            />
          </div>

          <div className="fcr-polling-check">
            <RadioGroup
              defaultValue={PollingType.SINGLE}
              onChange={(value) => {
                onClikSingleMuti(value as PollingType);
              }}>
              <Radio value={PollingType.SINGLE} label={transI18n('fcr_poll_single')}></Radio>
              <Radio value={PollingType.MULTI} label={transI18n('fcr_poll_multi')}></Radio>
            </RadioGroup>
          </div>
        </>
      ) : (
        <div className="fcr-polling-question-hint">{resultInfo?.question}</div>
      )}
    </div>
  );
});

const PollingList: React.FC = observer(() => {
  const {
    observables: { pollingState, isOwner, selectIndex, isAudience },
  } = useContext(PollingUIContext);
  const showButtonGroup =
    !isAudience &&
    (isOwner
      ? PollingState.POLLING_SUBMIT_END !== pollingState
      : !selectIndex && PollingState.POLLING_SUBMIT_END !== pollingState);
  return (
    <div className="fcr-polling-list-container">
      {PollingState.POLLING_EDIT === pollingState ? <PollingInputList /> : <PollingResultList />}
      {showButtonGroup && <PollingButtonGroup />}
    </div>
  );
});

export const Polling: React.FC<{ widget: FcrPollingWidget }> = observer(({ widget }) => {
  const {
    observables: { pollingState, canClose },
  } = useContext(PollingUIContext);
  const pollingStateRef = useRef(pollingState);
  const transI18n = useI18n();
  const closeDisable = pollingState === PollingState.POLLING_END;
  useEffect(() => {
    if (
      (widget.isStudent || widget.isAudience) &&
      pollingStateRef.current === PollingState.POLLING_SUBMIT &&
      pollingState === PollingState.POLLING_SUBMIT_END
    ) {
      widget.ui.addToast(transI18n('fcr_poll_tips_end_poll'));
    }
    pollingStateRef.current = pollingState;
  }, [pollingState]);
  return (
    <EduToolDialog
      widget={widget}
      showMinimize
      minimizeProps={{
        tooltipContent: transI18n('fcr_poll_minimization'),
      }}
      showClose={canClose}
      closeProps={{
        disabled: closeDisable,
        tooltipContent: closeDisable
          ? transI18n('fcr_poll_unable_to_close')
          : transI18n('fcr_poll_close'),
      }}>
      <>
        <PollingQuestion />
        <PollingList />
      </>
    </EduToolDialog>
  );
});
