import React, { useContext } from 'react';
import { TextAreaBorderLess } from '@components/textarea';
import { observer } from 'mobx-react';
import { PollingUIContext } from '../ui-context';
import { SvgIconEnum, SvgImg } from '@components/svg-img';
import './polling-input-list.css';
import { POLL_INPUT_MIN_COUNT } from '../type';
import { useI18n } from 'agora-common-libs';

const PollingInputList: React.FC = observer(() => {
  const {
    observables: { options },
    updateOption,
    removeOption,
  } = useContext(PollingUIContext);
  const transI18n = useI18n();

  const isAllowedToRemove = options.length > POLL_INPUT_MIN_COUNT;

  return (
    <div className="fcr-polling-input-list">
      {options.map(({ id, content }) => {
        const handleChange = (value: string) => {
          updateOption(id, value);
        };
        const handleRemove = () => {
          removeOption(id);
        };

        const iconCls = isAllowedToRemove
          ? 'fcr-polling-remove-icon'
          : 'fcr-polling-remove-icon--disabled';

        return (
          <TextAreaBorderLess
            key={id.toString()}
            labelIcon={
              <SvgImg
                type={SvgIconEnum.FCR_LIST_DELETE}
                className={iconCls}
                colors={{
                  iconPrimary: 'currentColor',
                }}
                onClick={isAllowedToRemove ? handleRemove : undefined}
              />
            }
            maxLength={50}
            placeholder={transI18n('fcr_poll_input_option')}
            defaultValue={content}
            onChange={handleChange}
          />
        );
      })}
    </div>
  );
});

export default PollingInputList;
