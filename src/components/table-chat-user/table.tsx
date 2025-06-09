import React, { useState, useCallback } from 'react';
import { Table } from '../table';
import loadingSrc from '../table-chat-user/assets/loading.gif';
import userChatListEmptySrc from '../table-chat-user/assets/user_chat_list_empty.svg';
import { debounce } from 'lodash';
import { useI18n } from 'agora-common-libs';
import { Operation, Profile, SupportedFunction } from '.';
import { ROLE } from '../../gallery/classroom/hx-chat/legacy/contants';
import avatarUrl from '../../gallery/classroom/hx-chat/legacy/themes/img/avatar-big@2x.png';
import muteNo from '../../gallery/classroom/hx-chat/legacy/themes/img/muteNo.png';
import muteOff from '../../gallery/classroom/hx-chat/legacy/themes/img/muteOff.png';
import { Tag, Tooltip } from 'antd';

type RosterTableProps = {
  roomUserList: Profile[];
  muteList: [];
  apis: any;
  functions?: Array<SupportedFunction>;
  onActionClick?: (operation: Operation, profile: Profile) => void;
};

type InfiniteScrollRosterTableProps = {
  hasMore: boolean;
  keyword: string;
  onFetch: () => void;
  onScroll: (e: unknown) => void;
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

const HighlightText: React.FC<{ text: string; keyword: string }> = ({ text, keyword }) => {
  const parts = text.split(new RegExp(`(${keyword})`, 'i'));
  const highlightedParts = parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <span key={index} style={{ color: '#357BF6' }}>
          {part}
        </span>
      );
    }
    return part;
  });
  return <div>{highlightedParts}</div>;
};

export const InfiniteScrollRosterTable: React.FC<InfiniteScrollRosterTableProps> = ({
  roomUserList = [],
  muteList = [],
  apis,
  onFetch,
  hasMore = false,
  keyword,
  onScroll: onScrollProp,
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
      {transI18n('fcr_chat_no_more_data')}
    </p>
  );

  const handleScroll = useCallback(
    (e: unknown) => {
      onScroll(e);
      onScrollProp && onScrollProp(e);
    },
    [onScroll],
  );

  return roomUserList.length == 0 ? (
    <div
      style={{
        display: 'flex',
        alignItems: 'center', // 垂直居中
        justifyContent: 'center', // 水平居中
        height: '80%', // 使用视口高度单位使容器占据整个视口的高度
      }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <img src={userChatListEmptySrc} style={{ width: 90, height: 65 }} />
        </div>
        <div
          style={{ fontSize: '12px', color: '#7B88A0', paddingTop: '15px', textAlign: 'center' }}>
          {transI18n('fcr_chat_user_list_empty')}
        </div>
      </div>
    </div>
  ) : (
    <Table
      className="table-container"
      onScroll={handleScroll}
      style={{ height: '88%', flexGrow: 1 }}>
      {
        // eslint-disable-next-line react/prop-types
        roomUserList &&
          roomUserList.length > 0 &&
          // eslint-disable-next-line react/prop-types
          roomUserList.map((item, key) => {
            const showMuteIcon = muteList && muteList.includes(item.id);
            const isTeacher = item?.ext && JSON.parse(item?.ext).role === ROLE.teacher.id;
            const isAssistant = item?.ext && JSON.parse(item?.ext).role === ROLE.assistant.id;

            return (
              <div className="fcr-hx-user-list" key={key} style={{ width: '100%' }}>
                <div className="fcr-hx-user-info" style={{ width: '100%', display: 'flex' }}>
                  <img
                    src={item?.avatarurl || avatarUrl}
                    className="fcr-hx-user-avatar"
                    style={{ flexShrink: 0, marginLeft: '10px' }}
                  />
                  <span
                    className="fcr-hx-user-text"
                    title={item?.nickname || item?.id}
                    style={{ flexGrow: 1 }}>
                    <HighlightText text={item?.nickname || item?.id} keyword={keyword} />
                  </span>
                  {isTeacher && (
                    <Tag
                      className="fcr-hx-user-tag fcr-hx-teacher-tag"
                      style={{ marginRight: 0, flexShrink: 0 }}>
                      <span className="fcr-hx-teacher-text">{transI18n('chat.teacher')}</span>
                    </Tag>
                  )}
                  {isAssistant && (
                    <Tag
                      className="fcr-hx-user-tag fcr-hx-teacher-tag"
                      style={{ marginRight: 0, flexShrink: 0 }}>
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
