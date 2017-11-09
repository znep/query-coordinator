/* eslint react/no-multi-comp: 0 */
/* eslint react/prop-types: 0 */
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
import * as ModalActions from 'reduxStuff/actions/modal';
import * as FormActions from 'reduxStuff/actions/forms';
import FatalError from 'containers/FatalErrorContainer';
import OutputSchemaSidebar from 'components/OutputSchemaSidebar/OutputSchemaSidebar';
import SaveOutputSchemaButton from './SaveOutputSchemaButton';
import SaveParseOptionsButton from './SaveParseOptionsButton';
import SaveColButton from './SaveColButton';
import styles from './ShowOutputSchema.scss';

export class ShowOutputSchema extends Component {
  saveButtonForOption() {
    let currentPage;

    if (this.props.location) {
      currentPage = this.props.location.pathname
        .split('?')
        .shift()
        .split('/')
        .pop();
    }

    switch (currentPage) {
      case 'parse_options':
        return <SaveParseOptionsButton {...this.props} />;
      case 'add_col':
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
    const { canApplyRevision, fatalError, goToRevisionBase, params, showShortcut } = this.props;

    return (
      <div className={styles.outputSchemaContainer}>
        <Modal fullScreen onDismiss={goToRevisionBase}>
          <ModalHeader onDismiss={goToRevisionBase}>
            <SourceBreadcrumbs />
          </ModalHeader>
          <ModalContent>
            <OutputSchemaSidebar params={params} showShortcut={showShortcut} />
            {this.props.children &&
              React.cloneElement(this.props.children, {
                ...this.props
              })}
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
  children: PropTypes.object.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string.isRequrired
  }),
  revision: PropTypes.object.isRequired,
  source: PropTypes.object.isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  inputSchema: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired,
  displayState: DisplayState.propType.isRequired,
  canApplyRevision: PropTypes.bool.isRequired,
  fatalError: PropTypes.bool.isRequired,
  parseOptionsForm: PropTypes.object.isRequired,
  addColForm: PropTypes.object.isRequired,
  numLoadsInProgress: PropTypes.number.isRequired,
  goToRevisionBase: PropTypes.func.isRequired,
  saveCurrentOutputSchema: PropTypes.func.isRequired,
  addCol: PropTypes.func.isRequired,
  showShortcut: PropTypes.func.isRequired,
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

  const addColForm = state.ui.forms.addColForm;

  return {
    revision,
    source,
    inputSchema,
    outputSchema,
    parseOptionsForm,
    columns,
    canApplyRevision,
    fatalError,
    addColForm,
    numLoadsInProgress: Selectors.rowLoadOperationsInProgress(state.ui.apiCalls),
    displayState: DisplayState.fromUiUrl(_.pick(ownProps, ['params', 'route'])),
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
    saveCurrentParseOptions: (params, source, parseOptions) => {
      dispatch(updateSourceParseOptions(params, source, parseOptions));
    },
    addCol: () =>
      dispatch(Actions.addCol(stateProps.addColForm.state, ownProps.params)).then(resp => {
        const { resource: os } = resp;

        const newParams = {
          ...ownProps.params,
          outputSchemaId: os.id
        };

        dispatch(FormActions.setFormState('addColForm', {}));

        dispatch(FormActions.clearInternalState('addColForm', true));

        browserHistory.push(Links.showAddCol(newParams));
      }),
    showShortcut: name => {
      dispatch(
        ModalActions.showModal(name, {
          displayState: stateProps.displayState,
          params: stateProps.params
        })
      );
    },

    dispatch
  };
}

// This madness is to to keep the entire ShowOutputSchema from re-rendering ever
// time form state changes. We have to map the form state to the props of this component
// because of the evil modal-submit button. If we can get rid of that, we can get rid
// of this.
const wrapper = Wrapped => {
  return class extends Component {
    shouldComponentUpdate(nextProps) {
      const stuffToOmit = [
        'addColForm',
        'addCol',
        'showShortcut',
        'saveCurrentParseOptions',
        'saveCurrentOutputSchema',
        'goToRevisionBase'
      ];
      const otherNewProps = _.omit(nextProps, stuffToOmit);
      const otherOldProps = _.omit(this.props, stuffToOmit);

      return (
        !_.isEqual(otherNewProps, otherOldProps) ||
        nextProps.addColForm.isDirty !== this.props.addColForm.isDirty
      );
    }

    render() {
      return <Wrapped {...this.props} />;
    }
  };
};

export default connect(mapStateToProps, null, mergeProps)(wrapper(ShowOutputSchema));
