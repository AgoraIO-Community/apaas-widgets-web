import { useShallowEqualSelector } from '../../utils';
import { ShowAnnouncement } from './ShowAnnouncement';
import { EditAnnouncement } from './EditAnnouncement';

import './index.css';

// 公告
export const Announcement = () => {
  const { editStatus } = useShallowEqualSelector((state) => {
    return {
      editStatus: state?.announcementStatus
    };
  });
  return (
    <div>
      {editStatus && <ShowAnnouncement />}
      {!editStatus && <EditAnnouncement />}
    </div>
  );
};
