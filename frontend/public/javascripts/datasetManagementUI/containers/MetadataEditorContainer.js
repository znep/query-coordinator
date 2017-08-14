import { connect } from 'react-redux';
import MetadataEditor from 'components/MetadataEditor/MetadataEditor';

const mapStateToProps = ({ ui }, { onDatasetTab, outputSchemaId }) => ({
  flashVisible: ui.flashMessage.visible,
  onDatasetTab,
  outputSchemaId
});

export default connect(mapStateToProps)(MetadataEditor);
