import _ from 'lodash';
import { connect } from 'react-redux';
import { browserHistory } from 'react-router';
import TransformColumn from '../components/TransformColumn/TransformColumn';
import { addCompiler, compileExpression } from '../reduxStuff/actions/compiler';
import { columnsForInputSchema, columnsForOutputSchema } from '../selectors';
import { newOutputSchema } from '../reduxStuff/actions/showOutputSchema';
import * as Links from '../links/links';

function mapStateToProps(state, props) {
  let inputSchema;
  let inputColumns;
  let outputSchema;
  let outputColumns;
  let outputColumn;
  let transform;

  if (props.params.inputSchemaId && props.params.outputSchemaId && props.params.outputColumnId) {
    inputSchema = state.entities.input_schemas[props.params.inputSchemaId];
    inputColumns = columnsForInputSchema(state.entities, inputSchema.id);

    outputSchema = state.entities.output_schemas[props.params.outputSchemaId];
    outputColumns = columnsForOutputSchema(state.entities, outputSchema.id);

    outputColumn = state.entities.output_columns[props.params.outputColumnId];
    transform = state.entities.transforms[outputColumn.transform_id];

    outputColumn.transform = transform;
  }

  return {
    inputSchema,
    inputColumns,
    outputSchema,
    outputColumns,
    outputColumn,
    transform,
    // this is because you can't pass params in at the router level, like you used to be able to
    // do in react-router
    params: { ...props.params, transformEditor: true },
    location: props.location,
    compiler: state.ui.compiler.compiler,
    scope: state.ui.compiler.scope
  };
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    addCompiler: (inputSchema) => dispatch(addCompiler(inputSchema)),
    compileExpression: (compiler, expression) => dispatch(compileExpression(compiler, expression)),
    newOutputSchema: (inputSchema, expr, desiredColumns) =>
      dispatch(newOutputSchema(inputSchema.id, desiredColumns))
      .then((resource) => {
        const sourceId = inputSchema.source_id;
        const inputSchemaId = inputSchema.id;
        const outputSchema = resource.resource;
        if (outputSchema.output_columns) {

          const outputColumn = _.find(outputSchema.output_columns, (oc) => {
            return oc.transform ? oc.transform.transform_expr === expr : false;
          });


          if (!outputColumn) {
            throw new Error('Created successfully with the wrong expr?');
          }

          browserHistory.push(Links.transformColumn(
            { ...ownProps.params, outputSchemaId: outputSchema.id, outputColumnId: outputColumn.id },
            sourceId,
            inputSchemaId,
            outputSchema.id,
            outputColumn.id
          ));
        }


        return resource;
      })

  };
}


export default connect(mapStateToProps, mapDispatchToProps)(TransformColumn);
