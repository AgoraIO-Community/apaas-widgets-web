import React from 'react';

import { PathOptions } from '../svg-dict';

export const path = ({ applicationNum }: PathOptions) => {

    return (
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12.5 6.25C11.6371 6.25 10.9375 6.94955 10.9375 7.8125V19.0625C10.9375 19.9254 11.6371 20.625 12.5 20.625C13.3629 20.625 14.0625 19.9254 14.0625 19.0625V7.8125C14.0625 6.94956 13.3629 6.25 12.5 6.25ZM16.875 9.375C16.0121 9.375 15.3125 10.0746 15.3125 10.9375V19.0625C15.3125 19.9254 16.0121 20.625 16.875 20.625C17.7379 20.625 18.4375 19.9254 18.4375 19.0625V10.9375C18.4375 10.0746 17.7379 9.375 16.875 9.375ZM19.6875 12.8125C19.6875 11.9496 20.3871 11.25 21.25 11.25C22.1129 11.25 22.8125 11.9496 22.8125 12.8125V19.0625C22.8125 19.9254 22.1129 20.625 21.25 20.625C20.3871 20.625 19.6875 19.9254 19.6875 19.0625V12.8125ZM8.75 10.625C8.75 10.1072 8.33027 9.6875 7.8125 9.6875C7.29473 9.6875 6.875 10.1072 6.875 10.625V20.625C6.875 22.5235 8.41402 24.0625 10.3125 24.0625H22.8125C23.3303 24.0625 23.75 23.6428 23.75 23.125C23.75 22.6072 23.3303 22.1875 22.8125 22.1875H10.3125C9.44956 22.1875 8.75 21.4879 8.75 20.625V10.625Z" fill="#FEFEFE"/>
        </svg>
    )
}

export const viewBox = '0 0 30 30';