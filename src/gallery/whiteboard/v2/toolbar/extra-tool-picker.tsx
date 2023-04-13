import { observer } from 'mobx-react';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ExpansionToolbarItem } from '.';
import { ScreenCapturePickerItem } from './screen-capture-picker';

export const ExtraToolPickerItem = observer(() => {
  const isActive = false;

  return (
    <ExpansionToolbarItem
      isActive={isActive}
      tooltip="Extra"
      icon={SvgIconEnum.FCR_V2_TOOL_NEW}
      popoverPlacement="right"
      popoverOverlayClassName="fcr-board-toolbar__picker__overlay"
      popoverContent={<ExtraToolPickerPanel />}
      extensionMark={false}
    />
  );
});

const ExtraToolPickerPanel = observer(() => {
  const handleCloudDrive = () => {};

  const handleLaserPen = () => {};

  const handleSaveDraft = () => {};

  return (
    <div className="fcr-board-toolbar-panel fcr-board-toolbar-panel--extra">
      <div onClick={handleCloudDrive}>
        <SvgImg type={SvgIconEnum.FCR_WHITEBOARD_CLOUD} size={30} />
      </div>
      <div onClick={handleLaserPen}>
        <SvgImg type={SvgIconEnum.FCR_WHITEBOARD_LASERPEN} size={30} />
      </div>
      <ScreenCapturePickerItem offset={14} />
      <div onClick={handleSaveDraft}>
        <SvgImg type={SvgIconEnum.FCR_WHITEBOARD_SAVE} size={30} />
      </div>
    </div>
  );
});
