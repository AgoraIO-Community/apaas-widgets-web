import React from 'react';

import { PathOptions } from '../svg-dict';

export const path = ({ applicationNum }: PathOptions) => {

    return (
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.4702 13.0271C23.5467 14.1421 23.5884 15.8963 22.566 17.0611V17.0611C20.1276 19.8394 17.0762 22.0123 13.6533 23.4081L13.1679 23.606C11.3789 24.3355 9.36315 23.2831 8.93916 21.3981L8.73405 20.4863C7.9215 16.8739 7.9215 13.1261 8.73405 9.51373L8.89456 8.80013C9.33325 6.84984 11.465 5.80721 13.2738 6.65826L14.7043 7.33132C17.4506 8.62345 19.9386 10.4049 22.0467 12.5884L22.4702 13.0271Z" fill="#FEFEFE"/>
        </svg>
    )
}

export const viewBox = '0 0 30 30';