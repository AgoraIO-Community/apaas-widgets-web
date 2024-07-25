import { Tag, Tooltip } from 'antd';
import { ROLE } from '../../contants';
import { transI18n } from 'agora-common-libs';
import avatarUrl from '../../themes/img/avatar-big@2x.png';
import muteNo from '../../themes/img/muteNo.png';
import muteOff from '../../themes/img/muteOff.png';
import './index.css';
import { useShallowEqualSelector } from '../../utils';
import { Search } from '../../../../../../components/input';
import { SvgIconEnum, SvgImg } from '../../../../../../components/svg-img';
import { Table } from '../../../../../../components/table';

// 成员页面
// eslint-disable-next-line react/prop-types
export const UserList = ({ roomUserList, onKeywordChange,keyword }) => {
  const { apis, muteList } = useShallowEqualSelector((state) => {
    return {
      apis: state.apis,
      muteList: state?.room.muteList,
    };
  });
  // 禁言
  const mute = (val, userId) => {
    if (val) {
      apis.muteAPI.removeUserMute(userId);
    } else {
      apis.muteAPI.setUserMute(userId);
    }
  };

  return (
    <div className="fcr-hx-user">
      <div>
        <Search
          value={keyword}
          onSearch={onKeywordChange}
          prefix={<SvgImg type={SvgIconEnum.SEARCH} />}
          inputPrefixWidth={32}
          placeholder={transI18n('scaffold.search')}
        />
      </div>
      <Table className="roster-table">
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
      </Table>
    </div>
  );
};
