import { FC, useContext } from 'react';
import { observer } from 'mobx-react';
import { ExpansionToolbarItem } from '.';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ToolbarUIContext } from '../ui-context';
import { useI18n } from 'agora-common-libs';
import { isElectron } from '../../../../utils/isElectron';

export const ScreenCapturePickerItem: FC<{ offset?: number }> = observer(({ offset }) => {
  const {
    observables: { toolbarDockPosition },
  } = useContext(ToolbarUIContext);
  const transI18n = useI18n();
  return isElectron() ? (
    <ExpansionToolbarItem
      isActive={false}
      tooltip={transI18n('fcr_board_tool_screen')}
      popoverPlacement={toolbarDockPosition.placement === 'left' ? 'right' : 'left'}
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
        <SvgImg type={SvgIconEnum.FCR_WIHITEBOARD_SLICE} size={28} />
      </div>
      <div onClick={captureScreen}>
        <SvgImg type={SvgIconEnum.FCR_WIHITEBOARD_SLICEWITHOUTCLASSROOM} size={28} />
      </div>
    </div>
  );
});
