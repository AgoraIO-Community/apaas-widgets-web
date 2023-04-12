import { HalfRoundedPagination } from '@components/pagination';

export const ScenePagination = () => {
  return (
    <div className="fcr-board-pagination">
      <HalfRoundedPagination current={10} total={10} />
    </div>
  );
};
