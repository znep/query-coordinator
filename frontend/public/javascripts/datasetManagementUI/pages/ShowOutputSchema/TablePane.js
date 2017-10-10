import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { interpolate, easeInOutQuad } from 'lib/interpolate';
import { commaify } from '../../../common/formatNumber';
import * as Selectors from 'selectors';
import Table from 'containers/TableContainer';
import PagerBar from 'containers/PagerBarContainer';
import ErrorPointer from 'components/ErrorPointer/ErrorPointer';
import styles from './ShowOutputSchema.scss';

const COL_WIDTH_PX = 250; // matches style on td in Table.scss
const ERROR_SCROLL_DURATION_MS = 1000;

class TablePane extends Component {
  constructor() {
    super();
    _.bindAll(this, ['setSize', 'scrollToColIdx']);
    // need to keep throttled version in an instance variable since it contains state used for
    // throttling. Putting _.throttle in JSX doesn't work because throttling state is overwritten
    // on every rerender
    this.throttledSetSize = _.throttle(this.setSize, ERROR_SCROLL_DURATION_MS / 2);
    this.state = {
      scrollLeft: null,
      viewportWidth: null
    };
  }

  componentDidMount() {
    this.setSize();
    window.addEventListener('resize', this.throttledSetSize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.throttledSetSize);
  }

  setSize() {
    if (!this.tableWrap) return;
    this.setState({
      scrollLeft: this.tableWrap.scrollLeft,
      viewportWidth: this.tableWrap.offsetWidth
    });
  }

  errorsNotInView() {
    // find the minimum and maximum column indexes visible to the user
    const minColIdx = this.offsetToColIdx(this.state.scrollLeft);
    const maxColIdx = this.offsetToColIdx(this.state.scrollLeft + this.state.viewportWidth);
    // get the column objects for columns out of viewport to left and right
    const colsToLeft = this.props.columns.slice(0, minColIdx);
    const colsToRight = this.props.columns.slice(maxColIdx + 1);
    // sum up errors for those columns
    return {
      toLeft: this.errorSumAndFirstColWithErrors(colsToLeft),
      toRight: this.errorSumAndFirstColWithErrors(colsToRight)
    };
  }

  errorSumAndFirstColWithErrors(columns) {
    let firstColWithErrors = null;
    let errorSum = 0;
    columns.forEach(col => {
      const numErrors = col.transform.error_count || 0;
      errorSum += numErrors;
      if (firstColWithErrors === null && numErrors > 0) {
        firstColWithErrors = col.position;
      }
    });
    return {
      errorSum,
      firstColWithErrors
    };
  }

  scrollToColIdx(idx) {
    if (!this.tableWrap) return;
    const offset = this.colIdxToOffset(idx);
    interpolate(this.tableWrap.scrollLeft, offset, ERROR_SCROLL_DURATION_MS, easeInOutQuad, pos => {
      this.tableWrap.scrollLeft = pos;
    });
  }

  offsetToColIdx(offset) {
    return Math.min(offset / COL_WIDTH_PX);
  }

  colIdxToOffset(colIdx) {
    const colOffset = colIdx * COL_WIDTH_PX;
    const centered = colOffset - this.state.viewportWidth / 2 + COL_WIDTH_PX / 2;
    return Math.max(0, centered);
  }

  render() {
    const {
      inputSchema,
      outputSchema,
      columns,
      displayState,
      numLoadsInProgress,
      params
    } = this.props;

    const rowsTransformed = inputSchema.total_rows || Selectors.rowsTransformed(columns);
    const errorsNotInView = this.errorsNotInView();

    return (
      <div className={styles.contentWrap}>
        <div
          className={styles.pointerWrap}
          onScroll={this.throttledSetSize}
          ref={tableWrap => {
            this.tableWrap = tableWrap;
          }}>
          <div className={styles.dataPreview}>
            <div className={styles.titleWrapper}>
              <h2 className={styles.previewHeader}>
                {I18n.data_preview.title}
              </h2>
              {numLoadsInProgress > 0 ? <span className="spinner-default" /> : null}
            </div>
            <div className={styles.datasetAttribute}>
              <div className={styles.datasetAttribute}>
                <p>
                  {I18n.data_preview.rows}
                </p>
                <p className={styles.attribute} data-cheetah-hook="total-rows-transformed">
                  {commaify(rowsTransformed)}
                </p>
              </div>
              <div className={styles.datasetAttribute}>
                <p>
                  {I18n.data_preview.columns}
                </p>
                <p className={styles.attribute}>
                  {columns.length}
                </p>
              </div>
            </div>
          </div>

          <Table
            path={params}
            columns={columns}
            inputSchema={inputSchema}
            outputSchema={outputSchema}
            displayState={displayState} />

          {errorsNotInView.toLeft.errorSum > 0 && (
            <ErrorPointer
              errorInfo={errorsNotInView.toLeft}
              direction="left"
              scrollToColIdx={this.scrollToColIdx} />
          )}
          {errorsNotInView.toRight.errorSum > 0 && (
            <ErrorPointer
              errorInfo={errorsNotInView.toRight}
              direction="right"
              scrollToColIdx={this.scrollToColIdx} />
          )}
        </div>
        <PagerBar path={params} displayState={displayState} />
      </div>
    );
  }
}

TablePane.propTypes = {
  columns: PropTypes.array.isRequired,
  inputSchema: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired,
  displayState: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  numLoadsInProgress: PropTypes.number.isRequired
};

export default TablePane;
