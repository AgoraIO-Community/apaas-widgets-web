import React, { useState } from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { HalfRoundedPagination, ListViewPagination, Pagination } from '.';

const meta: ComponentMeta<typeof Pagination> = {
  title: 'Components/Pagination',
  component: Pagination,
  args: {
    total: 10,
  },
};

export const Docs: ComponentStory<typeof Pagination> = (props) => {
  const [current, setCurrent] = useState(1);
  const handleChange = (val: number) => {
    setCurrent(val);
  };
  return (
    <div>
      <div
        style={{
          width: 200,
          marginBottom: 50,
        }}>
        <Pagination size="small" {...props} current={current} onChange={handleChange} />
      </div>
      <div>
        <HalfRoundedPagination {...props} current={current} onChange={handleChange} />
      </div>
      <div
        style={{
          height: 300,
          width: 300,
          marginBottom: 50,
          background: '#111',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}>
        <ListViewPagination {...props} current={current} onChange={handleChange} />
      </div>
      <div
        style={{
          height: 300,
          width: 300,
          marginBottom: 50,
          background: '#111',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}>
        <ListViewPagination
          {...props}
          direction={'col'}
          current={current}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default meta;
