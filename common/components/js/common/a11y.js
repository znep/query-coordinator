import _ from 'lodash';

const getActionableElementSelectors = (excludedSelector) => {
  const excludedSelectorStatement = excludedSelector ? `:not(${excludedSelector})` : '';

  return [
    `a${excludedSelectorStatement}`,
    `input:not([disabled])${excludedSelectorStatement}`,
    `select:not([disabled])${excludedSelectorStatement}`,
    `textarea:not([disabled])${excludedSelectorStatement}`,
    `button:not([disabled])${excludedSelectorStatement}`
  ].join(',');
};

const ACTIONABLE_ELEMENT_SELECTORS = getActionableElementSelectors();

/**
 * Return all actionable elements in an element. An actionable element is something that the
 * browser will allow you to tab to.
 */
export const getAllActionableElements = (element) => {
  return element.querySelectorAll(ACTIONABLE_ELEMENT_SELECTORS);
};

/**
 * Find the first actionable element within an element, using an exludedSelector, if any, and
 * falling back to the first actionable element, if a non-excluded element wasn't found.
 *
 * This function is helpful if you need to get the first actionable element on a page, but you
 * want to always skip an element with a particular id or class.
 * NOTE: excludedSelector can't handle complex selectors, stick to a single id or classname.
 */
export const getFirstActionableElement = (element, excludedSelector) => {
  const firstActionableElement = element.querySelector(ACTIONABLE_ELEMENT_SELECTORS);

  if (_.isString(excludedSelector)) {
    const nonExcludedSelectors = getActionableElementSelectors(excludedSelector);
    const firstNonExcludedActionableElement = element.querySelector(nonExcludedSelectors);

    return firstNonExcludedActionableElement || firstActionableElement;
  } else {
    return firstActionableElement;
  }
};

/**
 * Focus on the first actionable element that isn't the excluded element, potentially falling
 * back to the excluded element if no other actionable elements are found.
 *
 * This function is helpful if you need to adjust focus, but the likely first actionable element
 * is something you'd rather not focus on, for instance the close button of a modal.
 */
export const focusFirstActionableElement = (element, excludedSelector) => {
  const actionableElement = getFirstActionableElement(element, excludedSelector);

  if (actionableElement) {
    actionableElement.focus();
  }
};

/**
 * Find the last actionable element within an element
 */
export const getLastActionableElement = (element) => {
  return _.last(getAllActionableElements(element));
};

/**
 * Make element and its focusable children accessible via keyboard and screenreader.
 *
 * This is useful to use with makeElementAndChildrenInaccessible. NOTE: Be wary if you have
 * mucked with the tabindex of any actionable elements (beyond setting it to -1 in order to take
 * it out of the tab order). Using this function will completely remove your previous tabindex.
 * Please don't change this to accomodate that scenario, we shouldn't be mucking with the tabindex
 * of already focusable elements to begin with!
 */
export const makeElementAndChildrenAccessible = (element) => {
  element.removeAttribute('aria-hidden');
  element.removeAttribute('tabindex');

  // reset tabindex on the focusable children
  _.each(getAllActionableElements(element), (child) => {
    child.removeAttribute('tabindex');
  });
};

/**
 * Make element and its focusable children inaccessible via keyboard and screenreader.
 *
 * This is useful if you want to hide an element, but don't want to use 'display: none', perhaps
 * because you need a nice animation transition.
 */
export const makeElementAndChildrenInaccessible = (element) => {
  element.setAttribute('aria-hidden', 'true');
  element.setAttribute('tabindex', '-1');

  // set tabindex on the focusable children
  _.each(getAllActionableElements(element), (child) => {
    child.setAttribute('tabindex', '-1');
  });
};
