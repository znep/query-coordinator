import _ from 'lodash';

/* eslint react/jsx-indent: 0 */
import PropTypes from 'prop-types';

import React, { Component } from 'react';
import { ModalHeader, ModalContent, ModalFooter } from 'common/components';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { hideModal } from 'reduxStuff/actions/modal';
import * as Selectors from 'selectors';
import * as ShowActions from 'reduxStuff/actions/showOutputSchema';
import * as FlashActions from 'reduxStuff/actions/flashMessage';
import { ADD_COLUMN } from 'reduxStuff/actions/apiCalls';
import * as DisplayState from 'lib/displayState';
import FlashMessage from 'containers/FlashMessageContainer';
import ApiCallButton from 'components/ApiCallButton/ApiCallButton';
import ColumnPreview from './ColumnPreview';
import HideOriginal from './HideOriginal';
import ErrorHandling from './ErrorHandling';
import { traverse } from 'lib/ast';
import styles from './GeocodeShortcut.scss';
import flashMessageStyles from 'components/FlashMessage/FlashMessage.scss';

import {
  LatLngFields,
  composeFromLatLng,
  decomposeFromLatLng,
  relevantMappingsForLatLng
} from './LatLngFields';

import {
  CombinedFields,
  composeFromCombined,
  decomposeFromCombined,
  relevantMappingsForCombined
} from './CombinedFields';

import {
  ComponentFields,
  composeFromComponents,
  decomposeFromComponents,
  relevantMappingsForComponents
} from './ComponentFields';

const SubI18n = I18n.show_output_schema.geocode_shortcut;

function generateDefaultMappings(inputColumns, outputColumns) {
  return [
    // geocode func arg name, clads type classifier name
    ['full_address', 'address'],
    ['address', 'address'],
    ['city', 'city'],
    ['state', 'state_or_province'],
    ['zip', 'zip_or_postal']
  ].map(([name, classifier]) => {
    const inputColumn = _.find(inputColumns, ic => ic.semantic_type === classifier);
    let outputColumn;

    if (inputColumn) {
      outputColumn = _.find(outputColumns, oc => {
        const [icId] = oc.transform.transform_input_columns.map(({ input_column_id: id }) => id);
        return icId === inputColumn.id;
      });
    }

    return [name, outputColumn];
  });
}

// Different types of composition strategies
const COMPONENTS = 'COMPONENTS';
const COMBINED = 'COMBINED';
const LATLNG = 'LATLNG';

const fieldSet = (composedFrom, mappings, setMapping, outputColumns) =>
  ({
    LATLNG: <LatLngFields outputColumns={outputColumns} setMapping={setMapping} mappings={mappings} />,
    COMPONENTS: <ComponentFields outputColumns={outputColumns} setMapping={setMapping} mappings={mappings} />,
    COMBINED: <CombinedFields outputColumns={outputColumns} setMapping={setMapping} mappings={mappings} />
  }[composedFrom]);

export class GeocodeShortcut extends Component {
  constructor() {
    super();
    this.state = {
      mappings: [],
      composedFrom: COMPONENTS,
      shouldHideOriginal: false,
      shouldConvertToNull: false
    };
    _.bindAll(this, ['setMapping', 'toggleConvertToNull', 'toggleHideOriginal', 'toggleErrorDisplayState']);
  }

  componentWillMount() {
    const { path: { outputSchemaId } } = this.props;
    this.setOutputSchema(outputSchemaId);
  }

  componentDidMount() {
    this.maybeSetColumnsHidden();
  }

  setMapping(addressComponent, outputColumn) {
    const mappings = this.state.mappings
      .filter(([component]) => component !== addressComponent)
      .concat([[addressComponent, outputColumn]]);
    this.setState({
      ...this.state,
      mappings
    });
  }

  setOutputSchema(outputSchemaId) {
    const { entities } = this.props;
    // TODO: this is awful and terrible - maybe ping ryan about this
    // question: it's hard to know which column we want here
    const outputColumn = _.find(Selectors.columnsForOutputSchema(entities, outputSchemaId), oc =>
      traverse(oc.transform.parsed_expr, false, (node, acc) => {
        if ((node && node.function_name === 'geocode') || (node && node.function_name === 'make_point')) {
          return node;
        }
        return acc;
      })
    );

    this.setState({
      ...this.getMappingsFromOutputColumn(outputColumn),
      ...this.getErrorForgivenessFromOutputColumn(outputColumn),
      ...this.getDisplayState(outputSchemaId),
      outputColumnId: outputColumn && outputColumn.id,
      outputSchemaId
    });
  }

