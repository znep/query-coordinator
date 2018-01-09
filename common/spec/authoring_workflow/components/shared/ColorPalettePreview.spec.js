import _ from 'lodash';
import React from 'react';
import { shallow } from 'enzyme';

import defaultProps from '../../defaultProps';
import { COLOR_PALETTE_VALUES } from 'common/authoring_workflow/constants';
import ColorPalettePreview from 'common/authoring_workflow/components/shared/ColorPalettePreview';

describe('ColorPalettePreview', function() {
  describe('rendering', function() {
    let component;

    describe('without data', function() {
      beforeEach(function() {
        component = shallow(<ColorPalettePreview colors={[]} />);
      });

      it('does not render color palette preview', function() {
        expect(component.find('.color-palette-preview-container')).to.have.length(0);
      });
    });

    describe('with data', function() {
      function renderColorPalettePreview(colorsCount) {
        const colors = _.take(COLOR_PALETTE_VALUES.accent, colorsCount);

        component = shallow(<ColorPalettePreview colors={colors} />);
      }

      it('renders a color swatch with two colors', function() {
        renderColorPalettePreview(2);

        expect(component.find('.color-palette-preview-container')).to.have.length(1);
        expect(component.find('.color-palette-preview-container .color-palette-preview-color')).to.have.length(2);
      });

      it('renders a color swatch with five colors', function() {
        renderColorPalettePreview(5);

        expect(component.find('.color-palette-preview-container .color-palette-preview-color')).to.have.length(5);
      });

      it('renders a color swatch with ten colors', function() {
        renderColorPalettePreview(10);

        expect(component.find('.color-palette-preview-container .color-palette-preview-color')).to.have.length(10);
      });
    });
  });
});
