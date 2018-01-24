import { connect } from 'react-redux';
import _ from 'lodash';
import Field from 'datasetManagementUI/components/Field/Field';

const mapStateToProps = ({ ui }, { field, columnId }) => ({
  errors: _.get(ui, ['forms', 'columnForm', 'errors', columnId, field.id], [])
});

export default connect(mapStateToProps)(Field);
