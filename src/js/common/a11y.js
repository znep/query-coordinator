import _ from 'lodash';

/**
 * Find the first actionable element within an element, using an exludedSelector, if any, and
 * falling back to the first actionable element, if a non-excluded element wasn't found.
 */
export const getFirstActionableElement = (element, excludedSelector) => {
  const firstActionableElement = element.querySelector('input, button, a');

  if (_.isString(excludedSelector)) {
    const firstNonExcludedActionableElement = element.querySelector(
      `input:not(${excludedSelector}), button:not(${excludedSelector}), a:not(${excludedSelector})`
    );
    return firstNonExcludedActionableElement || firstActionableElement;
  } else {
    return firstActionableElement;
  }
};
