import classNames from 'classnames';
import React, {
  ChangeEvent,
  FC,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import isNumber from 'lodash/isNumber';
import './index.css';
import { getCaretIndex, setCaretIndex } from './helper';

export type TextAreaProps = {
  /**
   * 文本框中的值
   */
  /** @en
   * Value of the textarea
   */
  value?: string;
  /**
   * 限制最大文本输入字数
   */
  /** @en
   * Limit the max character count of the textarea
   */
  maxCount?: number;
  /**
 * 超出最大字数后是否可以继续输入
 */
  /** @en
   * Whether to continue typing after the maximum number of words is exceeded
   */
  overflowIsInput?: boolean;
  /**
   * 文本框的提示符
   */
  /** @en
   * Placeholder of the textarea
   */
  placeholder?: string;
  /**
   * 文本框是否可以垂直方向拖拽更改尺寸
   */
  /** @en
   * Whether the textarea can be resized vertically
   */
  resizable?: boolean;
  /**
   * 文本框是否禁用
   */
  /** @en
   * Whether the textarea is disabled
   */
  disabled?: boolean;
  /**
   * 值变更事件
   * @param value 变更值
   */
  /** @en
   * Change event of the textarea's value
   * @param value changed value
   */
  onChange?: (value: string) => void;
  showCount?: boolean;
  onFocusChange?: (focus: boolean) => void;
  autoSize?:
  | {
    minHeight?: number;
    maxHeight?: number;
  }
  | boolean;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
};
const defaultAutoSizeParams = {
  minHeight: 36,
  maxHeight: 140,
};
export const TextArea = forwardRef<{ dom: HTMLTextAreaElement | null }, TextAreaProps>(
  function TextAreaComponent(props, ref) {
    const {
      value = '',
      placeholder,
      resizable,
      disabled,
      maxCount,
      overflowIsInput = false,
      onChange = () => { },
      showCount = true,
      onFocusChange,
      autoSize,
      onKeyDown,
    } = props;
    const [focused, setFocused] = useState(false);
    const [overflowText, setOverflowText] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => ({
      dom: inputRef.current,
    }));
    const autoSizeParams = Object.assign(
      defaultAutoSizeParams,
      typeof autoSize === 'boolean' ? {} : autoSize,
    );

    const handleFocus = () => {
      setFocused(true);
      onFocusChange?.(true);
    };

    const handleBlur = () => {
      setFocused(false);
      onFocusChange?.(false);
    };
    const handleSize = () => {
      if (autoSize) {
        const { minHeight = 36 } = autoSizeParams;

        if (inputRef?.current) {
          inputRef.current.style.height = minHeight + 'px';
          inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
        }
      }
    };
    useEffect(handleSize, [value]);

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      if (isNumber(maxCount) && e.target.value.length > maxCount && !overflowIsInput) {
        return;
      }

      else if (isNumber(maxCount) && e.target.value.length > maxCount && overflowIsInput) {
        setOverflowText(true);
      }
      else if (isNumber(maxCount) && e.target.value.length <= maxCount && overflowIsInput) {
        setOverflowText(false);
      }
      onChange(e.target.value);
    };

    const handleClick = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    const cls = classNames('fcr-textarea', {
      'fcr-textarea--focused': focused,
      'fcr-textarea--non-resizable': !resizable,
      'fcr-textarea--non-count': !showCount,
      'fcr-textarea--disabled': disabled,
      'fcr-textarea--overflow': overflowText
    });
    const autoSizeStyle = autoSize ? { ...autoSizeParams, height: autoSizeParams.minHeight } : {};
    return (
      <div className={cls} onClick={handleClick}>
        <textarea
          ref={inputRef}
          onKeyDown={onKeyDown}
          style={autoSizeStyle}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={value}
          onChange={handleChange}
        />
        {/* {showCount && <div className="fcr-textarea-divider" />} */}

        {isNumber(maxCount) && showCount && (
          <span className="fcr-textarea-wc">
            <span className='fcr-textarea-overflow' >{(value ?? '').length}</span>/{maxCount}
          </span>
        )}
      </div>
    );
  },
);

type TextAreaBorderLessProps = {
  /**
   * 文本框的标签，一般展示在文本框的头部，提示用户需要输入的内容
   */
  /** @en
   * The label of the textarea, usually displayed at the head of the textarea, prompting the user to enter the content
   */
  label?: string;
  /**
   *
   */
  /** @en
   *
   */
  labelIcon?: React.ReactElement;
  /**
   * 文本框的提示符
   */
  /** @en
   * Placeholder of the textarea
   */
  placeholder?: string;
  /**
   * 值变更事件，只会在文本框失去焦点时触发
   * @param value 变更值
   */
  /** @en
   * Change event of the textarea's value, only fired when it lose focus
   * @param value changed value
   */
  onChange?: (value: string) => void;

  /**
   *
   */
  /** @en
   *
   */
  defaultValue?: string;

  maxLength?: number;
};
export const TextAreaBorderLess: FC<TextAreaBorderLessProps> = ({
  placeholder,
  onChange = () => { },
  label,
  labelIcon,
  defaultValue,
  maxLength,
}) => {
  const contentRef = useRef('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);
  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
  };

  const handleInput = () => {
    if (maxLength && (inputRef.current?.innerHTML.length || 0) > maxLength && inputRef.current) {
      if (contentRef.current.length < maxLength) {
        inputRef.current.innerHTML = inputRef.current.innerHTML.substring(0, maxLength);
        setCaretIndex(window, inputRef.current, maxLength);
        contentRef.current = inputRef.current.innerText;
        onChange(contentRef.current);
      } else {
        inputRef.current.innerHTML = contentRef.current;
        setCaretIndex(window, inputRef.current, maxLength);
        onChange(contentRef.current);
      }
    } else {
      contentRef.current = inputRef.current?.innerText || '';
      onChange(inputRef.current?.innerText ?? '');
    }
  };

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  useEffect(() => {
    if (inputRef.current && defaultValue) {
      inputRef.current.innerHTML = defaultValue;
    }
  }, []);

  const cls = classNames('fcr-textarea fcr-textarea-borderless', {
    'fcr-textarea--focused': focused,
  });

  return (
    <div className={cls} onClick={handleClick}>
      <span className="fcr-textarea-label">{label || labelIcon}</span>
      <div
        className="fcr-textarea__inner-editor"
        ref={inputRef}
        placeholder={placeholder}
        suppressContentEditableWarning={true}
        contentEditable={true}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onInput={handleInput}
      />
    </div>
  );
};


