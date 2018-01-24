import PropTypes from 'prop-types';
import values from 'lodash/values';

import { MODES } from 'common/components/AccessManager/Constants';

export default PropTypes.oneOf(values(MODES));
