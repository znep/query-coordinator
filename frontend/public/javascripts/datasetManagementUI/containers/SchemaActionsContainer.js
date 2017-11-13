import { connect } from 'react-redux';
import _ from 'lodash';
import { withRouter } from 'react-router';
import SchemaActions from 'components/SchemaActions/SchemaActions';

const mapStateToProps = ({ entities }, { params }) => {
  const pastSchemas = Object.values(entities.output_schemas).filter(
    os => os.id !== Number(params.outputSchemaId)
  );
  return {
    oss: _.orderBy(pastSchemas, 'finished_at', 'desc'),
    iss: entities.input_schemas
  };
};

export default withRouter(connect(mapStateToProps)(SchemaActions));
