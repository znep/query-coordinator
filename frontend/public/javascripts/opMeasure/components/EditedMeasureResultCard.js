// A version of the MeasureResultCard which reads from the editor state.

import _ from 'lodash';
import { connect } from 'react-redux';
import MeasureResultCard from './MeasureResultCard';

function mapStateToProps(state) {
  return { measure: _.get(state, 'editor.measure') };
}

export default connect(mapStateToProps)(MeasureResultCard);

