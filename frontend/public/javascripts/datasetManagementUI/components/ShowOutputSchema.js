import React, { PropTypes, Component } from 'react';
import { Link } from 'react-router';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'socrata-components';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';

import { commaify } from '../../common/formatNumber';
import * as Links from '../links';
import * as Selectors from '../selectors';
import * as ShowActions from '../actions/showOutputSchema';
import * as ApplyActions from '../actions/applyUpdate';
import * as LoadDataActions from '../actions/loadData';
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

  const canApplyUpdate = columns.every((column) => {
    return column.transform.contiguous_rows_processed &&
      column.transform.contiguous_rows_processed === inputSchema.total_rows;
  });

  return {
    db,
    upload,
    inputSchema,
    outputSchema,
    columns,
    canApplyUpdate
  };
}


class ShowOutputSchema extends Component {

  componentDidMount() {
    this.dispatchDataLoad(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.dispatchDataLoad(nextProps);
  }

  dispatchDataLoad(props) {
    props.dispatch(
      LoadDataActions.loadVisibleData(props.outputSchema.id, props.displayState)
    );
  }

  render() {
    const {
      db,
      upload,
      inputSchema,
      outputSchema,
      columns,
      displayState,
      canApplyUpdate,
      numLoadsInProgress,
      goHome,
      updateColumnType,
      applyUpdate,
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
            <Link to={Links.uploads}>
              {I18n.home_pane.data}
            </Link>
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
                <h3>
                  {I18n.data_preview.title}
                </h3>
                {numLoadsInProgress > 0 ? <span className="spinner-default" /> : null}
              </div>
              <div className={styles.datasetAttribute}>
                <div className={styles.datasetAttribute}>
                  <p>{I18n.data_preview.columns}</p>
                  <p className={styles.attribute}>{columns.length}</p>
                </div>
                <div className={styles.datasetAttribute}>
                  <p>{I18n.data_preview.rows}</p>
                  <p className={styles.attribute}>{commaify(rowsTransformed)}</p>
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
                displayState={displayState}
                updateColumnType={updateColumnType} />
            </div>
            <PagerBar
              path={path}
              routing={routing}
              displayState={displayState} />
          </ModalContent>

          <ModalFooter>
            {canApplyUpdate ?
              <ReadyToImport
                db={db}
                outputSchema={outputSchema} /> :
              <div />}

            <div>
              <Link to={Links.home}>
                <button
                  className={styles.saveBtn}>
                  {I18n.home_pane.save_for_later}
                </button>
              </Link>

              <button
                onClick={applyUpdate}
                disabled={!canApplyUpdate}
                className={styles.processBtn}>
                {I18n.home_pane.process_data}
              </button>
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
  displayState: PropTypes.object.isRequired,
  canApplyUpdate: PropTypes.bool.isRequired,
  numLoadsInProgress: PropTypes.number.isRequired,
  goHome: PropTypes.func.isRequired,
  updateColumnType: PropTypes.func.isRequired,
  applyUpdate: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
  routing: PropTypes.object.isRequired
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
    numLoadsInProgress: Selectors.numLoadsInProgress(state.db),
    displayState: DisplayState.fromUiUrl(_.pick(ownProps, ['params', 'route'])),
    routing: ownProps.location
  };
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    updateColumnType: (oldSchema, oldColumn, newType) => {
      dispatch(ShowActions.updateColumnType(oldSchema, oldColumn, newType));
    },
    goHome: () => {
      dispatch(push(Links.home(ownProps.location)));
    },
    applyUpdate: () => (
      dispatch(ApplyActions.applyUpdate(_.toNumber(ownProps.params.outputSchemaId)))
    ),
    dispatch
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowOutputSchema);
