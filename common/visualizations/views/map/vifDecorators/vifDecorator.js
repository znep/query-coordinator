import _ from 'lodash';

import * as commonVifDecorator from './commonVifDecorator';
import * as pointMapVifDecorator from './pointMapVifDecorator';

export function getDecoratedVif(vif) {
  return _.merge(
    {},
    commonVifDecorator,
    pointMapVifDecorator,
    vif
  );
}

