import { connect } from 'react-redux';
import TablePreview from 'components/TablePreview/TablePreview';

function mapStateToProps({ entities }, { params }) {
  return {
    view: entities.views[params.fourfour],
    entities,
    params
  };
}

export default connect(mapStateToProps)(TablePreview);
