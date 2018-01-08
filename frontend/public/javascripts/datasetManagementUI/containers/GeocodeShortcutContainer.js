/* eslint react/jsx-indent: 0 */
import _ from 'lodash';
import * as Links from '../links/links';
import { connect } from 'react-redux';
import { hideModal } from 'reduxStuff/actions/modal';
import * as Selectors from 'selectors';
import * as ShowActions from 'reduxStuff/actions/showOutputSchema';
import * as FlashActions from 'reduxStuff/actions/flashMessage';
import * as FormActions from 'reduxStuff/actions/forms';
import * as DisplayState from 'lib/displayState';
import { traverse } from 'lib/ast';
import { browserHistory } from 'react-router';
import { GeocodeShortcut, COMPONENTS, COMBINED, LATLNG } from 'components/GeocodeShortcut/GeocodeShortcut';

import {
  composeFromLatLng,
  decomposeFromLatLng,
  relevantMappingsForLatLng
} from 'components/GeocodeShortcut/LatLngFields';

import {
  composeFromCombined,
  decomposeFromCombined,
  relevantMappingsForCombined
} from 'components/GeocodeShortcut/CombinedFields';

import {
  composeFromComponents,
  decomposeFromComponents,
  relevantMappingsForComponents
} from 'components/GeocodeShortcut/ComponentFields';

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

function getOutputSchema(entities, props) {
  const id = _.toNumber(props.params.outputSchemaId);
  return entities.output_schemas[id];
}

function getAllOutputColumns(entities, inputSchemaId) {
  return Selectors.outputColumnsForInputSchemaUniqByTransform(
    entities,
    inputSchemaId
  );
}

function getOutputColumn(entities, outputSchema) {
  // TODO: this is awful and terrible - maybe ping ryan about this
  // question: it's hard to know which column we want here
  const outputColumn = _.find(Selectors.columnsForOutputSchema(entities, outputSchema.id), oc =>
    traverse(oc.transform.parsed_expr, false, (node, acc) => {
      if ((node && node.function_name === 'geocode') || (node && node.function_name === 'make_point')) {
        return node;
      }
      return acc;
    })
  );
  return outputColumn;
}

// Restore a form state from a target output column (which has a transform, which has an AST)
export function buildDefaultFormState(
  view,
  entities,
  inputColumns,
  outputSchema,
  outputColumns,
  allOutputColumns,
  outputColumn
) {
  let formState = getMappingsFromOutputColumn(
    inputColumns,
    outputColumns,
    allOutputColumns,
    outputColumn
  );

  formState = {
    ...formState,
    ...getShouldHideOriginalFromOutputColumn(entities, outputSchema, outputColumn, formState),
    ...getErrorForgivenessFromOutputColumn(outputColumn)
  };

  const desiredColumns = genDesiredColumns(
    view,
    outputColumns,
    outputColumn,
    formState
  );

  return { ...formState, desiredColumns };
}

function getStateFromGeocodeFuncAst(geocodeFunc, allOutputColumns) {
  if (geocodeFunc.args.length === 1) {
    return {
      mappings: decomposeFromCombined(geocodeFunc, allOutputColumns),
      composedFrom: COMBINED
    };
  } else if (geocodeFunc.args.length === 4) {
    // Now we want to set the mappings from the component name to the input column
    // referred to in the AST
    return {
      mappings: decomposeFromComponents(geocodeFunc, allOutputColumns),
      composedFrom: COMPONENTS
    };
  }
  return {
    configurationError: SubI18n.transform_too_complex
  };
}

function getStateFromMakePointAst(geocodeFunc, allOutputColumns) {
  return {
    mappings: decomposeFromLatLng(geocodeFunc, allOutputColumns),
    composedFrom: LATLNG
  };
}

function getMappingsFromOutputColumn(inputColumns, outputColumns, allOutputColumns, outputColumn) {
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
      return getStateFromGeocodeFuncAst(geocodeFunc, allOutputColumns);
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
      return getStateFromMakePointAst(makePointFunc, allOutputColumns);
    }
  }
  return {
    mappings: generateDefaultMappings(inputColumns, outputColumns),
    composedFrom: COMPONENTS
  };
}

