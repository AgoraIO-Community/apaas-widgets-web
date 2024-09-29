import React, { useState } from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { TextArea, TextAreaBorderLess } from '.';

const meta: ComponentMeta<typeof TextArea> = {
  title: 'Components/TextArea',
  component: TextArea,
  args: {
    placeholder: 'please input something..',
  },
};

export const Docs: ComponentStory<typeof TextArea> = (props) => {
  const [value, setValue] = useState('');
  const handleChange = (val: string) => {
    setValue(val);
  };
  return (
    <div>
      <div
        style={{
          width: 200,
          marginBottom: 50,
        }}>
        <TextArea {...props} maxCount={50} value={value} onChange={handleChange} />
      </div>
      <div
        style={{
          width: 200,
          marginBottom: 50,
        }}>
        <TextArea {...props} maxCount={50} value={value} onChange={handleChange} disabled />
      </div>
      <div
        style={{
          width: 200,
          marginBottom: 50,
        }}>
        <TextAreaBorderLess {...props} label="1" />
      </div>
      <div
        style={{
          width: 200,
          marginBottom: 50,
        }}>
        <TextArea
          {...props}
          showCount={false}
          autoSize
          maxCount={50}
          value={value}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default meta;
