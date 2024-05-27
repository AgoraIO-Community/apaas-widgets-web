import { useContext } from 'react';
import { observer } from 'mobx-react';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { ToolbarUIContext } from '../ui-context';

export const SelectorPickerPanel = observer(() => {
  const { deleteSelector } = useContext(ToolbarUIContext);

  return (
    <div className="fcr-board-toolbar-panel fcr-board-toolbar-panel--pen">
      <div onClick={deleteSelector}>
        <SvgImg type={SvgIconEnum.FCR_DELETE4} size={32} colors={{ iconPrimary: '#FB584E' }} />
      </div>
    </div>
  );
});
