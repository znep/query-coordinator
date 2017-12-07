import { connect } from 'react-redux';
import _ from 'lodash';
import Field from 'components/Field/FieldNew';

const mapStateToProps = ({ ui }, { field, fieldsetName }) => ({
  errors: _.get(ui, ['forms', 'datasetForm', 'errors', fieldsetName, 'fields', field.name], [])
});

export default connect(mapStateToProps)(Field);
