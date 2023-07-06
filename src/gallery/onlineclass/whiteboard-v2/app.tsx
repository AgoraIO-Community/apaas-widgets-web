import { useContext } from 'react';
import './style.css';
import { Toolbar } from './toolbar';
import { ScenePagination } from './scene-pagination';
import { BoardUIContext } from './ui-context';
import { observer } from 'mobx-react';

export const App = observer(() => {
  const {
    observables: { canOperate },
    handleDragOver,
    handleDrop,
    handleBoardDomLoad,
    handleCollectorDomLoad,
  } = useContext(BoardUIContext);

  return (
    <>
      <div
        className="board-widget-app"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        ref={handleBoardDomLoad}
      />
      <div
        className="window-manager-collector"
        ref={(ref) => {
          handleCollectorDomLoad(ref);
        }}
      />
      {/* toolbar */}
      {canOperate && <Toolbar />}
      {/* scene pages  */}
      {canOperate && <ScenePagination />}
    </>
  );
});
