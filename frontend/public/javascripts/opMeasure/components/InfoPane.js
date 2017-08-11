import { connect } from 'react-redux';

import InfoPaneComponent from '../../common/components/InfoPaneComponent';

function mapStateToProps() {
  return {
    name: 'Part I Property Crime Rate per 1,000 Population',
    description: '',
    provenance: null,
    isPaneCollapsible: false
  };
}

export default connect(mapStateToProps)(InfoPaneComponent);
