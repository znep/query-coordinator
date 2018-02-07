import identity from 'lodash/fp/identity';
import negate from 'lodash/fp/negate';
import Immutable from 'immutable';

export const invert = negate(identity);

export const keyIn = (...keys) => (v, k) => Immutable.Set(keys).has(k);
