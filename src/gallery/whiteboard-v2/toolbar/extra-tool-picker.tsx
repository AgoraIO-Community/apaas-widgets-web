import { observer } from 'mobx-react';
import { SvgIconEnum } from '@components/svg-img';
import { ExpansionToolbarItem } from '.';
import { useVisibleTools } from './hooks';
import React, { useContext } from 'react';
import { ToolbarUIContext } from '../ui-context';

export const AdditionToolPickerItem = observer(() => {
  const {
    observables: { toolbarDockPosition },
  } = useContext(ToolbarUIContext);
  const isActive = false;

  return (
    <ExpansionToolbarItem
      isActive={isActive}
      tooltip="Extra"
      icon={SvgIconEnum.FCR_SUBTRACT}
      popoverPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
      popoverOverlayClassName="fcr-board-toolbar__picker__overlay"
      popoverContent={<AdditionToolPickerPanel />}
      extensionMark={false}
    />
  );
});

const AdditionToolPickerPanel = observer(() => {
  const { additionTools } = useVisibleTools();

  return (
    <div className="fcr-board-toolbar-panel fcr-board-toolbar-panel--extra">
      {additionTools.map(({ renderItem }, index) => (
        <React.Fragment key={index.toString()}>{renderItem({ offset: 10 })}</React.Fragment>
      ))}
    </div>
  );
});
