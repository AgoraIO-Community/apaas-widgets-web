/* eslint-disable react/prop-types */
import { transI18n } from 'agora-common-libs';
import './index.css';
import { useShallowEqualSelector } from '../../utils';
import { Search } from '../../../../../../components/input-search-chat';
import { SvgIconEnum, SvgImg } from '../../../../../../components/svg-img';
import { InfiniteScrollRosterTable } from '../../../../../../components/table-chat-user';

// 成员页面
// eslint-disable-next-line react/prop-types
export const UserList = ({
  roomUserList,
  onKeywordChange,
  keyword,
  hasMoreUsers,
  fetchNextUsersList,
  onScroll,
}) => {
  const { apis, muteList } = useShallowEqualSelector((state) => {
    return {
      apis: state.apis,
      muteList: state?.room.muteList,
    };
  });

  return (
    <div className="fcr-hx-user" style={{ display: 'flex', flexDirection: 'column' }}>
      <div>
        <Search
          value={keyword}
          onSearch={(data) => {
            keyword = data;
            onKeywordChange(data);
          }}
          prefix={<SvgImg type={SvgIconEnum.SEARCH} />}
          inputPrefixWidth={32}
          placeholder={transI18n('fcr_chat_search')}
        />
      </div>
      <InfiniteScrollRosterTable
        roomUserList={roomUserList}
        apis={apis}
        keyword={keyword}
        muteList={muteList}
        hasMore={hasMoreUsers}
        onFetch={fetchNextUsersList}
        onScroll={onScroll}
      />
      {/* <Table className="roster-table">
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
                        onClick={(e) => {
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
      </Table> */}
    </div>
  );
};
