import { useI18n } from 'agora-common-libs';
import './index.css';
import { BoardUIContext } from '../ui-context';
import { useContext, useState } from 'react';
import { BoardConnectionState } from '../../../../common/whiteboard-wrapper/type';
import { Button } from '@components/button';
import classnames from 'classnames';
import loadingPng from './loading.png';
import { observer } from 'mobx-react';
export const Loading = observer(() => {
  const transI18n = useI18n();
  const {
    observables: { connectionState, joinSuccessed, canOperate },
    handleClose,
  } = useContext(BoardUIContext);
  const isReconnecting =
    connectionState === BoardConnectionState.Reconnecting ||
    (connectionState === BoardConnectionState.Connecting && joinSuccessed);
  const [minimize, setMinimize] = useState(!isReconnecting || !canOperate);
  const text = isReconnecting ? (
    minimize ? (
      transI18n('fcr_board_label_reconnect_board')
    ) : (
      <>
        {transI18n('fcr_board_window_connect_board1')}
        <br />
        {transI18n('fcr_board_window_connect_board2')}
      </>
    )
  ) : (
    transI18n('fcr_board_label_connect_board')
  );
  return (
    <div
      className={classnames('fcr-board-loading', {
        'fcr-board-loading-minimize': minimize,
      })}>
      <div className="fcr-board-loading-img-wrap">
        <img src={loadingPng}></img>
      </div>
      <div className="fcr-board-loading-content">
        <div className="fcr-board-loading-text">{text}</div>
        {!minimize && (
          <div className="fcr-board-loading-btns">
            <Button
              onClick={() => {
                setMinimize(true);
              }}
              type="secondary"
              size="XXS">
              {transI18n('fcr_board_button_continue_wait')}
            </Button>
            <Button onClick={handleClose} styleType="danger" size="XXS">
              {transI18n('fcr_board_button_close_whiteboard')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});
