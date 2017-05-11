import React, { PropTypes, Component } from 'react';
import { Link } from 'react-router';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'socrata-components';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';

import { commaify } from '../../common/formatNumber';
import * as Links from '../links';
import * as Selectors from '../selectors';
import * as LoadDataActions from '../actions/loadData';
import { setOutputSchemaId } from 'actions/routing';
import * as DisplayState from '../lib/displayState';
import Table from './Table';
import ReadyToImport from './ReadyToImport';
import PagerBar from './Table/PagerBar';
import SocrataIcon from '../../common/components/SocrataIcon';
import styles from 'styles/ShowOutputSchema.scss';

function query(db, uploadId, inputSchemaId, outputSchemaIdStr) {
  const outputSchemaId = _.toNumber(outputSchemaIdStr);
  const upload = db.uploads[_.toNumber(uploadId)];
  const inputSchema = db.input_schemas[_.toNumber(inputSchemaId)];
  const outputSchema = db.output_schemas[outputSchemaId];

  const columns = Selectors.columnsForOutputSchema(db, outputSchemaId);
  const canApplyRevision = Selectors.allTransformsDone(columns, inputSchema);

  return {
    db,
    upload,
    inputSchema,
    outputSchema,
    columns,
    canApplyRevision
  };
}

export class ShowOutputSchema extends Component {

  componentDidMount() {
    const { displayState, dispatch, urlParams } = this.props;

    dispatch(LoadDataActions.loadVisibleData(displayState));

    if (urlParams.outputSchemaId) {
      dispatch(setOutputSchemaId(_.toNumber(urlParams.outputSchemaId)));
    }
  }

  componentWillReceiveProps(nextProps) {
    const { dispatch, urlParams } = this.props;
    const { urlParams: nextUrlParams, displayState } = nextProps;

    const oldOutputSchemaId = urlParams.outputSchemaId;
    const newOutputSchemaId = nextUrlParams.outputSchemaId;

    if (oldOutputSchemaId !== newOutputSchemaId) {
      dispatch(setOutputSchemaId(_.toNumber(newOutputSchemaId)));
    }

    dispatch(LoadDataActions.loadVisibleData(displayState));
  }

  render() {
    const {
      db,
      upload,
      inputSchema,
      outputSchema,
      columns,
      displayState,
      canApplyRevision,
      numLoadsInProgress,
      goHome,
      routing
    } = this.props;

    const path = {
      uploadId: upload.id,
      inputSchemaId: inputSchema.id,
      outputSchemaId: outputSchema.id
    };

    const modalProps = {
      fullScreen: true,
      onDismiss: goHome
    };
    // TODO: a good candidate for a component since reused elsewhere
    const headerProps = {
      title: (
        <ol className={styles.list}>
          <li>
              {I18n.home_pane.data}
            <SocrataIcon name="arrow-right" className={styles.icon} />
          </li>
          <li className={styles.active}>
            {I18n.home_pane.preview}
          </li>
        </ol>
      ),
      onDismiss: goHome
    };

    const rowsTransformed = inputSchema.total_rows || Selectors.rowsTransformed(columns);

    return (
      <div className={styles.outputSchemaContainer}>
        <Modal {...modalProps}>
          <ModalHeader {...headerProps} />

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
                  <p>{I18n.data_preview.rows}</p>
                  <p
                    className={styles.attribute}
                    data-cheetah-hook="total-rows-transformed">{commaify(rowsTransformed)}</p>
                </div>
                <div className={styles.datasetAttribute}>
                  <p>{I18n.data_preview.columns}</p>
                  <p className={styles.attribute}>{columns.length}</p>
                </div>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <Table
                db={db}
                path={path}
                columns={columns}
                inputSchema={inputSchema}
                outputSchema={outputSchema}
                displayState={displayState} />
            </div>
            <PagerBar
              path={path}
              routing={routing}
              displayState={displayState} />
          </ModalContent>

          <ModalFooter>
            {canApplyRevision ?
              <ReadyToImport /> :
              <div />}

            <div>
              <Link to={Links.home}>
                <button
                  className={styles.saveBtn}>
                  {I18n.home_pane.save_for_later}
                </button>
              </Link>
            </div>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

ShowOutputSchema.propTypes = {
  db: PropTypes.object.isRequired,
  upload: PropTypes.object.isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  inputSchema: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired,
  displayState: DisplayState.propType.isRequired,
  canApplyRevision: PropTypes.bool.isRequired,
  numLoadsInProgress: PropTypes.number.isRequired,
  goHome: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
  routing: PropTypes.object.isRequired,
  urlParams: PropTypes.shape({
    outputSchemaId: PropTypes.string
  })
};

function mapStateToProps(state, ownProps) {
  const params = ownProps.params;
  const queryResults = query(
    state.db,
    _.toNumber(params.uploadId),
    _.toNumber(params.inputSchemaId),
    _.toNumber(params.outputSchemaId)
  );
  return {
    ...queryResults,
    numLoadsInProgress: Selectors.rowLoadOperationsInProgress(state.apiCalls),
    displayState: DisplayState.fromUiUrl(_.pick(ownProps, ['params', 'route'])),
    routing: ownProps.location,
    urlParams: ownProps.params
  };
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    goHome: () => {
      dispatch(push(Links.home(ownProps.location)));
    },
    dispatch
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowOutputSchema);
