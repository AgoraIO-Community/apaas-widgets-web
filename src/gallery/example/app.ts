import { AgoraWidgetBase } from "agora-common-libs";



export class ExampleWidget extends AgoraWidgetBase {
    private _dom?: HTMLElement;
    /**
     * 全局唯一的 Widget 名称
     */
    get widgetName(): string {
        return 'example'
    }

    /**
     * 挂载点
     * 重写 locate 方法返回一个节点，则此 Widget 将渲染在此节点内部
     *
     * 这里将 ExampleWidget 挂载至白板区域
     */
    locate(): HTMLElement | null | undefined {
        return document.querySelector(".widget-slot-board") as HTMLElement;
    }

    /**
     * Widget 节点已挂载
     * 此时可以在 DOM 节点进行自定义渲染
     */
    render(dom: HTMLElement): void {
        dom.innerHTML = 'This is a custom widget';
        dom.style.height = '100%';
        dom.style.display = "flex";
        dom.style.alignItems = "center";
        dom.style.justifyContent = "center";
        this._dom = dom;
    }

    /**
     * 卸载组件
     * 此时可以把相关资源释放掉
     */
    unload(): void {
        this._dom = undefined;
    }
}