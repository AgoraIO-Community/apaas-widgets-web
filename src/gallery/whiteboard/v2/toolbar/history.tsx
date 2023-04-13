import { observer } from 'mobx-react';
import { ToolbarItem } from '.';
import { useContext } from 'react';
import { ToolbarUIContext } from '../../ui-context';
import { SvgIconEnum } from '@components/svg-img';

export const UndoItem = observer(() => {
  const {
    observables: { undoSteps },
    undo,
  } = useContext(ToolbarUIContext);

  return (
    <ToolbarItem
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
    observables: { redoSteps },
    redo,
  } = useContext(ToolbarUIContext);

  return (
    <ToolbarItem
      tooltip="Redo"
      icon={SvgIconEnum.FCR_MOBILE_WHITEBOARD_REDO}
      onClick={redo}
      isActive={false}
      isDisabled={!redoSteps}
    />
  );
});
