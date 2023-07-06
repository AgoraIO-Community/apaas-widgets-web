import { useSelector } from 'react-redux';
import { transI18n } from 'agora-common-libs';
import noMessage_icon from '../../themes/img/noMessage.png';
import { MessageList } from './MessageList';
import './index.css';

// 聊天页面
export const MessageBox = () => {
  const state = useSelector((state) => state);
  const msgs = state?.messages;
  const isHaveNotice = state?.room?.announcement;
  let isHaveMsg = msgs && msgs.length > 0;

  return (
    <>
      {isHaveMsg ? (
        <div
          className="fcr-hx-message-box"
          id="chat-messages"
          style={{
            height: isHaveNotice
              ? `calc(100% - 70px - ${
                  state?.configUIVisible.inputBox === 'inline' ? '135px' : '200px'
                })`
              : `calc(100% - 70px - ${
                  state?.configUIVisible.inputBox === 'inline' ? '102px' : '158px'
                })`,
          }}>
          <MessageList msgs={msgs} />
        </div>
      ) : (
        <div
          className="fcr-hx-message-box fcr-hx-no-box"
          style={{
            height: isHaveNotice
              ? `calc(100% - 70px - ${
                  state?.configUIVisible.inputBox === 'inline' ? '135px' : '200px'
                })`
              : `calc(100% - 70px - ${
                  state?.configUIVisible.inputBox === 'inline' ? '102px' : '158px'
                })`,
          }}>
          <div className="fcr-hx-no-msgs">
            <img src={noMessage_icon} />
            <span className="fcr-hx-no-msgs-text">{transI18n('chat.no_message')}</span>
          </div>
        </div>
      )}
    </>
  );
};
