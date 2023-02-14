import React from 'react';

import { PathOptions } from '../svg-dict';

export const path = (props: PathOptions) => (
  <>
    <path
      xmlns="http://www.w3.org/2000/svg"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.8169 11.9002C14.5729 12.1443 14.1771 12.1443 13.9331 11.9002L9.93898 7.90612C9.85762 7.82476 9.72571 7.82476 9.64435 7.90612L5.65027 11.9002C5.4062 12.1443 5.01047 12.1443 4.76639 11.9002C4.52231 11.6561 4.52231 11.2604 4.76639 11.0163L8.76047 7.02223C9.32998 6.45272 10.2533 6.45272 10.8229 7.02223L14.8169 11.0163C15.061 11.2604 15.061 11.6561 14.8169 11.9002Z"
      fill={props.iconPrimary || '#000'}
    />
  </>
);

export const viewBox = '0 0 20 20';