  getDisplayState(outputSchemaId) {
    return {
      displayState: DisplayState.normal(1, outputSchemaId)
    };
  }

  getOutputSchema() {
    const id = this.state.outputSchemaId || this.props.path.outputSchemaId;
    return this.props.entities.output_schemas[id];
  }

  getErrorForgivenessFromOutputColumn(outputColumn) {
    if (outputColumn && outputColumn.transform && outputColumn.transform.parsed_expr) {
      const { parsed_expr: ast } = outputColumn.transform;
      // If the wrapping function is forgive, we're converting geocoding
      // errors into null values
      const shouldConvertToNull = ast.function_name === 'forgive';
      return { shouldConvertToNull };
    }
    return { shouldConvertToNull: false };
  }

  getMappingsFromOutputColumn(outputColumn) {
    if (outputColumn && outputColumn.transform && outputColumn.transform.parsed_expr) {
      const { parsed_expr: ast } = outputColumn.transform;
      // Now we need to seed the column mapping, so we need to walk the ast
      // until we find the `geocode` function and pluck its arguments out
      const geocodeFunc = traverse(ast, false, (node, acc) => {
        if (node && node.function_name === 'geocode') {
          return node;
        }
        return acc;
      });

      // This is a limitation of the Geocode shortcut -
      // each arg has to be a column, nothing else will
      // work
      if (geocodeFunc) {
        return this.getStateFromGeocodeFuncAst(geocodeFunc);
      }

      // So we haven't found an output column that is derived from geocoding - so
      // let's try to fill the third tab in this dialog with a make_point
      // output column
      const makePointFunc = traverse(ast, false, (node, acc) => {
        if (node && node.function_name === 'make_point') {
          return node;
        }
        return acc;
      });

      if (makePointFunc) {
        return this.getStateFromMakePointAst(makePointFunc);
      }
    }
    return {
      mappings: generateDefaultMappings(
        Selectors.columnsForInputSchema(this.props.entities, this.props.path.inputSchemaId),
        this.getOutputColumns()
      )
    };
  }

  getStateFromGeocodeFuncAst(geocodeFunc) {
    if (geocodeFunc.args.length === 1) {
      return {
        mappings: decomposeFromCombined(geocodeFunc, this.getOutputColumns()),
        composedFrom: COMBINED
      };
    } else if (geocodeFunc.args.length === 4) {
      // Now we want to set the mappings from the component name to the input column
      // referred to in the AST
      return {
        mappings: decomposeFromComponents(geocodeFunc, this.getOutputColumns()),
        composedFrom: COMPONENTS
      };
    }
    return {
      configurationError: SubI18n.transform_too_complex
    };
  }

  getStateFromMakePointAst(geocodeFunc) {
    return {
      mappings: decomposeFromLatLng(geocodeFunc, this.getOutputColumns()),
      composedFrom: LATLNG
    };
  }

  getOutputColumn() {
    return _.find(
      Selectors.columnsForOutputSchema(this.props.entities, this.getOutputSchema().id),
      ({ id }) => id === this.state.outputColumnId
    );
  }

  getOutputColumns() {
    const { current, ignored } = Selectors.currentAndIgnoredOutputColumns(
      this.props.entities,
      this.getOutputSchema().id
    );

    return current.concat(ignored);
  }

  maybeSetColumnsHidden() {
    // Restore the checkbox state from the output schema state
    const shouldHideOriginal = _.every(
      this.relevantArgsForComposition()
        .filter(oc => !!oc) // filter out nones
        .filter(oc => !_.isString(oc)) // filter out constants
        .map(oc => oc.ignored) // are all the things that are left ignored?
    );

    this.setState({
      shouldHideOriginal
    });
  }

  requireArgsBeColumnRefsOrNull({ args }) {
    return _.every(args, a => a === null || a.type === 'column_ref');
  }

  relevantArgsForComposition() {
    const argsOf = mappingNames =>
      this.state.mappings
        .filter(([name]) => _.includes(mappingNames, name))
        .map(([_name, outputColumn]) => outputColumn); // eslint-disable-line

    switch (this.state.composedFrom) {
      case COMPONENTS:
        return argsOf(relevantMappingsForComponents());
      case COMBINED:
        return argsOf(relevantMappingsForCombined());
      case LATLNG:
        return argsOf(relevantMappingsForLatLng());
      default:
        return [];
    }
  }

  isPreviewable() {
    return this.genNewExpression() === this.genExistingExpr();
  }

