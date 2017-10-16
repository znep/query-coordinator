import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { browserHistory } from 'react-router';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components';
import { connect } from 'react-redux';
import * as Links from 'links/links';
import * as Selectors from 'selectors';
import * as Actions from 'reduxStuff/actions/showOutputSchema';
import { updateSourceParseOptions } from 'reduxStuff/actions/createSource';
import * as DisplayState from 'lib/displayState';
import SourceBreadcrumbs from 'containers/SourceBreadcrumbsContainer';
import ReadyToImport from 'containers/ReadyToImportContainer';
import FatalError from 'containers/FatalErrorContainer';
import OutputSchemaSidebar from 'components/OutputSchemaSidebar/OutputSchemaSidebar';
import TablePane from './TablePane';
import SaveOutputSchemaButton from './SaveOutputSchemaButton';
import ParseOptionsPane from './ParseOptionsPane';
import SaveParseOptionsButton from './SaveParseOptionsButton';
import styles from './ShowOutputSchema.scss';

export class ShowOutputSchema extends Component {
  isOnParseOptionsPage() {
    return this.props.params.option === 'parse_options';
  }

  contentForOption() {
    if (this.isOnParseOptionsPage()) {
      return <ParseOptionsPane {...this.props} />;
    }
    return <TablePane {...this.props} />;
  }

  saveButtonForOption() {
    if (this.isOnParseOptionsPage()) {
      return <SaveParseOptionsButton {...this.props} />;
    }
    return <SaveOutputSchemaButton {...this.props} />;
  }

  render() {
    const { canApplyRevision, fatalError, goToRevisionBase, params } = this.props;

    return (
      <div className={styles.outputSchemaContainer}>
        <Modal fullScreen onDismiss={goToRevisionBase}>
          <ModalHeader onDismiss={goToRevisionBase}>
            <SourceBreadcrumbs />
          </ModalHeader>
          <ModalContent>
            <OutputSchemaSidebar params={params} page={params.option || 'output_schema'} />
            {this.contentForOption()}
          </ModalContent>

          <ModalFooter>
            {canApplyRevision ? <ReadyToImport /> : null}
            {fatalError ? <FatalError /> : null}

            {!fatalError ? this.saveButtonForOption() : null}
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
  fatalError: PropTypes.bool.isRequired,
  parseOptionsForm: PropTypes.object.isRequired,
  numLoadsInProgress: PropTypes.number.isRequired,
  goToRevisionBase: PropTypes.func.isRequired,
  saveCurrentOutputSchema: PropTypes.func.isRequired,
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

  const columns = Selectors.columnsForOutputSchema(entities, outputSchemaId);
  const canApplyRevision = Selectors.allTransformsDone(columns);

  const fatalError = !!source.failed_at || _.some(columns.map(c => c.transform.failed_at));

  const parseOptionsForm = state.ui.forms.parseOptionsForm;

  return {
    revision,
    source,
    inputSchema,
    outputSchema,
    parseOptionsForm,
    columns,
    canApplyRevision,
    fatalError,
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
      dispatch(Actions.saveCurrentOutputSchemaId(revision, outputSchemaId, params)).then(() => {
        browserHistory.push(Links.revisionBase(ownProps.params));
      });
    },
    saveCurrentParseOptions: (params, source, parseOptions) => {
      dispatch(updateSourceParseOptions(params, source, parseOptions));
    },
    dispatch
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowOutputSchema);
