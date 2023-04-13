import { FC, useContext } from 'react';
import { observer } from 'mobx-react';
import { ExpansionToolbarItem } from '.';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ToolbarUIContext } from '../../ui-context';
import { AgoraRteEngineConfig, AgoraRteRuntimePlatform } from 'agora-rte-sdk';

const isElectron = () => {
  return AgoraRteEngineConfig.platform === AgoraRteRuntimePlatform.Electron;
};

export const ScreenCapturePickerItem: FC<{ offset?: number }> = observer(({ offset }) => {
  return isElectron() ? (
    <ExpansionToolbarItem
      isActive={false}
      tooltip="Screen"
      popoverPlacement="right"
      icon={SvgIconEnum.FCR_WIHITEBOARD_SLICE}
      popoverOverlayClassName="fcr-board-toolbar__picker__overlay"
      popoverContent={<ScreenCapturePickerPanel />}
      popoverOffset={offset}
    />
  ) : null;
});

const ScreenCapturePickerPanel = observer(() => {
  const { captureApp, captureScreen } = useContext(ToolbarUIContext);

  return (
    <div className="fcr-board-toolbar-panel fcr-board-toolbar-panel--capture">
      <div onClick={captureApp}>
        <SvgImg type={SvgIconEnum.FCR_WIHITEBOARD_SLICE} size={30} />
      </div>
      <div onClick={captureScreen}>
        <SvgImg type={SvgIconEnum.FCR_WIHITEBOARD_SLICEWITHOUTCLASSROOM} size={30} />
      </div>
    </div>
  );
});