  genExistingExpr() {
    const oc = this.getOutputColumn();
    if (oc) {
      const transform = this.props.entities.transforms[oc.transform_id];
      return transform && transform.transform_expr;
    }
  }

  genNewExpression() {
    const maybeForgive = expr => {
      if (this.state.shouldConvertToNull) {
        return `forgive(${expr})`;
      }
      return expr;
    };

    switch (this.state.composedFrom) {
      case COMPONENTS:
        return maybeForgive(composeFromComponents(this.state.mappings));
      case COMBINED:
        return maybeForgive(composeFromCombined(this.state.mappings));
      case LATLNG:
        return maybeForgive(composeFromLatLng(this.state.mappings));
      default:
        throw new Error(`Invalid composition: ${this.state.composedFrom}`);
    }
  }

  genDesiredColumns() {
    let existingColumns = this.getOutputColumns();
    const anyMappings = _.some(
      this.state.mappings.map(([_name, value]) => value !== null) // eslint-disable-line
    );

    if (this.state.shouldHideOriginal) {
      const columnIdsToHide = this.relevantArgsForComposition().filter(oc => !!oc).map(oc => oc.id);
      existingColumns = existingColumns.filter(oc => !_.includes(columnIdsToHide, oc.id));
    }

    let desiredColumns;
    const targetColumn = this.getOutputColumn();
    if (targetColumn) {
      if (!anyMappings) {
        desiredColumns = existingColumns.filter(oc => oc.id !== targetColumn.id);
      } else {
        // We already have a target column - so the default behavior
        // is to replace the existing one with one of a new expression
        desiredColumns = existingColumns.map(oc => {
          if (oc.id === targetColumn.id) {
            // This is the column we want to update - clone it, but with the new expression
            return ShowActions.buildNewOutputColumn(oc, () => this.genNewExpression());
          } else {
            // Otherwise, we just clone it
            return ShowActions.cloneOutputColumn(oc);
          }
        });
      }
    } else {
      desiredColumns = existingColumns.map(ShowActions.cloneOutputColumn);
      if (anyMappings) {
        desiredColumns.push({
          field_name: 'geocoded_column',
          position: desiredColumns.length + 1, // position is 1 based, not 0, because core
          display_name: SubI18n.new_column_name,
          description: '',
          transform: {
            transform_expr: this.genNewExpression()
          },
          is_primary_key: false
        });
      }
    }

    return desiredColumns.map((dc, i) => ({ ...dc, position: i + 1 }));
  }

  createNewOutputSchema() {
    return this.props
      .newOutputSchema(this.props.path.inputSchemaId, this.genDesiredColumns())
      .then(resp => {
        const { resource: { id: outputSchemaId } } = resp;
        this.setOutputSchema(outputSchemaId);
        return resp;
      })
      .catch(resp => {
        const { body } = resp;
        if (body && body.reason) {
          const message = _.flatMap(Object.values(body.reason), errors => errors);
          this.props.showError(message);
        } else {
          console.error(resp);
        }
        return resp;
      });
  }

  toggleHideOriginal() {
    this.setState({
      ...this.state,
      shouldHideOriginal: !this.state.shouldHideOriginal
    });
  }

  toggleConvertToNull() {
    this.setState({
      ...this.state,
      shouldConvertToNull: !this.state.shouldConvertToNull
    });
  }

  toggleErrorDisplayState() {
    const transform = this.getOutputColumn().transform;
    const displayState = DisplayState.inErrorMode(this.state.displayState, transform)
      ? DisplayState.normal(1, this.getOutputSchema().id)
      : DisplayState.columnErrors(transform.id, 1, this.getOutputSchema().id);

    this.setState({
      ...this.state,
      displayState
    });
  }

  isOutputschemaStateDesired() {
    return (
      this.isPreviewable() &&
      this.genDesiredColumns().length === this.getOutputColumns().filter(oc => !oc.ignored).length
    );
  }

