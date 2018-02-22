import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import { connect } from 'react-redux';
import * as Links from 'datasetManagementUI/links/links';
import * as Selectors from 'datasetManagementUI/selectors';
import * as Actions from 'datasetManagementUI/reduxStuff/actions/showOutputSchema';
import { updateSourceParseOptions } from 'datasetManagementUI/reduxStuff/actions/createSource';
import * as DisplayState from 'datasetManagementUI/lib/displayState';
import SourceBreadcrumbs from 'datasetManagementUI/containers/SourceBreadcrumbsContainer';
import ReadyToImport from 'datasetManagementUI/containers/ReadyToImportContainer';
import * as FormActions from 'datasetManagementUI/reduxStuff/actions/forms';
import * as FlashActions from 'datasetManagementUI/reduxStuff/actions/flashMessage';
import FatalError from 'datasetManagementUI/containers/FatalErrorContainer';
import OutputSchemaSidebar from 'datasetManagementUI/components/OutputSchemaSidebar/OutputSchemaSidebar';
import SaveOutputSchemaButton from './SaveOutputSchemaButton';
import SaveParseOptionsButton from './SaveParseOptionsButton';
import SaveGeocodeShortcutButton from './SaveGeocodeShortcutButton';
import SaveColButton from './SaveColButton';
import styles from './ShowOutputSchema.module.scss';
import { editRevision, updateRevision } from 'datasetManagementUI/reduxStuff/actions/revisions';

function getCurrentPane(location) {
  if (_.includes(location.pathname, 'georeference')) {
    return 'geocodeShortcut';
  }
  if (_.includes(location.pathname, 'parse_options')) {
    return 'parseOptions';
  }
  if (_.includes(location.pathname, 'add_col')) {
    return 'addColumn';
  }
  return 'tablePreview';
}

export class ShowOutputSchema extends Component {
  saveButtonForOption() {
    const currentPane = getCurrentPane(this.props.location);
    switch (currentPane) {
      case 'parseOptions':
        return <SaveParseOptionsButton {...this.props} />;
      case 'geocodeShortcut':
        return <SaveGeocodeShortcutButton {...this.props} />;
      case 'addColumn':
        return (
          <SaveColButton
            handleClick={this.props.addCol}
            isDirty={this.props.addColForm.isDirty}
            callParams={{ outputSchemaId: this.props.outputSchema.id }} />
        );
      default:
        return <SaveOutputSchemaButton {...this.props} />;
    }
  }

