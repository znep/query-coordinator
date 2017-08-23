import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { makeProps } from 'models/metadataTable';
import MetadataTable from 'components/MetadataTable/MetadataTable';

const mapStateToProps = ({ entities }, { params }) => ({
  ...makeProps(entities, params)
});

export default withRouter(connect(mapStateToProps)(MetadataTable));
