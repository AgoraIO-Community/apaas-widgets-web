import './polling-result-list.css';
import React, { useContext } from 'react';
import classnames from 'classnames';

import { PollingUIContext } from '../ui-context';
import { observer } from 'mobx-react';
import { PollingState } from '../type';
import './polling-result-list.css';

const PollingResultList: React.FC = observer(() => {
  const {
    observables: { resultInfo, selectedOptions, isOwner, pollingState, selectIndex, userCount },
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
      {resultInfo.optionList.map((item, index) => {
        const selected = selectIndex?.includes(item.id) || selectedOptions.has(item.id);
        const showPercent = selectIndex || isOwner;
        return (
          <div
            key={item.id}
            onClick={() => {
              !isOwner && !selectIndex && onClickItem(index);
            }}
            style={{ cursor: selectIndex || isOwner ? 'default' : 'pointer' }}
            className={classnames('fcr-polling-result-item', {
              'fcr-polling-result-item-selected': selected,
            })}>
            <div
              style={{
                width: `${selectIndex || isOwner ? item.percent * 100 : 100}%`,
              }}
              className={classnames('fcr-polling-result-progress', {
                'fcr-polling-result-progress-selected': selected,
              })}
            />
            <div className="fcr-polling-result-progress-text">
              <div>{item.content}</div>
              {showPercent && (
                <>
                  <div className="fcr-polling-result-count">{item.selectCount}</div>
                  <div className="fcr-polling-result-precent">
                    {parseInt((item.percent * 100).toFixed(2))}%
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}

      {PollingState.POLLING_SUBMIT === pollingState && !selectIndex ? (
        <div className={classnames('fcr-polling-result-person-count', 'fcr-polling-result-center')}>
          {resultInfo.isMuti ? 'Muti-select' : 'Single'}
        </div>
      ) : (
        <div className="fcr-polling-result-person-count">{userCount} people participated</div>
      )}
    </>
  );
});

export default PollingResultList;
