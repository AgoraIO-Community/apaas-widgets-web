import { AutoSizer, List, CellMeasurerCache, CellMeasurer } from 'react-virtualized';
import PropTypes from 'prop-types';
import { TextMsg } from './TextMsg';
import { CmdMsg } from './CmdMsg';
import { ImgMsg } from './ImgMsg';

const cache = new CellMeasurerCache({
  fixedWidth: true,
});

let list;
let mostRecentWidth;

const getRowRenderer = (msgs) =>
  function rowRenderer(params) {
    const item = msgs[params.index];
    const isText = item?.contentsType === 'TEXT' || item?.type === 'txt';
    const isCmd = item?.contentsType === 'COMMAND' || item?.type === 'cmd';
    const isImg = item?.contentsType === 'IMAGE' || item?.type === 'img';

    return (
      <CellMeasurer
        cache={cache}
        columnIndex={0}
        key={params.key}
        parent={params.parent}
        rowIndex={params.index}
        width={mostRecentWidth}>
        <div key={params.key} style={params.style}>
          {isText && <TextMsg item={item} />}
          {isCmd && <CmdMsg item={item} />}
          {isImg && <ImgMsg item={item} />}
        </div>
      </CellMeasurer>
    );
  };

export const MessageList = (props) => {
  const { msgs } = props;
  return (
    <div style={{ height: '100%' }}>
      <AutoSizer>
        {(autoSizerParams) => {
          if (mostRecentWidth !== autoSizerParams.width) {
            cache.clearAll();
            if (list) {
              list.recomputeRowHeights();
            }
          }

          mostRecentWidth = autoSizerParams.width;
          return (
            <List
              ref={(ref) => {
                list = ref;
              }}
              style={{ overflowY: 'scroll' }}
              rowRenderer={getRowRenderer(msgs)}
              deferredMeasurementCache={cache}
              rowHeight={cache.rowHeight}
              rowCount={msgs.length}
              height={autoSizerParams.height}
              width={autoSizerParams.width}
              scrollToIndex={msgs.length - 1}
            />
          );
        }}
      </AutoSizer>
    </div>
  );
};

MessageList.propTypes = {
  msgs: PropTypes.array,
};
