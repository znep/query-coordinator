import Immutable from 'immutable';
import identity from 'lodash/fp/identity';
import negate from 'lodash/fp/negate';

export const invert = negate(identity);

export const keyIn = (...keys) => (v, k) => Immutable.Set(keys).has(k);
