import React from 'react';

import { PathOptions } from '../svg-dict';

export const path = ({ applicationNum }: PathOptions) => {

    return (
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="15" r="7.875" stroke="#FEFEFE" stroke-width="1.75"/>
        <path d="M13.1238 14.155L15.845 16.8762L12.2435 17.7565L13.1238 14.155ZM16.8762 15.845L14.155 13.1238L17.7565 12.2435L16.8762 15.845Z" stroke="#FEFEFE" stroke-width="1.45833"/>
        </svg>        
    )
}

export const viewBox = '0 0 30 30';