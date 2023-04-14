import { observer } from 'mobx-react';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ExpansionToolbarItem, ToolbarItem } from '.';
import { ScreenCapturePickerItem } from './screen-capture-picker';
import { useContext } from 'react';
import { ToolbarUIContext } from '../../ui-context';
import { FcrBoardTool } from '../../wrapper/type';

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
  const {
    observables: { currentTool },
    setTool,
    saveDraft,
  } = useContext(ToolbarUIContext);
  const handleCloudDrive = () => {};

  const handleLaserPen = () => {
    setTool(FcrBoardTool.LaserPointer);
  };

  return (
    <div className="fcr-board-toolbar-panel fcr-board-toolbar-panel--extra">
      <div onClick={handleCloudDrive}>
        <SvgImg type={SvgIconEnum.FCR_WHITEBOARD_CLOUD} size={30} />
      </div>
      <ToolbarItem
        tooltip="Laser Pen"
        icon={SvgIconEnum.FCR_WHITEBOARD_LASERPEN}
        onClick={handleLaserPen}
        isActive={currentTool === FcrBoardTool.LaserPointer}
      />
      {/* <div onClick={handleLaserPen}>
        <SvgImg type={SvgIconEnum.FCR_WHITEBOARD_LASERPEN} size={30} />
      </div> */}
      <ScreenCapturePickerItem offset={14} />
      <div onClick={saveDraft}>
        <SvgImg type={SvgIconEnum.FCR_WHITEBOARD_SAVE} size={30} />
      </div>
    </div>
  );
});
