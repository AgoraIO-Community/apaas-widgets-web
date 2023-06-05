import { observer } from 'mobx-react';
import { ToolbarItem } from '.';
import { useContext } from 'react';
import { SvgIconEnum } from '@components/svg-img';
import { ToolbarUIContext } from '../ui-context';

export const UndoItem = observer(() => {
  const {
    observables: { undoSteps, toolbarDockPosition },
    undo,
  } = useContext(ToolbarUIContext);

  return (
    <ToolbarItem
      tooltipPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
      tooltip="Undo"
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

  return (
    <ToolbarItem
      tooltipPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
      tooltip="Redo"
      icon={SvgIconEnum.FCR_MOBILE_WHITEBOARD_REDO}
      onClick={redo}
      isActive={false}
      isDisabled={!redoSteps}
    />
  );
});
