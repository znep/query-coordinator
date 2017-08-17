import filter from 'lodash/fp/filter';
import flow from 'lodash/fp/flow';
import get from 'lodash/fp/get';
import getOr from 'lodash/fp/getOr';
import identity from 'lodash/fp/identity';
import isFunction from 'lodash/fp/isFunction';
import join from 'lodash/fp/join';
import negate from 'lodash/fp/negate';
import snakeCase from 'lodash/fp/snakeCase';
import toUpper from 'lodash/fp/toUpper';
import Immutable from 'immutable';

export const invert = negate(identity);

export const keyIn = (...keys) => (v, k) => Immutable.Set(keys).has(k);

/**
 * Inspired by https://github.com/ajchambeaud/make-action-creator
 * @param actionName
 * @param {array<string> | object} options - An array of string keys that map arguments to the base action
 * creator function to payload properties, or a configuration object
 * @returns {function} Action creator function that has a `.type` action type, in addition to `.start`,
 * `.failure`, and `.success` action creators, and `.START`, `.FAILURE`, and `.SUCCESS` action types.
 */
export const makeActionCreator = (actionName, options) => {
  const stages = getOr(['start', 'success', 'failure'], 'stages', options);
  const asyncFunc = get('asyncFunc', options);
  const formatTypeName = flow(snakeCase, toUpper);
  const makeActionType = suffix => flow(filter(identity), join(' '), formatTypeName)([actionName, suffix]);
  const createActionCreator = suffix => payload => ({
    type: makeActionType(suffix),
    payload
  });
  const defaultActionCreator = function(payload) {
    return {
      type: makeActionType(),
      payload
    };
  };
  const actionCreatorProto = {};
  stages.forEach(stage => {
    actionCreatorProto[stage] = createActionCreator(stage);
    actionCreatorProto[toUpper(stage)] = makeActionType(stage);
  });
  actionCreatorProto.type = makeActionType();

  const actionCreator = isFunction(asyncFunc)
    ? payload => asyncFunc(actionCreatorProto, payload)
    : defaultActionCreator;

  return Object.assign(actionCreator, actionCreatorProto);
};
