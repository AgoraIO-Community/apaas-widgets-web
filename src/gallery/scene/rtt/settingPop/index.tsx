import { ReactNode, useState } from 'react'
import './index.css'
import { Popover } from 'antd'
import { RttSettings } from '../setting'
import { FcrRTTWidget } from '..'

export interface RttSettingPopProps {
    children?: ReactNode | undefined
    showToConversionSetting: boolean,//是否显示转写设置
    showToSubtitleSetting: boolean,//是否显示字幕设置
    widget: FcrRTTWidget
}
export const RttSettingPop: React.FC<RttSettingPopProps> = (props: RttSettingPopProps) => {
    const [popoverVisible, setPopoverVisible] = useState(false);
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', }}>
        {!popoverVisible ? <div onClick={(e) => { setPopoverVisible(true);e.stopPropagation() }}> {props.children}</div> :
        <Popover
            open={popoverVisible}
            trigger="click"
            showArrow={false}
            onOpenChange={(value) => { setPopoverVisible(value) }}
            content={<div >
                <RttSettings showToConversionSetting={props.showToConversionSetting} showToSubtitleSetting={props.showToSubtitleSetting}
                    widget={props.widget} hideModule={() => { setPopoverVisible(false) }}></RttSettings>
            </div>}>
            <div onClick={(e) => { e.stopPropagation() }}> {props.children}</div>
        </Popover>}
    </div>
}


