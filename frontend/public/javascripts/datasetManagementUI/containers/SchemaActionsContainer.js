import { connect } from 'react-redux';
import _ from 'lodash';
import { withRouter } from 'react-router';
import SchemaActions from 'components/SchemaActions/SchemaActions';

const mapStateToProps = ({ entities }, { params }) => {
  const schemas = Object.values(entities.output_schemas).map(os => ({
    ...os,
    isCurrent: os.id === Number(params.outputSchemaId)
  }));
  return {
    oss: _.orderBy(schemas, 'finished_at', 'desc'),
    iss: entities.input_schemas
  };
};

export default withRouter(connect(mapStateToProps)(SchemaActions));
