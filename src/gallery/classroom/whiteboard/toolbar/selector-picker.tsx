import { FC, useContext, useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import classNames from 'classnames';
import { FcrBoardShape, FcrBoardTool } from '../../../../common/whiteboard-wrapper/type';
import { ToolbarUIContext } from '../ui-context';
import { useI18n } from 'agora-common-libs';
import { runInAction } from 'mobx';

export const SelectorPickerPanel = observer(() => {
  const { observables, setPen, deleteSelector } = useContext(ToolbarUIContext);
  const pens = [
    { type: FcrBoardShape.Straight, icon: SvgIconEnum.FCR_PENSIZE2_STRAIGHT },
    { type: FcrBoardShape.Curve, icon: SvgIconEnum.FCR_PENSIZE2 },
  ];
  const handleClose = () => {
    runInAction(() => {
      observables.fixedToolVisible = false;
    });
  };

  return (
    <div className="fcr-board-toolbar-panel fcr-board-toolbar-panel--pen">
      <div onClick={deleteSelector}>
        <SvgImg type={SvgIconEnum.FCR_DELETE4} size={32} colors={{ iconPrimary: '#FB584E' }} />
      </div>
      <div className="fcr-divider-vertical fcr-divider-mobile-line"></div>
      <div key="close" onClick={handleClose}>
        <SvgImg type={SvgIconEnum.FCR_MOBILE_CLOSE} size={16} />
      </div>
    </div>
  );
});
