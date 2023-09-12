import { Input } from '@components/input';
import './index.css';
import { observer } from 'mobx-react';
import { useStore } from '../../../hooks/useStore';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { Button } from '@components/button';
import { useMute } from '../../../hooks/useMute';
import { Avatar } from '@components/avatar';
import { useState } from 'react';
import { AgoraIMUserInfo, AgoraIMUserInfoExt } from ' ../../src/common/im/wrapper/typs';
import { useI18n } from 'agora-common-libs';
export const FcrChatMemberContainer = () => {
  return (
    <div className="fcr-chatroom-member-container">
      <SearchInput></SearchInput>
      <UserList></UserList>
    </div>
  );
};

const UserList = observer(() => {
  const {
    userStore: { searchUserList },
  } = useStore();
  const transI18n = useI18n();

  return (
    <div className="fcr-chatroom-member-list-wrap">
      <div>
        {searchUserList.length === 0 && (
          <div className="fcr-chatroom-member-list-placeholder">
            <SvgImg type={SvgIconEnum.FCR_CHAT_PLACEHOLDER} size={200}></SvgImg>
            <span>{transI18n('fcr_chat_no_data')}</span>
          </div>
        )}
        {searchUserList.map((user) => (
          <UserItem key={user.userId} user={user}></UserItem>
        ))}
      </div>
    </div>
  );
});

const SearchInput = observer(() => {
  const {
    userStore: { searchKey, setSearchKey },
  } = useStore();
  const transI18n = useI18n();
  return (
    <div className="fcr-chatroom-member-list-search">
      <Input
        size="medium"
        value={searchKey}
        onChange={setSearchKey}
        iconPrefix={SvgIconEnum.FCR_V2_SEARCH}
        placeholder={transI18n('fcr_chat_label_search')}
      />
    </div>
  );
});
const UserItem = observer((props: { user: AgoraIMUserInfo<AgoraIMUserInfoExt> }) => {
  const { user } = props;
  const {
    fcrChatRoom,
    userStore: { muteList, privateUser, setPrivateUser },
    roomStore: { isHost },
    messageStore: { setTab },
  } = useStore();
  const transI18n = useI18n();
  const { muteUser, unmuteUser } = useMute();
  const localUserId = fcrChatRoom.userInfo?.userId || '';
  const [hover, setHover] = useState(false);
  const enableUserAction =
    isHost && user.ext.role !== 1 && user.ext.role !== 3 && user.userId !== localUserId && hover;
  const muted = muteList.includes(user.userId);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      key={user.userId}
      className="fcr-chatroom-member-list-item">
      <div className="fcr-chatroom-member-list-item-info">
        <Avatar size={24} textSize={12} nickName={user.nickName}></Avatar>

        <div className="fcr-chatroom-member-list-item-name">{user.nickName}</div>
      </div>
      <div className="fcr-chatroom-member-list-item-action">
        {!hover && muted && <SvgImg type={SvgIconEnum.FCR_MOBILE_CHAT2} size={20}></SvgImg>}
        {user.userId !== localUserId && hover && user.userId !== privateUser?.userId && (
          <Button
            onClick={() => {
              setPrivateUser(user);
              setTab('chat');
            }}
            shape="rounded"
            size="XXS">
            {transI18n('fcr_chat_label_private_chat')}
          </Button>
        )}
        {enableUserAction &&
          (muted ? (
            <Button
              onClick={() => {
                unmuteUser(user);
              }}
              styleType="danger"
              shape="rounded"
              size="XXS">
              {transI18n('fcr_chat_button_unmute')}
            </Button>
          ) : (
            <Button
              shape="rounded"
              onClick={() => {
                muteUser(user);
              }}
              size="XXS">
              {transI18n('fcr_chat_button_mute')}
            </Button>
          ))}
      </div>
    </div>
  );
});
