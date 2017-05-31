import _ from 'lodash';
import * as StringHelpers from './StringHelpers';

/**
 * Layout Helpers
 */

/**
 * Maps your text data to positioned text rows. Text will be word wrapped
 * into rows and each of the row elements will have relative positions to
 * the column.
 *
 * Example usage:
 *
 * ```javascript
 * const layout = textBasedColumnLayout({
 *   fontFamily: 'Helvetica',
 *   fontSize: 24
 * });
 *
 * // margin from the container
 * layout.setMargin(top, right, bottom, left);
 *
 * // Set item's inner padding
 * layout.setItemPadding(top, right, bottom, left);
 *
 * // gap between columns (horizontal, vertical)
 * layout.setColumnGap(horizontal, vertical);
 *
 * // Set minimum allowed text width, this affects max number of
 * // column calculations
 * layout.setMinimumTextWidth(width);
 *
 * // Set maximum desired columns
 * layout.setMaximumColumns(maxColumns);
 *
 * // do calculations
 * const columnPositionedData = layout(containerWidth, containerHeight, myTextArray);
 *
 * d3selector.
 *   selectAll('g').
 *   data(columnPositionedData).
 *     enter().
 *     append('g').
 *       attr('transform', (d) => `translate(${d.x},${d.y})`).
 *       selectAll('text').
 *       data((d) => d.wrappedText).
 *         enter().
 *         append('text').
 *           text((d) => d.text).
 *           attr('x', (d) => d.x).
 *           attr('y', (d) => d.y);
 *
 * ```
 *
 * @param textAttributes
 * @return {function(Number, Number, string[])}
 */
export function textBasedColumnLayout(textAttributes) {
  let margin = { top: 0, right: 0, bottom: 0, left: 0 };
  let columnGap = { vertical: 0, horizontal: 0 };
  let columnPadding = { top: 0, right: 0, bottom: 0, left: 0 };
  let minimumTextWidth = 100;
  let maxColumns = 5;

  const layout = (viewportWidth, data) => {
    let dataWithCoordinates = new Array(data.length);
    let rowBottoms = [];

    const maxCols = computeMaximumAvailableColumns(
      viewportWidth,
      margin,
      columnPadding,
      columnGap,
      minimumTextWidth
    );

    const maxRows = Math.ceil(data.length / maxCols);
    const horizontalMargin = (margin.left + margin.right);
    const totalGap = (columnGap.horizontal * (maxCols - 1));
    const columnWidth = (viewportWidth - horizontalMargin - totalGap) / maxCols;

    for (let row = 0; row < maxRows; row++) {
      let rowHeight = 0;

      for (let col = 0; col < maxCols; col++) {
        const index = (row * maxCols) + col;

        if (index >= data.length) {
          break;
        }

        const text = data[index];

        const wrappedTextRows = wrapText(
          textAttributes.fontFamily,
          textAttributes.fontSize,
          text,
          columnWidth - (columnPadding.left + columnPadding.right)
        );

        const elementHeight = wrappedTextRows[wrappedTextRows.length - 1].y;

        rowHeight = Math.max(elementHeight, rowHeight);

        const elementX = margin.left + (columnWidth * col) + (columnGap.horizontal * col);
        const elementY = row > 0 ? (rowBottoms[row - 1] + columnGap.vertical) : margin.top;

        dataWithCoordinates[index] = {
          x: elementX,
          y: elementY,
          wrappedText: wrappedTextRows
        };
      }

      rowBottoms[row] = (row > 0 ? rowBottoms[row - 1] + columnGap.vertical : margin.top) + rowHeight;
    }

    return dataWithCoordinates;
  };

  /**
   * Layout configurators
   */

  /**
   * @param {{top: Number, right: Number, bottom: Number, left: Number}} newMargin
   */
  layout.margin = function(newMargin) {
    if (arguments.length === 0) {
      return margin;
    }

    margin = newMargin;
    return layout;
  };

  /**
   * @param {{horizontal: Number, vertical: Number}} newGap
   */
  layout.columnGap = function(newGap) {
    if (arguments.length === 0) {
      return columnGap;
    }

    columnGap = newGap;
    return layout;
  };

  /**
   * @param {{top: Number, right: Number, bottom: Number, left: Number}} newPadding
   */
  layout.columnPadding = function(newPadding) {
    if (arguments.length === 0) {
      return columnPadding;
    }

    columnPadding = newPadding;
    return layout;
  };

  layout.maxColumns = function(columns) {
    if (arguments.length === 0) {
      return maxColumns;
    }

    maxColumns = columns;
    return layout;
  };

  layout.minimumTextWidth = function(textWidth) {
    if (arguments.length === 0) {
      return minimumTextWidth;
    }

    minimumTextWidth = textWidth;
    return layout;
  };

  return layout;
}

