import { useRef } from 'react';
import { observer } from 'mobx-react';
import { YoutubePlayer } from './players/youtube';
import { FcrStreamMediaPlayerWidget } from '.';
import { StreamMediaPlayerInterface } from './type';
export const App = observer(({ widget }: { widget: FcrStreamMediaPlayerWidget }) => {
  const webviewRef = useRef<StreamMediaPlayerInterface>(null);

  return (
    <YoutubePlayer ref={webviewRef} widget={widget} />
  );
});
