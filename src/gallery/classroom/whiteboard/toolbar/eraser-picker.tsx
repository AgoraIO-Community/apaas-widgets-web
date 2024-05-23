import { observer } from 'mobx-react';
import { SvgIconEnum, SvgImg } from '@components/svg-img';

import React, { FC, useContext } from 'react';
import { ExpansionToolbarItem } from '.';
import classNames from 'classnames';
import { FcrBoardTool } from '../../../../common/whiteboard-wrapper/type';
import { ToolbarUIContext } from '../ui-context';
import { useI18n } from 'agora-common-libs';

export const EraserPickerItem: FC<{ offset?: number }> = observer(({ offset }) => {
  const {
    observables: { currentTool, toolbarDockPosition },
  } = useContext(ToolbarUIContext);
  const transI18n = useI18n();

  const isActive = currentTool === FcrBoardTool.Eraser;

  return (
    <ExpansionToolbarItem
      isActive={isActive}
      tooltip={transI18n('fcr_board_tool_eraser')}
      tooltipPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
      popoverPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
      icon={SvgIconEnum.FCR_WHITEBOARD_ERASER}
      popoverOverlayClassName="fcr-board-toolbar__picker__overlay"
      popoverContent={<EraserPickerPanel />}
      popoverOffset={offset}
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
        <SvgImg type={SvgIconEnum.FCR_WHITEBOARD_ERASER} size={28} />
      </div>
      <div onClick={handleCleanClick}>
        <SvgImg type={SvgIconEnum.FCR_WHITEBOARD_ELIMINATE} size={28} />
      </div>
    </div>
  );
});
