// A version of the MeasureResultCard which reads from the view state.

import _ from 'lodash';
import { connect } from 'react-redux';
import { MeasureResultCard } from './MeasureResultCard';

function mapStateToProps(state) {
  return { measure: _.get(state, 'view.measure') };
}

export default connect(mapStateToProps)(MeasureResultCard);

