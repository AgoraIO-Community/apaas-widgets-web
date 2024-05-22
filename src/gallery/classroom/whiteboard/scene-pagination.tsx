import { HalfRoundedPagination } from './pagination';
import { observer } from 'mobx-react';
import { useContext } from 'react';
import { ScenePaginationUIContext } from './ui-context';
import { useI18n } from 'agora-common-libs';

export const ScenePagination = observer(() => {
  const { observables, addPage, changePage } = useContext(ScenePaginationUIContext);
  const transI18n = useI18n();
  console.log('ScenePagination', observables);
  return (
    <div className="fcr-board-pagination">
      <HalfRoundedPagination
        current={observables.currentPage}
        total={observables.totalPage}
        onAdd={addPage}
        onChange={changePage}
        addText={transI18n('fcr_board_new_page')}
        showText={transI18n('fcr_board_show_pageration')}
        hideText={transI18n('fcr_board_hide_pageration')}
      />
    </div>
  );
});
