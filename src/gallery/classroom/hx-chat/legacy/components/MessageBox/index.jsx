import { transI18n } from 'agora-common-libs';
import noMessage_icon from '../../themes/img/noMessage.png';
import { MessageList } from './MessageList';
import './index.css';
import { useShallowEqualSelector } from '../../utils';

// 聊天页面
export const MessageBox = () => {
  const { msgs, isHaveNotice, inputBox } = useShallowEqualSelector((state) => {
    return {
      msgs: state?.messages,
      isHaveNotice: state?.room?.announcement,
      inputBox: state?.configUIVisible.inputBox
    };
  })

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
                  inputBox === 'inline' ? '135px' : '200px'
                })`
              : `calc(100% - 70px - ${
                  inputBox === 'inline' ? '102px' : '158px'
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
                  inputBox === 'inline' ? '135px' : '200px'
                })`
              : `calc(100% - 70px - ${
                  inputBox === 'inline' ? '102px' : '158px'
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
