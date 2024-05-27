import { useI18n } from 'agora-common-libs';
import { BoardUIContext } from '../ui-context';
import { useContext, useState } from 'react';
import { BoardConnectionState } from '../../../../common/whiteboard-wrapper/type';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import loadingPng from './loading.png';
import { observer } from 'mobx-react';
import './index.css';

export const Loading = observer(() => {
  const transI18n = useI18n();
  const {
    observables: { connectionState },
  } = useContext(BoardUIContext);

  const loading =
    connectionState === BoardConnectionState.Connecting ||
    connectionState === BoardConnectionState.Reconnecting;

  if (!loading) return null;
  return (
    <div className="fcr-mobile-board__connect">
      <div className="loading-icon">
        <SvgImg type={SvgIconEnum.FCR_LOADING} size={16} />
      </div>
      <div className="flex1">
        {transI18n('fcr_board_window_connect_board1')}
        <br />
        {transI18n('fcr_board_window_connect_board2')}
      </div>
    </div>
  );
});
