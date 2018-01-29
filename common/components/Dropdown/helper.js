import _ from 'lodash';

/**
 * optionsRef   : reference to the picklist element which needs to be positioned
 * dropdownRef  : reference to the anchor element where picklist needs to be positioned
 * options      : object
 *      - displayTrueWidthOptions : boolean.
 *          default: false
 *          - true  : picklist takes width based on the width of each option.
 *          - false : picklist takes width of the dropdownRef.
 *      - showOptionsBelowHandle  : boolean.
 *          default: false
 *          - true  : positions the picklist below the dropdownRef.
 *          - false : positions the picklist on top of dropdownRef (and the dropdown
 *                    ref will be behind the picklist, not visible.)
*/
export const positionPicklist = (optionsRef, dropdownRef, options) => {
  const hasOptions = optionsRef &&
    optionsRef.querySelectorAll('.picklist-option').length > 0;

  if (!hasOptions) {
    return;
  }

  const { displayTrueWidthOptions, showOptionsBelowHandle } = options;
  const containerDimensions = dropdownRef.getBoundingClientRect();
  const browserWindowHeight = window.document.documentElement.clientHeight - 10;
  const browserWindowWidth = window.document.documentElement.clientWidth;
  const dimensions = optionsRef.getBoundingClientRect();
  const picklistOptionElement = optionsRef.querySelector('.picklist-option');

  // Calculate X Position
  const optionWidth = picklistOptionElement.clientWidth;
  const exceedsBrowserWindowWidth = browserWindowWidth < (containerDimensions.left + optionWidth);

  const optionsLeft = exceedsBrowserWindowWidth ?
    (containerDimensions.left - optionWidth) :
    containerDimensions.left;

  optionsRef.style.left = `${optionsLeft}px`;

  // Calculate Y Position
  let optionsTop = dropdownRef.clientHeight + containerDimensions.top - containerDimensions.height;
  if (showOptionsBelowHandle) {
    optionsTop += containerDimensions.height;
  }
  optionsRef.style.top = `${optionsTop}px`;

  // Calculate Height
  const scrollHeight = optionsRef.scrollHeight;
  const exceedsBrowserWindowHeight = browserWindowHeight < dimensions.top + scrollHeight;
  const optionHeight = picklistOptionElement.clientHeight;
  const determinedHeight = browserWindowHeight - dimensions.top;

  if (exceedsBrowserWindowHeight) {
    optionsRef.style.height = `${Math.max(determinedHeight, optionHeight)}px`;
  } else if (optionsRef.style.height !== 'auto') {
    optionsRef.style.height = 'auto';
  }

  if (!displayTrueWidthOptions) {
    optionsRef.style.width = `${containerDimensions.width}px`;
  }
};