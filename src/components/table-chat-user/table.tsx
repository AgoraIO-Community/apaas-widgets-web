import React, { useState, useCallback } from 'react';
import { Table } from '../table';
import loadingSrc from '../table-chat-user/assets/loading.gif';
import { debounce } from 'lodash';
import { useI18n } from 'agora-common-libs';
import { Operation, Profile, SupportedFunction} from '.';
import { ROLE } from '../../gallery/classroom/hx-chat/legacy/contants';
import avatarUrl from '../../gallery/classroom/hx-chat/legacy/themes/img/avatar-big@2x.png';
import muteNo from '../../gallery/classroom/hx-chat/legacy/themes/img/muteNo.png';
import muteOff from '../../gallery/classroom/hx-chat/legacy/themes/img/muteOff.png';
import { Tag, Tooltip } from 'antd';
import { useShallowEqualSelector } from '../../gallery/classroom/hx-chat/legacy/utils';


type RosterTableProps = {
  roomUserList: Profile[];
  muteList: [];
  apis:any;
  functions?: Array<SupportedFunction>;
  onActionClick?: (operation: Operation, profile: Profile) => void;
};

type InfiniteScrollRosterTableProps = {
  hasMore: boolean;
  onFetch: () => void;
} & RosterTableProps;

const config = {
  thresholdDistance: 50,
};

const useLoadMore = (onLoadMore: () => void, hasMore: boolean) => {
  const [loading, setLoading] = useState(false);
  const onScroll = useCallback(
    debounce(async (event) => {
      const { clientHeight, scrollHeight, scrollTop } = event.target;

      const distanceToBottom = scrollHeight - clientHeight - scrollTop;

      const thresholdToHit = config.thresholdDistance;

      const hitThreshold = distanceToBottom <= thresholdToHit;
      if (hitThreshold) {
        if (loading || !hasMore) return;
        setLoading(true);
        try {
          await onLoadMore();
        } finally {
          setLoading(false);
        }
      }
    }, 300),
    [hasMore],
  );

  return {
    onScroll,
    loading,
  };
};

export const InfiniteScrollRosterTable: React.FC<InfiniteScrollRosterTableProps> = ({
  roomUserList = [],
  muteList = [],
  apis,
  onFetch,
  hasMore = false,
}) => {
  // 禁言
  const mute = (val: boolean, userId: never) => {
    if (val) {
      apis.muteAPI.removeUserMute(userId);
    } else {
      apis.muteAPI.setUserMute(userId);
    }
  };
  const transI18n = useI18n();
  const { onScroll } = useLoadMore(onFetch, hasMore);
  const loader = (
    <img
      className="fcr-mx-auto"
      src={loadingSrc}
      style={{ width: 32, marginLeft: 'auto', marginRight: 'auto' }}
    />
  );
  const noMore = (
    <p
      className="fcr-py-3"
      style={{ textAlign: 'center', fontSize: 13, color: '#7B88A0', padding: '10px 0' }}>
      {transI18n('roster.no_more_data')}
    </p>
  );

  return (
    <Table className="table-container" onScroll={onScroll}>
      {
          // eslint-disable-next-line react/prop-types
          roomUserList && roomUserList.length > 0 &&
          // eslint-disable-next-line react/prop-types
          roomUserList.map((item, key) => {
            const showMuteIcon = muteList && muteList.includes(item.id);
            const isTeacher = item?.ext && JSON.parse(item?.ext).role === ROLE.teacher.id;
            const isAssistant = item?.ext && JSON.parse(item?.ext).role === ROLE.assistant.id;
            return (
              <div className="fcr-hx-user-list" key={key}>
                <div className="fcr-hx-user-info">
                  <img src={item?.avatarurl || avatarUrl} className="fcr-hx-user-avatar" />
                  <span className="fcr-hx-user-text" title={item?.nickname || item?.id}>
                    {item?.nickname || item?.id}
                  </span>
                  {isTeacher && (
                    <Tag className="fcr-hx-user-tag fcr-hx-teacher-tag">
                      <span className="fcr-hx-teacher-text">{transI18n('chat.teacher')}</span>
                    </Tag>
                  )}
                  {isAssistant && (
                    <Tag className="fcr-hx-user-tag fcr-hx-teacher-tag">
                      <span className="fcr-hx-teacher-text">{transI18n('chat.assistant')}</span>
                    </Tag>
                  )}
                </div>
                {!isTeacher && !isAssistant && (
                  <Tooltip
                    placement="leftBottom"
                    overlay={
                      muteList.includes(item.id)
                        ? `${transI18n('chat.remove_mute')}`
                        : `${transI18n('chat.mute')}`
                    }>
                    <div className="fcr-hx-mute-icon">
                      <img
                        src={showMuteIcon ? muteOff : muteNo}
                        onClick={() => {
                          mute(showMuteIcon, item.id);
                        }}
                      />
                    </div>
                  </Tooltip>
                )}
              </div>
            );
          })
        }
      {hasMore && loader}
      {!hasMore && noMore}
    </Table>
  );
};
