import { useContext } from 'react';
import './style.css';
import { LayerUIContext } from './ui-context';
import { observer } from 'mobx-react';

export const ContentLayer = observer(() => {
  return <div className="canvas-layer" />;
});

export const ControlLayer = observer(() => {
  const {
    observables: { boardIsConnected },
    join,
    leave,
  } = useContext(LayerUIContext);

  return (
    <div className="control-layer">
      <button
        onClick={() => {
          if (!boardIsConnected) {
            join();
          } else {
            leave();
          }
        }}>
        {!boardIsConnected ? 'Open board' : 'Close board'}
      </button>
    </div>
  );
});
