import { connect } from 'react-redux';
import SubmitButton from 'datasetManagementUI/components/SubmitButton/SubmitButton';

const mapStateToProps = ({ ui }, ownProps) => ({
  buttonName: ownProps.buttonName,
  isDisabled: !ui.forms[ownProps.formName].isDirty,
  handleClick: () => {}
});

export default connect(mapStateToProps)(SubmitButton);
