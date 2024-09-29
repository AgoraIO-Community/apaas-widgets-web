import React from 'react';
import { PathOptions } from '../svg-dict';

export const path = (props: PathOptions) => (
  <>
    <path d="M0 13C0 5.8203 5.8203 0 13 0V0C20.1797 0 26 5.8203 26 13V13C26 20.1797 20.1797 26 13 26V26C5.8203 26 0 20.1797 0 13V13Z" fill="white" />
    <rect x="8.82983" y="16.4692" width="10.8036" height="0.993344" rx="0.496672" transform="rotate(-45 8.82983 16.4692)" fill="#151515" />
    <rect x="9.53259" y="8.83008" width="10.8036" height="0.993344" rx="0.496672" transform="rotate(45 9.53259 8.83008)" fill="#151515" />
  </>
);

export const viewBox = '0 0 26 26';
