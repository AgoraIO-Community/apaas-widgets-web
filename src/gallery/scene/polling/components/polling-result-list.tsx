import './polling-result-list.css';
import React, { useContext } from 'react';
import classnames from 'classnames';

import { PollingUIContext } from '../ui-context';
import { observer } from 'mobx-react';
import { PollingState } from '../type';
import './polling-result-list.css';
import { useI18n } from 'agora-common-libs';

const PollingResultList: React.FC = observer(() => {
  const {
    observables: {
      resultInfo,
      selectedOptions,
      isOwner,
      pollingState,
      selectIndex,
      userCount,
      isAudience,
    },
    setSelectedOptions,
  } = useContext(PollingUIContext);
  const transI18n = useI18n();

  // single or muti
  const onClickItem = (index: number) => {
    if (!resultInfo || isAudience || isOwner || pollingState === PollingState.POLLING_SUBMIT_END) {
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
        const showPercent = !!selectIndex || isOwner || isAudience;
        return (
          <div
            key={item.id}
            onClick={() => {
              !isOwner && !selectIndex && onClickItem(index);
            }}
            style={{ cursor: selectIndex || isOwner ? 'default' : 'pointer' }}
            className={classnames('fcr-polling-result-item', {
              'fcr-polling-result-item-selected': selected && !selectIndex,
            })}>
            {showPercent && (
              <div
                style={{
                  width: `${showPercent ? item.percent * 100 : 100}%`,
                }}
                className={classnames('fcr-polling-result-progress', {
                  'fcr-polling-result-progress-selected': selected,
                })}
              />
            )}
            <div className="fcr-polling-result-progress-text">
              <div>
                <pre>{item.content}</pre>
              </div>
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

      {PollingState.POLLING_SUBMIT === pollingState && !selectIndex && !isAudience ? (
        <div className={classnames('fcr-polling-result-person-count', 'fcr-polling-result-center')}>
          {resultInfo.isMuti ? transI18n('fcr_poll_multi') : transI18n('fcr_poll_single')}
        </div>
      ) : (
        <div className="fcr-polling-result-person-count">
          {userCount} {transI18n('fcr_poll_people_participated')}
        </div>
      )}
    </>
  );
});

export default PollingResultList;
