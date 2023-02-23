import React from 'react';

import { PathOptions } from '../svg-dict';

export const path = (props: PathOptions) => (
  <>
    <circle cx="55" cy="55" r="43.5" fill="url(#paint0_radial_2467_44199)" stroke="#BD7E16" />
    <path
      d="M71 41C72 39.6811 73.1305 38.4372 75.6667 37.0437C78.2028 35.6502 80.6667 36.0544 82 36.0548"
      stroke="#391E08"
      strokeWidth="5"
      strokeLinecap="round"
    />
    <path
      d="M41 41C40 39.6811 38.8695 38.4372 36.3333 37.0437C33.7972 35.6502 31.3333 36.0544 30 36.0548"
      stroke="#391E08"
      strokeWidth="5"
      strokeLinecap="round"
    />
    <path
      d="M55.0704 39C43.9814 39 23.9254 37 14 36.5C14 35 15.6428 32.7 18.107 29.5C20.5713 26.3 24.781 24 25.8077 23.5C32.8239 24 48.4992 25 55.0704 25C61.6417 25 75.9479 24.3333 82.2796 24L80.7394 22.5C80.9106 22 81.7662 21 83.8197 21C86.3866 21 88.9535 21.5 90.4937 23.5C92.0338 25.5 94.6007 29 97.1676 32C99.2211 34.4 96.9965 37 95.6275 38L94.6007 36.5C86.9 37 66.1594 39 55.0704 39Z"
      fill="url(#paint1_linear_2467_44199)"
      stroke="#AB3333"
    />
    <path
      d="M92 43L67 55.0222C68.5766 58.5843 73.4865 65.0407 80.5135 62.3691C87.5405 59.6975 91.0991 48.3432 92 43Z"
      fill="#381C06"
    />
    <path
      d="M22 43L47 55.0222C45.4234 58.5843 40.5135 65.0407 33.4865 62.3691C26.4595 59.6975 22.9009 48.3432 22 43Z"
      fill="#381C06"
    />
    <path
      d="M61.5 73.5C57.1 73.5 47.6667 80.5 43.5 84C46.1667 83 50.7782 79.7082 54 78.5C58 77 61 77 64.5 77.5C68 78 70 78 69.5 76.5C69 75 67 73.5 61.5 73.5Z"
      fill="#381C06"
    />
    <defs>
      <radialGradient
        id="paint0_radial_2467_44199"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(55 38) rotate(90) scale(61)">
        <stop stopColor="#FFFAE6" />
        <stop offset="0.780549" stopColor="#FBCA57" />
        <stop offset="1" stopColor="#FFB81D" />
      </radialGradient>
      <linearGradient
        id="paint1_linear_2467_44199"
        x1="56.0972"
        y1="24.5"
        x2="56.005"
        y2="39"
        gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF9695" />
        <stop offset="0.56154" stopColor="#EA0200" />
        <stop offset="1" stopColor="#C72322" />
      </linearGradient>
    </defs>
  </>
);

export const viewBox = '0 0 110 110';
