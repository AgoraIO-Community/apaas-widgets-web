import { observer } from 'mobx-react';
import { SvgIconEnum, SvgImg } from '@components/svg-img';

import React, { FC, useContext } from 'react';
import { ToolbarUIContext } from '../../ui-context';
import { ExpansionToolbarItem } from '.';
import { FcrBoardTool } from '../../wrapper/type';
import classNames from 'classnames';

export const EraserPickerItem: FC = observer(() => {
  const {
    observables: { currentTool },
  } = useContext(ToolbarUIContext);

  const isActive = currentTool === FcrBoardTool.Eraser;

  return (
    <ExpansionToolbarItem
      isActive={isActive}
      tooltip="Eraser"
      popoverPlacement="right"
      icon={SvgIconEnum.FCR_WHITEBOARD_ERASER}
      popoverOverlayClassName="fcr-board-toolbar__picker__overlay"
      popoverContent={<EraserPickerPanel />}
    />
  );
});

const EraserPickerPanel = observer(() => {
  const {
    observables: { currentTool },
    clean,
    setTool,
  } = useContext(ToolbarUIContext);

  const eraserCls = classNames({
    'fcr-board-toolbar-panel--active': currentTool === FcrBoardTool.Eraser,
  });

  const handleEraserClick = () => {
    setTool(FcrBoardTool.Eraser);
  };
  const handleCleanClick = () => {
    clean();
  };

  return (
    <div className="fcr-board-toolbar-panel fcr-board-toolbar-panel--eraser">
      <div className={eraserCls} onClick={handleEraserClick}>
        <SvgImg type={SvgIconEnum.FCR_WHITEBOARD_ERASER} size={30} />
      </div>
      <div onClick={handleCleanClick}>
        <SvgImg type={SvgIconEnum.FCR_WHITEBOARD_ELIMINATE} size={30} />
      </div>
    </div>
  );
});
