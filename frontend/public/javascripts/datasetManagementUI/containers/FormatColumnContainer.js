import { connect } from 'react-redux';
import { hideModal } from 'reduxStuff/actions/modal';
import FormatColumn from 'components/FormatColumn/FormatColumn';
import * as Selectors from 'selectors';
import * as ShowActions from 'reduxStuff/actions/showOutputSchema';

function mapStateToProps({ entities }, props) {
  const inputSchema = entities.input_schemas[props.outputSchema.input_schema_id];
  return {
    ...props,
    entities,
    inputSchema
  };
}

function mergeProps(stateProps, { dispatch }, ownProps) {
  const { column, outputSchema, entities, params } = stateProps;
  return {
    ...stateProps,
    ...ownProps,
    onDismiss: () => dispatch(hideModal()),
    onSave: (format) => {
      const outputColumns = Selectors.columnsForOutputSchema(entities, outputSchema.id);
      const desiredColumns = outputColumns.map(oc => {
        if (oc.id === column.id) {
          return {
            ...ShowActions.cloneOutputColumn(oc),
            format
          };
        } else {
          return ShowActions.cloneOutputColumn(oc);
        }
      });
      dispatch(ShowActions.newOutputSchema(
        outputSchema.input_schema_id,
        desiredColumns
      )).then(resp => {
        dispatch(ShowActions.redirectToOutputSchema(params, resp.resource.id));
        dispatch(hideModal());
      });
    }
  };
}

export default connect(mapStateToProps, null, mergeProps)(FormatColumn);
