/**
 * 此文件包含 SDK 中支持的事件，如果发现下列事件中与 SDK 中定义的事件有差异，则当前库与 SDK 版本不匹配
 *
 * This file includes events that should be supported by SDK,
 * if below events have difference with events in SDK, it's considerd there's a version mismatch between this lib and SDK
 */

/**
 * 此类事件从教室发出，在Widget中监听
 */
/** @en
 * Events that come from SDK toward widget
 */
export enum AgoraExtensionRoomEvent {
  /** 白板 */
  // 设置白板工具
  BoardSelectTool = 'board-select-tool',
  // 添加一页白板
  BoardAddPage = 'board-add-page',
  // 删除一页白板
  BoardRemovePage = 'board-remove-page',
  // 设置白板页面
  BoardGotoPage = 'board-goto-page',
  // 撤销
  BoardUndo = 'board-undo',
  // 重做
  BoardRedo = 'board-redo',
  // 清空白板
  BoardClean = 'board-clean',
  // 放置一张图片到白板上
  BoardPutImageResource = 'board-put-image-resource',
  // 放置一张图片到指定白板窗口
  BoardPutImageResourceIntoWindow = 'board-put-image-resource-into-window',
  // 打开文档类课件
  BoardOpenMaterialResourceWindow = 'board-open-material-resource-window',
  // 打开多媒体文件
  BoardOpenMediaResourceWindow = 'board-open-media-resource-window',
  // 打开一个Web窗口
  BoardOpenH5ResourceWindow = 'board-open-h5-resource-window',
  // 设置白板图形工具
  BoardDrawShape = 'board-draw-shape',
  // 授予白板权限
  BoardGrantPrivilege = 'board-grant-privilege',
  // 设置白板笔迹宽度
  BoardChangeStrokeWidth = 'board-change-stroke-width',
  // 设置白板笔迹颜色
  BoardChangeStrokeColor = 'board-change-stroke-color',
  // 保存白板笔迹
  BoardSaveAttributes = 'board-save-attributes',
  // 加在白板笔迹
  BoardLoadAttributes = 'board-load-attributes',
  // 获取白板快照图片
  BoardGetSnapshotImageList = 'board-get-snapshot-image-list',
  // 设置白板操作延时
  BoardSetDelay = 'board-set-delay',
  // 设置课件动画渲染参数
  BoardSetAnimationOptions = 'board-set-animation-options',
  // 开关白板
  ToggleBoard = 'toggle-board',
  // 打开 Webview
  OpenWebview = 'open-webview',
  // 打开流媒体播放器
  OpenStreamMediaPlayer = 'open-stream-media-player',
  // 返回授权用户列表
  ResponseGrantedList = 'response-granted-list',
  // 
  RttOptionsChanged = 'rtt-options-changed',
  // 横竖屏切换
  OrientationStatesChanged = 'orientation-changed',
  // 移动端大班课横屏清屏状态变化
  MobileLandscapeToolBarVisibleChanged = 'mobile-landscape-tool-bar-visible-changed',
  //打开聊天对话框
  OpenChatDialog = 'open-chat-dialog',
  //关闭聊天对话框
  CloseChatDialog = 'close-chat-dialog',
  //设置插件最小化
  SetMinimize = 'set-minimize',
  //设置插件可见性
  VisibleChanged = 'visible-changed',
  // 工具盒子可见性变化
  ToolboxChanged = 'toolbox-changed',
  // 实时转写显示
  RttBoxshow = 'rttbox-show',
  // rtt盒子可见性变化
  RttboxChanged = 'rttbox-changed',
  // 布局变化
  LayoutChanged = 'layout-changed',
  // webview/streamMedia 插件刷新
  Refresh = 'refresh',
  // 私聊
  PrivateChat = 'PrivateChat',
  // widget弹框边界尺寸变化
  WidgetDialogBoundariesChanged = 'widget-dialog-boundaries-changed',
  //设置插件全屏
  SetFullscreen = 'set-fullscreen',
  //mobile连麦状态变更
  MobileCallStateChanged = 'mobile-call-state-changed',
  //修改声源语言
  ChangeRttSourceLan = "ChangeRttSourceLan",
  //修改翻译语言
  ChangeRttTargetLan = "changeRttTargetLan",
  //修改Rtt文本大小
  ChangeRttTextSize = "changeRttTextSize",
  //修改Rtt双语显示
  ChangeRttShowDoubleLan = "changeRttShowDoubleLan",
  //显示设置弹窗
  RttShowSetting = "RttShowSetting",
  //隐藏设置弹窗
  RttHideSetting = "RttHideSetting",
  //显示转写弹窗
  RttShowConversion = "RttShowConversion",
  //关闭转写弹窗
  RttCloseConversion = "RttCloseConversion",
  //显示字幕
  RttShowSubtitle = "RttShowSubtitle",
  //修改字幕开启状态
  RttChangeToSubtitleOpenState = "RttChangeToSubtitleOpenState",
  //修改转写开启状态
  RttChangeToConversionOpenState = "RttChangeToConversionOpenState",
  //字幕功能开启成功
  RttSubtitleOpenSuccess = "RttSubtitleOpenSuccess",
  //字幕功能关闭成功
  RttSubtitleCloseSuccess = "RttSubtitleCloseSuccess",
  //转写功能开启成功
  RttConversionOpenSuccess = "RttConversionOpenSuccess",
  //转写功能关闭成功
  RttConversionCloseSuccess = "RttConversionCloseSuccess",
  //隐藏字幕
  RttHideSubtitle = "RttHideSubtitle",
  //接收到内容信息变更
  RttContentChange = "RttContentChange",
  //接收到内容信息变更
  RttListChange = "RttListChange",
  //状态改变到正在开启
  RttStateToOpening = "RttStateToOpening",
  //状态改变到正在聆听
  RttStateToListener = "RttStateToListener",
  //状态改变到无人讲话
  RttStateToNoSpeack = "RttStateToNoSpeack",
  //状态接收到声源语言变更
  RttStateReceiveSourceLanChange = "RttStateReceiveSourceLanChange",
  //倒计时修改通知
  RttReduceTimeChange = "RttReduceTimeChange",
  //文本大小修改完成
  RttTextSizeChagneFinish = "RttTextSizeChagneFinish",
  //源语言修改完成
  RttSourceLanChangeFinish = "RttSourceLanChangeFinish",
  //翻译语言修改完成
  RttTargetLanChangeFinish = "RttTargetLanChangeFinish",
  //双语显示修改完成
  RttShowDoubleLanChangeFinish = "RttShowDoubleLanChangeFinish",
  ChangeRttlanguage = "ChangeRttlanguage",
  //widget启用状态改变处理
  WidgetActiveStateChange = 'WidgetActiveStateChange',
}

