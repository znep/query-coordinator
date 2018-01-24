import _ from 'lodash';

import * as commonVifDecorator from './commonVifDecorator';
import * as pointMapVifDecorator from './pointMapVifDecorator';
import * as regionMapVifDecorator from './regionMapVifDecorator';
import * as shapeMapVifDecorator from './shapeMapVifDecorator';
import * as lineMapVifDecorator from './lineMapVifDecorator';

export function getDecoratedVif(vif) {
  return _.merge(
    {},
    commonVifDecorator,
    pointMapVifDecorator,
    regionMapVifDecorator,
    shapeMapVifDecorator,
    lineMapVifDecorator,
    vif
  );
}

