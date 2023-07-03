import { HalfRoundedPagination } from '@components/pagination';
import { observer } from 'mobx-react';
import { useContext } from 'react';
import { ScenePaginationUIContext } from './ui-context';

export const ScenePagination = observer(() => {
  const { observables, addPage, changePage } = useContext(ScenePaginationUIContext);

  return (
    <div className="fcr-board-pagination">
      <HalfRoundedPagination
        current={observables.currentPage}
        total={observables.totalPage}
        onAdd={addPage}
        onChange={changePage}
      />
    </div>
  );
});
