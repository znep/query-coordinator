import { connect } from 'react-redux';
import MetadataContent from 'components/MetadataContent/MetadataContent';
import * as Selectors from 'selectors';

const mapStateToProps = ({ entities }, props) => {
  const currentOutputSchema = Selectors.currentOutputSchema(entities);

  return {
    ...props,
    currentOutputSchemaId: currentOutputSchema ? currentOutputSchema.id : null
  };
};

export default connect(mapStateToProps)(MetadataContent);
