import _ from 'lodash';

import * as commonVifDecorator from './commonVifDecorator';
import * as lineMapVifDecorator from './lineMapVifDecorator';
import * as pointMapVifDecorator from './pointMapVifDecorator';
import * as regionMapVifDecorator from './regionMapVifDecorator';
import * as shapeMapVifDecorator from './shapeMapVifDecorator';

export function getDecoratedVif(vif) {
  return _.merge(
    {},
    commonVifDecorator,
    lineMapVifDecorator,
    pointMapVifDecorator,
    regionMapVifDecorator,
    shapeMapVifDecorator,
    vif
  );
}

