import { connect } from 'react-redux';
import _ from 'lodash';
import Field from 'components/Field/FieldNew';

const mapStateToProps = ({ ui }, { field, columnId }) => ({
  errors: _.get(ui, ['forms', 'columnForm', 'errors', columnId, field.name], [])
});

export default connect(mapStateToProps)(Field);