function relevantArgsForComposition(formState) {
  const argsOf = mappingNames =>
      formState.mappings
      .filter(([name]) => _.includes(mappingNames, name))
      .map(([_name, outputColumn]) => outputColumn); // eslint-disable-line

  switch (formState.composedFrom) {
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

function getShouldHideOriginalFromOutputColumn(entities, outputSchema, outputColumn, formState) {
  const isOcInOutputSchema = (oc) => {
    return !!entities.output_schema_columns[`${outputSchema.id}-${oc.id}`];
  };

  const shouldHideOriginal = _.every(
    relevantArgsForComposition(formState)
      .filter(oc => !!oc) // filter out nones
      .filter(oc => !_.isString(oc)) // filter out constants
      .map(oc => !isOcInOutputSchema(oc)) // are all the things that are left not in current os?
  );

  return { shouldHideOriginal };
}

function getErrorForgivenessFromOutputColumn(outputColumn) {
  if (outputColumn && outputColumn.transform && outputColumn.transform.parsed_expr) {
    const { parsed_expr: ast } = outputColumn.transform;
    // If the wrapping function is forgive, we're converting geocoding
    // errors into null values
    const shouldConvertToNull = ast.function_name === 'forgive';
    return { shouldConvertToNull };
  }
  return { shouldConvertToNull: false };
}

export function genNewExpression(view, formState) {
  const maybeForgive = expr => {
    if (formState.shouldConvertToNull) {
      return `forgive(${expr})`;
    }
    return expr;
  };

  switch (formState.composedFrom) {
    case COMPONENTS:
      return maybeForgive(composeFromComponents(formState.mappings, isObe(view)));
    case COMBINED:
      return maybeForgive(composeFromCombined(formState.mappings, isObe(view)));
    case LATLNG:
      return maybeForgive(composeFromLatLng(formState.mappings, isObe(view)));
    default:
      throw new Error(`Invalid composition: ${formState.composedFrom}`);
  }
}

function isObe(view) {
  if (view.displayType === 'draft') {
    return window.serverConfig.featureFlags.ingress_strategy === 'obe';
  }
  return !view.newBackend;
}

function genDesiredColumns(view, existingColumns, targetColumn, formState) {
  // will be all cols + the generated geo one or just the geo one, depending
  // on if the user checked the "Do Not Import Original Cols" box

  const anyMappings = _.some(
    formState.mappings.map(([_name, value]) => value !== null) // eslint-disable-line
  );

  const colsOrConstants = relevantArgsForComposition(formState).filter(oc => !!oc);

  // If the user checked "Do Not Import Original Cols" box...
  if (formState.shouldHideOriginal) {
    // filter out the original cols from the ones we plan to show on the SchemaPreview page...
    const columnIdsToHide = colsOrConstants.map(oc => oc.id);
    existingColumns = existingColumns.filter(oc => !_.includes(columnIdsToHide, oc.id));
  } else {
    // otherwise add the things in the list that are columns, ignoring all the constants
    const existingFieldNames = existingColumns.map(oc => oc.field_name);
    const columnsToShow = colsOrConstants
      .filter(oc => !!oc.transform && !!oc.transform.transform_expr)
      .filter(oc => !existingFieldNames.includes(oc.field_name));
    existingColumns = columnsToShow.concat(existingColumns);
  }

  let desiredColumns;
  if (targetColumn) {
    if (!anyMappings) {
      desiredColumns = existingColumns.filter(oc => oc.id !== targetColumn.id);
    } else {
      // We already have a target column - so the default behavior
      // is to replace the existing one with one of a new expression
      desiredColumns = existingColumns.map(oc => {
        if (oc.id === targetColumn.id) {
          // This is the column we want to update - clone it, but with the new expression
          return ShowActions.buildNewOutputColumn(oc, () => genNewExpression(view, formState));
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
          transform_expr: genNewExpression(view, formState)
        },
        is_primary_key: false
      });
    }
  }

  return desiredColumns.map((dc, i) => ({ ...dc, position: i + 1 }));
}

export const mapStateToProps = ({ entities, ui }, props) => {
  const { params, location, newOutputSchema } = props;
  const view = entities.views[params.fourfour];

  const inputSchemaId = _.toNumber(params.inputSchemaId);
  const inputSchema = entities.input_schemas[inputSchemaId];

  const outputSchemaId = _.toNumber(params.outputSchemaId);
  const outputSchema = getOutputSchema(entities, props);
  const outputColumns = Selectors.columnsForOutputSchema(entities, outputSchemaId);
  const outputColumn = getOutputColumn(entities, outputSchema);

  const allOutputColumns = getAllOutputColumns(entities, inputSchemaId);

  let formState = ui.forms.geocodeShortcutForm.state;
  if (formState.outputSchemaId !== outputSchemaId) {
    const inputColumns = Selectors.columnsForInputSchema(
      entities,
      inputSchemaId
    );


    formState = buildDefaultFormState(
      view,
      entities,
      inputColumns,
      outputSchema,
      outputColumns,
      allOutputColumns,
      outputColumn
    );
  }

  const relevantColumns = relevantArgsForComposition(formState);
  const anySelected = relevantColumns.length > 0 && _.some(relevantColumns);

  let isPreviewable = false;

  if (outputColumn) {
    isPreviewable = outputColumn.transform.transform_expr === genNewExpression(view, formState);
  }

  return {
    newOutputSchema,
    entities,
    params: { ...params, geocodeShortcut: true },
    view,
    displayState: DisplayState.fromUiUrl({ params, location }),
    formState,

    inputSchema,
    outputSchema,
    outputColumns,
    outputColumn,
    allOutputColumns,

    anySelected,
    isPreviewable
  };
};

const mergeProps = (stateProps, { dispatch }, ownProps) => {

  const formState = stateProps.formState;

  // The reason we need to sync this to the store is because there are two
  // buttons living in diff components that need to use this in order to make
  // a new schema
  const updateDesiredColumns = (newFormState) => {
    const desiredColumns = genDesiredColumns(
      stateProps.view,
      stateProps.outputColumns,
      stateProps.outputColumn,
      newFormState
    );

    const outputSchemaId = stateProps.outputSchema.id;
    dispatch(FormActions.setFormState(
      'geocodeShortcutForm',
      { ...newFormState, outputSchemaId, desiredColumns }
    ));
  };

  const dispatchProps = {
    onDismiss: () => dispatch(hideModal()),

    redirectGeocodePane: outputSchemaId => {
      browserHistory.push(Links.geocodeShortcut(
        { ...stateProps.params, outputSchemaId: outputSchemaId }
      ));
    },

    setMapping: (addressComponent, outputColumn) => {
      const mappings = formState.mappings
        .filter(([component]) => component !== addressComponent)
        .concat([[addressComponent, outputColumn]]);

      const newFormState = { ...formState, mappings };
      dispatch(FormActions.setFormState('geocodeShortcutForm', newFormState));
      updateDesiredColumns(newFormState);
    },

    setComposedFrom: composedFrom => {
      const newFormState = { ...formState, composedFrom };
      dispatch(FormActions.setFormState('geocodeShortcutForm', newFormState));
      updateDesiredColumns(newFormState);
    },

    toggleHideOriginal: () => {
      const shouldHideOriginal = !formState.shouldHideOriginal;
      const newFormState = { ...formState, shouldHideOriginal };
      dispatch(FormActions.setFormState('geocodeShortcutForm', newFormState));
      updateDesiredColumns(newFormState);
    },

    toggleConvertToNull: () => {
      const shouldConvertToNull = !formState.shouldConvertToNull;
      const newFormState = { ...formState, shouldConvertToNull };
      dispatch(FormActions.setFormState('geocodeShortcutForm', newFormState));
      updateDesiredColumns(newFormState);
    },

    showError: message => dispatch(FlashActions.showFlashMessage('error', message, 10000))
  };

  return { ...dispatchProps, ...ownProps, ...stateProps };
};

export default connect(mapStateToProps, null, mergeProps)(GeocodeShortcut);
