import React from 'react';
import { PathOptions } from '../svg-dict';

export const path = (props: PathOptions) => (
  <>
    <path d="M0 13C0 5.8203 5.8203 0 13 0C20.1797 0 26 5.8203 26 13C26 20.1797 20.1797 26 13 26C5.8203 26 0 20.1797 0 13Z" fill="white" />
    <g clipPath="url(#clip0_532_506)">
      <path fillRule="evenodd" clipRule="evenodd" d="M12.2373 8.91829C12.2342 8.48209 12.5853 8.13517 13.0214 8.14341L18.2782 8.24278L18.3152 13.5004C18.3182 13.9366 17.9672 14.2835 17.531 14.2753C17.0949 14.267 16.7389 13.9067 16.7358 13.4705L16.7099 9.79254L13.0325 9.72302C12.5964 9.71478 12.2403 9.35449 12.2373 8.91829Z" fill="#151515" />
      <path fillRule="evenodd" clipRule="evenodd" d="M13.8643 17.6525C13.8699 18.0887 13.5209 18.4377 13.0848 18.432L7.82745 18.3638L7.75927 13.1065C7.75362 12.6704 8.10262 12.3214 8.53879 12.327C8.97497 12.3327 9.33314 12.6908 9.33879 13.127L9.38648 16.8048L13.0643 16.8525C13.5004 16.8582 13.8586 17.2163 13.8643 17.6525Z" fill="#151515" />
    </g>
    <defs>
      <clipPath id="clip0_532_506">
        <rect width="16" height="16" fill="white" transform="translate(5 5)" />
      </clipPath>
    </defs>
  </>
);

export const viewBox = '0 0 26 26';
