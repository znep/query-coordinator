import PropTypes from 'prop-types';
import React, { Component } from 'react';

export class ColorPalettePreview extends Component {
  render() {
    const { colors } = this.props;
    const totalColors = colors.length;

    return totalColors > 0 ?
      (<ul className="color-palette-preview-container" role="presentation" aria-hidden="true">
        {colors.map((color, index) =>
          <li
            key={index}
            className="color-palette-preview-color"
            style={{ backgroundColor: color, width: `${100 / totalColors}%` }}></li>
        )}
      </ul>) :
    null;
  }
}

ColorPalettePreview.propTypes = {
  colors: PropTypes.array.isRequired
};

export default ColorPalettePreview;
