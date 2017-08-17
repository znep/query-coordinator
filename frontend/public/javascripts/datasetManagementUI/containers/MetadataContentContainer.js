import { connect } from 'react-redux';
import MetadataContent from 'components/MetadataContent/MetadataContent';
import * as Selectors from 'selectors';

const mapStateToProps = ({ entities }, props) => {
  let outputSchemaId;

  if (props.outputSchemaId) {
    outputSchemaId = props.outputSchemaId;
  } else {
    const currentOutputSchema = Selectors.currentOutputSchema(entities);
    const { id } = currentOutputSchema;
    outputSchemaId = id;
  }

  return {
    ...props,
    currentOutputSchemaId: outputSchemaId
  };
};

export default connect(mapStateToProps)(MetadataContent);
