import { connect } from 'react-redux';
import { hideModal } from 'datasetManagementUI/reduxStuff/actions/modal';
import { createImportConfig } from 'datasetManagementUI/reduxStuff/actions/createImportConfig';
import SetupAutomation from 'datasetManagementUI/components/SetupAutomation/SetupAutomation';

function mapStateToProps(state, props) {
  return props;
}

function mapDispatchToProps(dispatch) {
  return {
    onDismiss: () => dispatch(hideModal()),
    createImportConfig: (source, outputSchemaId, appendOrReplace) => {
      return dispatch(createImportConfig(
        source,
        outputSchemaId,
        appendOrReplace
      ));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SetupAutomation);
