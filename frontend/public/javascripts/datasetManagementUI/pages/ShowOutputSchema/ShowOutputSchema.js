import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import { browserHistory } from 'react-router';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import { connect } from 'react-redux';
import { interpolate, easeInOutQuad } from 'lib/interpolate';
import { commaify } from '../../../common/formatNumber';
import * as Links from 'links';
import * as Selectors from 'selectors';
import * as Actions from 'reduxStuff/actions/showOutputSchema';
import * as LoadDataActions from 'reduxStuff/actions/loadData';
import { SAVE_CURRENT_OUTPUT_SCHEMA } from 'reduxStuff/actions/apiCalls';
import * as DisplayState from 'lib/displayState';
import Table from 'containers/TableContainer';
import UploadBreadcrumbs from 'containers/UploadBreadcrumbsContainer';
import ReadyToImport from 'containers/ReadyToImportContainer';
import PagerBar from 'containers/PagerBarContainer';
import ErrorPointer from 'components/ErrorPointer/ErrorPointer';
import ApiCallButton from 'containers/ApiCallButtonContainer';
import styles from './ShowOutputSchema.scss';

const COL_WIDTH_PX = 250; // matches style on td in Table.scss
const ERROR_SCROLL_DURATION_MS = 1000;

export class ShowOutputSchema extends Component {
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
    this.setState({
      scrollLeft: this.tableWrap.scrollLeft,
      viewportWidth: this.tableWrap.offsetWidth
    });
  }

  getPath() {
    const {
      source,
      inputSchema,
      outputSchema
    } = this.props;
    return {
      sourceId: source.id,
      inputSchemaId: inputSchema.id,
      outputSchemaId: outputSchema.id
    };
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
      const numErrors = col.transform.num_transform_errors || 0;
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
      revision,
      inputSchema,
      outputSchema,
      columns,
      displayState,
      canApplyRevision,
      numLoadsInProgress,
      saveCurrentOutputSchema,
      goToRevisionBase,
      params
    } = this.props;

    const path = this.getPath();

    const rowsTransformed = inputSchema.total_rows || Selectors.rowsTransformed(columns);

    const errorsNotInView = this.errorsNotInView();

    return (
      <div className={styles.outputSchemaContainer}>
        <Modal fullScreen onDismiss={goToRevisionBase}>
          <ModalHeader onDismiss={goToRevisionBase}>
            <UploadBreadcrumbs />
          </ModalHeader>
          <ModalContent>
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

            <div className={styles.pointerWrap}>
              <div
                className={styles.tableWrap}
                onScroll={this.throttledSetSize}
                ref={tableWrap => {
                  this.tableWrap = tableWrap;
                }}>
                <Table
                  path={path}
                  columns={columns}
                  inputSchema={inputSchema}
                  outputSchema={outputSchema}
                  displayState={displayState} />
              </div>
              {errorsNotInView.toLeft.errorSum > 0 &&
                <ErrorPointer
                  errorInfo={errorsNotInView.toLeft}
                  direction="left"
                  scrollToColIdx={this.scrollToColIdx} />}
              {errorsNotInView.toRight.errorSum > 0 &&
                <ErrorPointer
                  errorInfo={errorsNotInView.toRight}
                  direction="right"
                  scrollToColIdx={this.scrollToColIdx} />}
            </div>
            <PagerBar path={path} displayState={displayState} />
          </ModalContent>

          <ModalFooter>
            {canApplyRevision ? <ReadyToImport /> : <div />}

            <div>
              <ApiCallButton
                onClick={() => saveCurrentOutputSchema(revision, outputSchema.id, params)}
                operation={SAVE_CURRENT_OUTPUT_SCHEMA}
                params={{ outputSchemaId: outputSchema.id }}>
                {I18n.home_pane.save_for_later}
              </ApiCallButton>
            </div>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

ShowOutputSchema.propTypes = {
  revision: PropTypes.object.isRequired,
  source: PropTypes.object.isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  inputSchema: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired,
  displayState: DisplayState.propType.isRequired,
  canApplyRevision: PropTypes.bool.isRequired,
  numLoadsInProgress: PropTypes.number.isRequired,
  goToRevisionBase: PropTypes.func.isRequired,
  saveCurrentOutputSchema: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
  params: PropTypes.shape({
    revisionSeq: PropTypes.string.isRequired,
    outputSchemaId: PropTypes.string.isRequired
  }).isRequired
};

export function mapStateToProps(state, ownProps) {
  const params = ownProps.params;
  const entities = state.entities;

  const revisionSeq = _.toNumber(params.revisionSeq);
  const revision = _.find(entities.revisions, { fourfour: params.fourfour, revision_seq: revisionSeq });
  const outputSchemaId = _.toNumber(params.outputSchemaId);
  const source = entities.sources[_.toNumber(params.sourceId)];
  const inputSchema = entities.input_schemas[_.toNumber(params.inputSchemaId)];
  const outputSchema = entities.output_schemas[params.outputSchemaId];

  const columns = Selectors.columnsForOutputSchema(entities, outputSchemaId);
  const canApplyRevision = Selectors.allTransformsDone(columns, inputSchema);

  return {
    revision,
    source,
    inputSchema,
    outputSchema,
    columns,
    canApplyRevision,
    numLoadsInProgress: Selectors.rowLoadOperationsInProgress(state.ui.apiCalls),
    displayState: DisplayState.fromUiUrl(_.pick(ownProps, ['params', 'route'])),
    params
  };
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    goToRevisionBase: () => {
      browserHistory.push(Links.revisionBase(ownProps.params));
    },
    saveCurrentOutputSchema: (revision, outputSchemaId, params) => {
      dispatch(Actions.saveCurrentOutputSchemaId(revision, outputSchemaId, params))
        .then(() => {
          browserHistory.push(Links.revisionBase(ownProps.params));
        });
    },
    dispatch
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowOutputSchema);
