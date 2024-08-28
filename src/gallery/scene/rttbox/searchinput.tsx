import { Input } from "@components/input";

import { SvgIconEnum, SvgImg } from '@components/svg-img';
import { transI18n } from 'agora-common-libs';

export const SearchInput = () => {
    const {
      userStore: { searchKey, setSearchKey },
    } = useStore();
    return (
      <div className="fcr-chatroom-member-list-search">
        <Input
          size="medium"
          value={searchKey}
          onChange={setSearchKey}
          iconPrefix={SvgIconEnum.FCR_V2_SEARCH}
          placeholder={transI18n('fcr_chat_label_search')}
        />
      </div>
    );
  };

function observer(arg0: () => JSX.Element) {
    throw new Error("Function not implemented.");
}


function useStore(): { userStore: { searchKey: any; setSearchKey: any; }; } {
    throw new Error("Function not implemented.");
}


function useI18n() {
    throw new Error("Function not implemented.");
}
