import { useRef } from 'react';
import { observer } from 'mobx-react';
import { YoutubePlayer } from './players/youtube';
import { FcrStreamMediaPlayerWidget } from '.';
import { StreamMediaPlayerInterface } from './type';
import { MultiWindowWidgetDialog } from '../common/dialog/multi-window';

export const App = observer(({ widget }: { widget: FcrStreamMediaPlayerWidget }) => {
  const webviewRef = useRef<StreamMediaPlayerInterface>(null);

  return (
    <MultiWindowWidgetDialog
      refreshable
      closeable={widget.hasPrivilege}
      widget={widget}
      minimizable
      fullscreenable
      onRefresh={() => {
        webviewRef.current?.refresh();
      }}>
      <YoutubePlayer ref={webviewRef} widget={widget} />
    </MultiWindowWidgetDialog>
  );
});
