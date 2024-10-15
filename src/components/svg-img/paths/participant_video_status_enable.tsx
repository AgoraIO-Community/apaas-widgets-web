import React from 'react';
import { PathOptions } from '../svg-dict';

export const path = (props: PathOptions) => (
  <>
    <circle cx="18" cy="18" r="17" fill="white" stroke="#FEFEFE" strokeWidth="2" />
    <path d="M20.5 14.6667V21.3333H12.1667V14.6667H20.5ZM21.3333 13H11.3333C10.875 13 10.5 13.375 10.5 13.8333V22.1667C10.5 22.625 10.875 23 11.3333 23H21.3333C21.7917 23 22.1667 22.625 22.1667 22.1667V19.25L25.5 22.5833V13.4167L22.1667 16.75V13.8333C22.1667 13.375 21.7917 13 21.3333 13Z" fill="#151515" />
  </>
);

export const viewBox = '0 0 36 36';
