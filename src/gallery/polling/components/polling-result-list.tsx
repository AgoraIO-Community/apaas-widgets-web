import './polling-result-list.css';
import React, { useContext } from 'react';
import classnames from 'classnames';

import { PollingUIContext } from '../ui-context';
import { observer } from 'mobx-react';
import { PollingState } from '../type';
import './polling-result-list.css';

const PollingResultList: React.FC = observer(() => {
  const {
    observables: { resultInfo, selectedOptions, isOwner, pollingState },
    setSelectedOptions,
  } = useContext(PollingUIContext);

  // single or muti
  const onClickItem = (index: number) => {
    if (!resultInfo || isOwner || pollingState === PollingState.POLLING_SUBMIT_END) {
      return;
    }
    if (resultInfo.isMuti) {
      const next = new Set(selectedOptions);
      if (selectedOptions.has(index)) {
        next.delete(index);

        setSelectedOptions(next);
      } else {
        next.add(index);

        setSelectedOptions(next);
      }
    } else {
      if (selectedOptions.has(index)) {
        const next = new Set(selectedOptions);

        next.delete(index);

        setSelectedOptions(next);
      } else {
        setSelectedOptions(new Set([index]));
      }
    }
  };

  if (!resultInfo) {
    return null;
  }

  return (
    <>
      {resultInfo.optionList.map((item, index) =>
        isOwner == true ? (
          <div key={index} className="fcr-polling-result-item">
            <div
              style={{
                width: parseInt((item.percent * 100).toFixed(2)) + '%',
              }}
              className={classnames(
                'fcr-polling-result-progress',
                selectedOptions.has(item.id) ? 'fcr-polling-result-progress-select' : '',
              )}></div>
            <div className="fcr-polling-result-progress-text">
              <div
                style={{
                  flex: 1,
                }}>
                {item.content}
              </div>
              <div className="fcr-polling-result-count">{item.selectCount}</div>
              <div className="fcr-polling-result-precent">
                {parseInt((item.percent * 100).toFixed(2))}%
              </div>
            </div>
          </div>
        ) : (
          <div
            key={index}
            onClick={() => {
              onClickItem(index);
            }}
            className="fcr-polling-result-item">
            <div
              style={{
                width: '100%',
              }}
              className={classnames(
                'fcr-polling-result-progress',
                selectedOptions.has(index) ? 'fcr-polling-result-progress-select' : '',
              )}
            />
            <div className="fcr-polling-result-progress-text">
              <div
                style={{
                  flex: 1,
                }}>
                {item.content}
              </div>
            </div>
          </div>
        ),
      )}

      {PollingState.POLLING_SUBMIT === pollingState ? (
        <div className={classnames('fcr-polling-result-person-count', 'fcr-polling-result-center')}>
          {resultInfo.isMuti ? 'Muti-select' : 'Single'}
        </div>
      ) : (
        <div className="fcr-polling-result-person-count">
          {resultInfo.total} people participated
        </div>
      )}
    </>
  );
});

export default PollingResultList;
