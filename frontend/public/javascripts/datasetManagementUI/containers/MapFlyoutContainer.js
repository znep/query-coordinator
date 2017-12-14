import { connect } from 'react-redux';
import MapFlyout from '../components/MapFlyout/MapFlyout';
import * as Selectors from '../selectors';


function mapStateToProps(state, props) {

  const outputColumns = Selectors.columnsForOutputSchema(
    state.entities,
    props.outputSchema.id
  );

  const rows = Selectors.getRowData(
    state.entities,
    props.outputSchema.input_schema_id,
    props.displayState,
    outputColumns
  );

  return {
    ...props,
    left: props.left,
    transform: props.transform,
    rows,
    outputColumns
  };
}


export default connect(mapStateToProps)(MapFlyout);
