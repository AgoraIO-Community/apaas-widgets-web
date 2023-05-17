import React, { useContext, useMemo } from 'react';
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
  return (
    <div className="fcr-polling-question">
      <div className="fcr-polling-title">
        {'Polling'}
        {showProgressLabel && (
          <div
            className={classnames(
              'fcr-polling-title-label',
              `fcr-polling-title-label-${progressStatus}`,
            )}>
            {progressStatus === 'ended' ? 'Ended' : 'In Progress'}
          </div>
        )}
      </div>
      {isInput ? (
        <>
          <div className="fcr-polling-question-hint fcr-drag-cancel">Please set the question.</div>
          <div className="fcr-polling-input">
            <TextArea
              placeholder="Please Enter..."
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
              <Radio value={PollingType.SINGLE} label="Single"></Radio>
              <Radio value={PollingType.MULTI} label="Muti-select"></Radio>
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
    observables: { pollingState, isOwner, selectIndex },
  } = useContext(PollingUIContext);
  const showButtonGroup = isOwner
    ? PollingState.POLLING_SUBMIT_END !== pollingState
    : !selectIndex && PollingState.POLLING_SUBMIT_END !== pollingState;
  return (
    <div className="fcr-polling-list-container">
      {PollingState.POLLING_EDIT === pollingState ? <PollingInputList /> : <PollingResultList />}
      {showButtonGroup && <PollingButtonGroup />}
    </div>
  );
});

export const Polling: React.FC = () => {
  return (
    <React.Fragment>
      <PollingQuestion />
      <PollingList />
    </React.Fragment>
  );
};
