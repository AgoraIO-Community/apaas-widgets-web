import React from 'react';

import { PathOptions } from '../svg-dict';

export const path = (props: PathOptions) =>
    <g fill="none" >
        <circle cx="15" cy="15" r="7.875" stroke="white" strokeWidth="1.75"/>
        <path d="M12.2435 17.7565L13.3263 13.3263L17.7565 12.2434L16.6737 16.6736L12.2435 17.7565Z" stroke="white" strokeWidth="1.45833"/>
    </g>


export const viewBox = '0 0 30 30'