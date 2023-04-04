import { observer } from 'mobx-react';

export const Toolbar = observer(() => {
  const tools = [];
  return (
    <div className="fcr-board-toolbar">
      <ul className="fcr-board-toolbar-list">
        <li></li>
      </ul>
    </div>
  );
});