/**
 * Internal helper function for calculating maximum number of columns which fits into given viewport width.
 *
 * @param {Number} viewportWidth
 * @param {{top: Number, right: Number, bottom: Number, left: Number}} margin
 * @param {{top: Number, right: Number, bottom: Number, left: Number}} itemPadding
 * @param {{horizontal: Number, vertical: Number}} columnGap
 * @param {Number} minimumWidth
 *
 * @return {Number}
 */
function computeMaximumAvailableColumns(viewportWidth, margin, itemPadding, columnGap, minimumWidth) {
  const horizontalMargin = margin.left + margin.right;
  const horizontalPadding = itemPadding.left + itemPadding.right;
  const horizontalGap = columnGap.horizontal;

  const columns = (viewportWidth - horizontalGap - horizontalMargin) / (minimumWidth + horizontalGap + horizontalPadding);
  return Math.floor(columns);
}

/**
 * Returns visual size of the given element. Use this to calculate the element's size
 * if element is not attached to document yet.
 *
 * @param {Element} element
 * @return {{width: Number, height: Number}}
 */
export function calculateElementSize(element) {
  const svg = getTemporarySvg();

  svg.appendChild(element);

  const bbox = element.getBBox();
  const size = { width: bbox.width, height: bbox.height };

  svg.removeChild(element);
  return size;
}

/**
 * Text Processing Helpers
 */

/**
 * Returns calculated text size for given font family and font size. Results will be
 * cached.
 *
 * @param {String} fontFamily
 * @param {Number} fontSize
 * @param {String} text
 * @return {{width: Number, height: Number}}
 */
export const calculateTextSize = _.memoize(
  (fontFamily, fontSize, text) => {
    const textElement = getTemporarySvgElement('calculateTextSize', 'text', {
      'font-family': fontFamily,
      'font-size': fontSize
    });

    textElement.textContent = text;

    const bbox = textElement.getBBox();

    return {
      width: bbox.width,
      height: bbox.height
    };
  },
  (fontFamily, fontSize, text) => `${fontFamily} ${fontSize} ${text}`
);

/**
 * Returns an array of strings with their relative positions. Lines are
 * split by the word boundaries.
 *
 * @param {String} fontFamily
 * @param {Number} fontSize
 * @param {String} text
 * @param {Number} availableWidth
 * @return {{text: String, x: Number, y: Number}[]}
 */
export function wrapText(fontFamily, fontSize, text, availableWidth) {
  const textSize = calculateTextSize(fontFamily, fontSize, text);
  const rows = textSize.width / availableWidth;
  const maxCharactersPerRow = Math.floor(text.length / rows);

  const chunks = StringHelpers.partitionByWordBoundaries(text, maxCharactersPerRow);

  return chunks.map((chunk, i) => ({
    text: chunk,
    x: 0,
    y: (i + 1) * textSize.height
  }));
}

/**
 * DOM Functionality
 */
export function createSvgElement(tagName) {
  return document.createElementNS('http://www.w3.org/2000/svg', tagName);
}

/**
 * Common Internal Functions
 */

let _temporarySvg = null;
let _temporarySvgTimeout = null;
/**
 * Returns an Svg element, which is added to the body. To reduce the number of DOM
 * additions and removals, it keeps temporary element in the body for a while and
 * removes after it.
 *
 * @return {HTMLElement}
 */
function getTemporarySvg() {
  if (_temporarySvg === null) {
    _temporarySvg = createSvgElement('svg');
    _temporarySvg.style.position = 'fixed';
    _temporarySvg.style.opacity = '0';
    _temporarySvg.style.pointerEvents = 'none';
    _temporarySvg.style.width = '1000px';
    _temporarySvg.style.height = '1000px';
  }

  if (!_temporarySvg.parentElement) {
    document.body.appendChild(_temporarySvg);
  }

  if (_temporarySvgTimeout !== null) {
    clearTimeout(_temporarySvgTimeout);
  }

  _temporarySvgTimeout = setTimeout(() => {
    if (_temporarySvg.parentElement) {
      _temporarySvg.parentElement.removeChild(_temporarySvg);
    }
  }, 300000);

  return _temporarySvg;
}

/**
 * Returns an element from temporary svg which matches the given id. If the element
 * with the given id is not exist, it will be created. If the given attributes are
 * different than the previously created element, element's attributes will be updated.
 *
 * @param {String} id Element id
 * @param {String} tagName Element tag (e.g text, rect, etc.)
 * @param {Object} attributes Element attributes
 *
 * @return {HTMLElement}
 */
function getTemporarySvgElement(id, tagName, attributes) {
  const svg = getTemporarySvg();
  let element = svg.querySelector(`${tagName}#${id}`);

  if (!element) {
    element = createSvgElement(tagName);
    element.id = id;

    Object.keys(attributes).forEach((attributeName) => {
      element.setAttribute(attributeName, attributes[attributeName]);
    });

    svg.appendChild(element);
  } else {
    Object.keys(attributes).forEach((attributeName) => {
      const attributeValue = attributes[attributeName];

      if (element.getAttribute(attributeName) !== attributeValue) {
        element.setAttribute(attributeName, attributeValue);
      }
    });
  }

  return element;
}
