import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import FatalError from 'components/FatalError/FatalError';
import * as Selectors from 'selectors';

const mapStateToProps = ({ entities }, { params }) => {
  const { outputSchemaId } = params;

  if (!outputSchemaId) return {};

  return {
    // gives us the source, input schema, and output schema
    ...Selectors.treeForOutputSchema(entities, outputSchemaId),
    outputColumns: Selectors.columnsForOutputSchema(entities, outputSchemaId)
  };
};


export default withRouter(connect(mapStateToProps)(FatalError));
