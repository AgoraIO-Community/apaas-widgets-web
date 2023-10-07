import { observer } from 'mobx-react';
import { ToolbarItem } from '.';
import { useContext } from 'react';
import { SvgIconEnum } from '@components/svg-img';
import { ToolbarUIContext } from '../ui-context';
import { useI18n } from 'agora-common-libs';

export const UndoItem = observer(() => {
  const {
    observables: { undoSteps, toolbarDockPosition },
    undo,
  } = useContext(ToolbarUIContext);
  const transI18n = useI18n();

  return (
    <ToolbarItem
      tooltipPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
      tooltip={transI18n('fcr_board_tool_undo')}
      icon={SvgIconEnum.FCR_MOBILE_WHITEBOARD_UNDO}
      onClick={undo}
      isActive={false}
      isDisabled={!undoSteps}
    />
  );
});

export const RedoItem = observer(() => {
  const {
    observables: { redoSteps, toolbarDockPosition },
    redo,
  } = useContext(ToolbarUIContext);
  const transI18n = useI18n();

  return (
    <ToolbarItem
      tooltipPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
      tooltip={transI18n('fcr_board_tool_redo')}
      icon={SvgIconEnum.FCR_MOBILE_WHITEBOARD_REDO}
      onClick={redo}
      isActive={false}
      isDisabled={!redoSteps}
    />
  );
});