  render() {
    const { onDismiss, path, entities, redirectToOutputSchema } = this.props;
    const { mappings, shouldHideOriginal, shouldConvertToNull, composedFrom, displayState } = this.state;
    const outputColumns = this.getOutputColumns();
    const outputColumn = this.getOutputColumn();
    const headerProps = {
      title: SubI18n.title,
      className: styles.header,
      onDismiss: onDismiss
    };
    const { inputSchemaId } = path;
    const inputSchema = entities.input_schemas[inputSchemaId];

    const onPreview = () => this.createNewOutputSchema();

    const onSave = () => {
      // isPreviewable will be true when the expression the user has built is the same as
      // the target output column; ie: they have hit "Preview" and the output column has been
      // created and evaluated
      // we also want to check that they haven't hidden the columns by comparing desired length
      // to actual length
      if (this.isOutputschemaStateDesired()) {
        // The current expression matches the output column,
        // so we have nothing to save,
        // just dismiss
        redirectToOutputSchema(this.getOutputSchema().id);
        onDismiss();
      } else {
        this.createNewOutputSchema().then(resp => {
          redirectToOutputSchema(resp.resource.id);
          onDismiss();
        });
      }
    };

    const isLatLng = composedFrom === LATLNG;
    const isCombined = composedFrom === COMBINED;
    const isComponents = composedFrom === COMPONENTS;

    const composeLatlng = () => this.setState({ ...this.state, composedFrom: LATLNG });
    const latlngClassname = classNames({
      [styles.compositionSelected]: isLatLng,
      [styles.compositionButton]: !isLatLng
    });
    const composeComponents = () => this.setState({ ...this.state, composedFrom: COMPONENTS });
    const componentsClassname = classNames({
      [styles.compositionSelected]: isComponents,
      [styles.compositionButton]: !isComponents
    });
    const composeCombined = () => this.setState({ ...this.state, composedFrom: COMBINED });
    const combinedClassname = classNames({
      [styles.compositionSelected]: isCombined,
      [styles.compositionButton]: !isCombined
    });

    const relevantColumns = this.relevantArgsForComposition();
    const anySelected = relevantColumns.length > 0 && _.some(relevantColumns);

    const content = !this.state.configurationError
      ? <div className={styles.content}>
          <div className={styles.formWrap}>
            <form>
              {fieldSet(this.state.composedFrom, mappings, this.setMapping, outputColumns)}

              <HideOriginal
                shouldHideOriginal={shouldHideOriginal}
                toggleHideOriginal={this.toggleHideOriginal} />

              <ErrorHandling
                shouldConvertToNull={shouldConvertToNull}
                toggleConvertToNull={this.toggleConvertToNull} />
            </form>
          </div>
          <ColumnPreview
            entities={entities}
            anySelected={anySelected}
            outputColumn={outputColumn}
            inputSchema={inputSchema}
            displayState={displayState}
            isPreviewable={this.isPreviewable()}
            onPreview={onPreview}
            onClickError={this.toggleErrorDisplayState}
            path={path} />
        </div>
      : <div className={classNames(flashMessageStyles.error, styles.configurationError)}>
          {this.state.configurationError}
        </div>;

    return (
      <div>
        <ModalHeader {...headerProps} />
        <ModalContent>
          <div className={styles.geocodeOptions}>
            <p>Transform your data into coordinates</p>
            <div className={styles.compositionSelector}>
              <button onClick={composeLatlng} className={latlngClassname}>
                Lat/Long
              </button>
              <button onClick={composeComponents} className={componentsClassname}>
                Address (separated)
              </button>
              <button onClick={composeCombined} className={combinedClassname}>
                Combined Address
              </button>
            </div>
          </div>
          <FlashMessage />
          {content}
        </ModalContent>
        <ModalFooter className={styles.footer}>
          <button onClick={onDismiss} className={styles.cancelButton}>
            Cancel
          </button>
          <ApiCallButton onClick={onSave} className={styles.saveButton} operation={ADD_COLUMN}>
            Save
          </ApiCallButton>
        </ModalFooter>
      </div>
    );
  }
}

GeocodeShortcut.propTypes = {
  onDismiss: PropTypes.func,
  entities: PropTypes.object.isRequired,
  path: PropTypes.object.isRequired,
  newOutputSchema: PropTypes.func.isRequired,
  showError: PropTypes.func.isRequired,
  redirectToOutputSchema: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired
};

const mapStateToProps = ({ entities, ui }, { payload }) => ({
  ...payload,
  entities,
  params: payload.params
});

const mergeProps = (stateProps, { dispatch }, ownProps) => {
  const params = ownProps.payload.params;
  const dispatchProps = {
    onDismiss: () => dispatch(hideModal()),

    newOutputSchema: (inputSchemaId, desiredColumns) =>
      dispatch(ShowActions.newOutputSchema(inputSchemaId, desiredColumns)),

    redirectToOutputSchema: outputSchemaId =>
      dispatch(ShowActions.redirectToOutputSchema(params, outputSchemaId)),

    showError: message => dispatch(FlashActions.showFlashMessage('error', message, 3500))
  };

  return { ...stateProps, ...dispatchProps, ...ownProps };
};

export default connect(mapStateToProps, null, mergeProps)(GeocodeShortcut);