/**
 * 此事件从Widget发出，在教室内监听
 */
/** @en
 * Events that come from widget toward SDK
 */
export enum AgoraExtensionWidgetEvent {
  /** 白板 */
  // 连接状态变更
  BoardConnStateChanged = 'board-connection-state-changed',
  // 挂载状态变更
  BoardMountStateChanged = 'board-mount-state-changed',
  // 房间属性变更
  BoardMemberStateChanged = 'board-member-state-changed',
  // 页码属性变更
  BoardPageInfoChanged = 'board-page-info-changed',
  // 重做步数变更
  BoardRedoStepsChanged = 'board-redo-steps-changed',
  // 撤销步数变更
  BoardUndoStepsChanged = 'board-undo-steps-changed',
  // 授权用户变更
  BoardGrantedUsersUpdated = 'board-granted-users-updated',
  // 收到白板截图
  BoardSnapshotImageReceived = 'board-snapshot-image-received',
  // 白板文件拖入事件
  BoardDragOver = 'board-drag-over',
  // 白板文件放入事件
  BoardDrop = 'board-drop',
  // 白板中打开的课件列表变更
  BoardOpenedCoursewareListChanged = 'board-opened-courseware-list-changed',
  // Widget 即将打开
  WidgetBecomeActive = 'widget-become-active',
  // Widget 即将关闭
  WidgetBecomeInactive = 'widget-become-inactive',
  // 向工具栏注册工具
  RegisterCabinetTool = 'register-cabinet-tool',
  // 向工具栏反注册工具
  UnregisterCabinetTool = 'unregister-cabinet-tool',
  // 请求授权用户列表
  RequestGrantedList = 'request-granted-list',
  //请求当前横竖屏状态
  RequestOrientationStates = 'request-orientation',
  //取消强制横屏
  QuitForceLandscape = 'quit-force-landscape',
  //唤起单例Toast
  AddSingletonToast = 'add-singleton-toast',
  //投票器激活状态变更
  PollActiveStateChanged = 'poll-active-state-changed',
  //请求当前横屏清屏状态
  RequestMobileLandscapeToolBarVisible = 'request-mobile-landscape-tool-bar-visible',
  //插件最小化
  Minimize = 'minimize',
  //聊天对话框开启状态变更
  ChatDialogVisibleChanged = 'chat-dialog-visible-changed',
  //聊天未读消息变更
  ChatUnreadMessageUpdate = 'chat-unread-message-update',
  // Widget创建成功
  WidgetCreated = 'widget-created',
  // Widget销毁成功
  WidgetDestroyed = 'widget-destroyed',
  //设置插件可见性
  SetVisible = 'set-visible',
  // 切换声源语言
  ChangeRttlanguage = "change-rttlanguage",
  //设置插件最小化
  SetMinimize = 'set-minimize',
  //设置插件全屏
  SetFullscreen = 'set-fullscreen',
  //设置插件尺寸
  UpdateSize = 'update-size',
  //设置插件位置
  UpdatePosition = 'update-position',
  //更新倒计时状态
  CountdownTimerStateChanged = 'countdown-timer-state-changed',
  //打开mobile web的举手弹窗
  OpenMobileHandsUpActionSheet = 'open-mobile-hands-up-action-sheet',
}
