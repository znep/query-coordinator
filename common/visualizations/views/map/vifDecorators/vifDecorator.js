import _ from 'lodash';

import * as commonVifDecorator from './commonVifDecorator';
import * as pointMapVifDecorator from './pointMapVifDecorator';
import * as regionMapVifDecorator from './regionMapVifDecorator';

export function getDecoratedVif(vif) {
  return _.merge(
    {},
    commonVifDecorator,
    pointMapVifDecorator,
    regionMapVifDecorator,
    vif
  );
}