  render() {
    const { canApplyRevision, fatalError, goToRevisionBase, editMode, params } = this.props;

    const currentPane = getCurrentPane(this.props.location);
    const onTablePreview = currentPane === 'tablePreview';

    return (
      <div className={`${styles.outputSchemaContainer} output-schema-container`}>
        <Modal fullScreen onDismiss={goToRevisionBase}>
          <ModalHeader onDismiss={goToRevisionBase}>
            <SourceBreadcrumbs />
          </ModalHeader>

          <ModalContent className={styles.modalContent}>
            <OutputSchemaSidebar editMode={editMode} params={params} />
            {this.props.children &&
              React.cloneElement(this.props.children, {
                ...this.props
              })}
          </ModalContent>

          <ModalFooter className={onTablePreview ? styles.modalFooter : styles.modalFooterAlt}>
            {canApplyRevision && onTablePreview ? <ReadyToImport /> : null}
            {fatalError && onTablePreview ? <FatalError /> : null}
            {!fatalError ? this.saveButtonForOption() : null}
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

ShowOutputSchema.propTypes = {
  children: PropTypes.object.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequrired
  }),
  revision: PropTypes.object.isRequired,
  source: PropTypes.object.isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  inputSchema: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired,
  editMode: PropTypes.bool.isRequired,
  displayState: DisplayState.propType.isRequired,
  canApplyRevision: PropTypes.bool.isRequired,
  fatalError: PropTypes.bool.isRequired,
  parseOptionsForm: PropTypes.object.isRequired,
  addColForm: PropTypes.object.isRequired,
  numLoadsInProgress: PropTypes.number.isRequired,
  goToRevisionBase: PropTypes.func.isRequired,
  saveCurrentOutputSchema: PropTypes.func.isRequired,
  addCol: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
  params: PropTypes.shape({
    revisionSeq: PropTypes.string.isRequired,
    outputSchemaId: PropTypes.string.isRequired,
    option: PropTypes.string
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

  const latestOutputSchema = _.max(_.filter(
    entities.output_schemas, { input_schema_id: inputSchema.id }
  ).map(oc => oc.id));

  const columns = Selectors.columnsForOutputSchema(entities, outputSchemaId);
  const canApplyRevision = !!outputSchema.finished_at;
  const fatalError = !!source.failed_at || _.some(columns.map(c => c.transform.failed_at));

  const parseOptionsForm = state.ui.forms.parseOptionsForm;

  const { addColForm, geocodeShortcutForm } = state.ui.forms;

  return {
    revision,
    source,
    editMode: entities.views[params.fourfour].displayType !== 'draft',
    inputSchema,
    outputSchema,
    latestOutputSchema,
    flashVisible: state.ui.flashMessage.visible,
    parseOptionsForm,
    columns,
    canApplyRevision,
    fatalError,
    addColForm,
    geocodeShortcutForm,
    numLoadsInProgress: Selectors.rowLoadOperationsInProgress(state.ui.apiCalls),
    displayState: DisplayState.fromUiUrl(_.pick(ownProps, ['params', 'location'])),
    params
  };
}

function mergeProps(stateProps, { dispatch }, ownProps) {
  return {
    ...stateProps,
    ...ownProps,
    goToRevisionBase: () => {
      browserHistory.push(Links.revisionBase(ownProps.params));
    },
    saveCurrentOutputSchema: (revision, outputSchemaId, params) => {
      dispatch(Actions.saveCurrentOutputSchemaId(revision, outputSchemaId, params)).then(() => {
        browserHistory.push(Links.revisionBase(ownProps.params));
      });
    },
    revertRevisionOutputSchema: (outputSchemaId, currentOutputSchemaId = null) => {
      const updateObj = { blob_id: null, output_schema_id: outputSchemaId };
      // update the revision on the server
      return dispatch(updateRevision(updateObj, ownProps.params))
        .then(resp => {
          // update the revision in the locall UI state
          dispatch(
            editRevision(resp.resource.id, { output_schema_id: outputSchemaId })
          );

          // update the url browser history to reflect the reverted schema ID
          const newPathname = Links.changeOutputSchema(currentOutputSchemaId, outputSchemaId);
          if (newPathname) {
            browserHistory.push(newPathname);
          }
          return resp;
        });
    },
    redirectToOutputSchema: (outputSchemaId) => {
      dispatch(Actions.redirectToOutputSchema(stateProps.params, outputSchemaId));
    },
    saveCurrentParseOptions: (params, source, parseOptions) => {
      dispatch(updateSourceParseOptions(params, source, parseOptions));
    },
    newOutputSchema: (desiredColumns) =>
      dispatch(Actions.newOutputSchema(stateProps.inputSchema.id, desiredColumns)),

    addCol: () =>
      dispatch(Actions.addCol(stateProps.addColForm.state, ownProps.params))
        .then(resp => {
          const { resource: os } = resp;

          const newParams = {
            ...ownProps.params,
            outputSchemaId: os.id
          };

          dispatch(FormActions.setFormState('addColForm', {}));

          dispatch(FormActions.clearInternalState('addColForm', true));

          dispatch(FlashActions.showFlashMessage('success', I18n.add_col.success_flash_message));

          browserHistory.push(Links.showAddCol(newParams));
        })
        .catch(() => dispatch(FlashActions.showFlashMessage('error', I18n.add_col.error_flash_message))),

    dispatch
  };
}

export default connect(mapStateToProps, null, mergeProps)(ShowOutputSchema);
