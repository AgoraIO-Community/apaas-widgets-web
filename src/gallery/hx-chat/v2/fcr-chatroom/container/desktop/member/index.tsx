import { Input } from '@components/input';
import './index.css';
import { observer } from 'mobx-react';
import { useStore } from '../../../hooks/useStore';
import { SvgIconEnum } from '@components/svg-img';
import { Button } from '@components/button';
import { useMute } from '../../../hooks/useMute';
import { Avatar } from '@components/avatar';
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
    fcrChatRoom,
    userStore: { searchUserList, muteList },
    roomStore: { isHost },
  } = useStore();
  const { muteUser, unmuteUser } = useMute();
  const localUserId = fcrChatRoom.userInfo?.userId || '';
  return (
    <div className="fcr-chatroom-member-list-wrap">
      <div>
        {searchUserList.map((user) => {
          const enableUserAction = isHost && user.userId !== localUserId;
          const muted = muteList.includes(user.userId);
          return (
            <div key={user.userId} className="fcr-chatroom-member-list-item">
              <div className="fcr-chatroom-member-list-item-info">
                <Avatar size={30} textSize={14} nickName={user.nickName}></Avatar>

                <div className="fcr-chatroom-member-list-item-name">{user.nickName}</div>
              </div>
              <div className="fcr-chatroom-member-list-item-action">
                {enableUserAction &&
                  (muted ? (
                    <Button
                      onClick={() => {
                        unmuteUser(user);
                      }}
                      styleType="danger"
                      size="XS">
                      Unmute
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        muteUser(user);
                      }}
                      size="XS">
                      Mute
                    </Button>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const SearchInput = observer(() => {
  const {
    userStore: { searchKey, setSearchKey },
  } = useStore();
  return (
    <div className="fcr-chatroom-member-list-search">
      <Input
        size="medium"
        value={searchKey}
        onChange={setSearchKey}
        iconPrefix={SvgIconEnum.FCR_V2_SEARCH}
        placeholder="Search"
      />
    </div>
  );
});
