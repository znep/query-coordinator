import { connect } from 'react-redux';
import { hideModal } from 'reduxStuff/actions/modal';
import SetupAutomation from 'components/SetupAutomation/SetupAutomation';
import { createImportConfig } from 'reduxStuff/actions/createImportConfig';

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
