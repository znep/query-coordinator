import { assert } from 'chai';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import React from 'react';

import { ConfigureMeasure } from 'editor/renderers/asset_selector_steps/measures/ConfigureMeasure';

describe('ConfigureMeasure', () => {
  const itCallsSetComponentTypeOnRadiobuttonClick = (props) => {
    describe('radiobutton click', () => {
      it('calls onSetComponentType with the correct type', () => {
        props.onSetComponentType.reset();
        const element = shallow(<ConfigureMeasure {...props} />);
        element.find('Radiobutton#card-radiobutton').prop('onChange')();
        sinon.assert.calledWith(props.onSetComponentType, 'measure.card');

        props.onSetComponentType.reset();
        element.find('Radiobutton#chart-radiobutton').prop('onChange')();
        sinon.assert.calledWith(props.onSetComponentType, 'measure.chart');
      });
    });
  };

  describe('componentType = measure.card', () => {
    const props = {
      componentType: 'measure.card',
      onSetComponentType: sinon.stub()
    };

    it('renders the card image', () => {
      const element = shallow(<ConfigureMeasure {...props} />);
      assert.lengthOf(element.find('img.tile-card'), 1);
      assert.lengthOf(element.find('img.tile-chart'), 0);
    });

    it('checks the correct checkboxes', () => {
      const element = shallow(<ConfigureMeasure {...props} />);
      assert.lengthOf(element.find('Radiobutton#card-radiobutton[checked=true]'), 1);
      assert.lengthOf(element.find('Radiobutton#chart-radiobutton[checked=false]'), 1);
    });

    itCallsSetComponentTypeOnRadiobuttonClick(props);
  });

  describe('componentType = measure.chart', () => {
    const props = {
      componentType: 'measure.chart',
      onSetComponentType: sinon.stub()
    };

    it('renders the card image', () => {
      const element = shallow(<ConfigureMeasure {...props} />);
      assert.lengthOf(element.find('img.tile-chart'), 1);
      assert.lengthOf(element.find('img.tile-card'), 0);
    });

    it('checks the correct checkboxes', () => {
      const element = shallow(<ConfigureMeasure {...props} />);
      assert.lengthOf(element.find('Radiobutton#chart-radiobutton[checked=true]'), 1);
      assert.lengthOf(element.find('Radiobutton#card-radiobutton[checked=false]'), 1);
    });

    itCallsSetComponentTypeOnRadiobuttonClick(props);
  });

  describe('footer', () => {
    const props = {
      componentType: 'measure.card',
      onSetComponentType: sinon.stub()
    };

    // These buttons have delegate handlers in AssetSelectorRenderer.
    it('renders a back button', () => {
      const element = shallow(<ConfigureMeasure {...props} />);
      assert.lengthOf(
        element.find('button.back-btn[data-resume-from-step="SELECT_MEASURE_FROM_CATALOG"]'),
        1
      );
    });

    it('renders an insert button', () => {
      const element = shallow(<ConfigureMeasure {...props} />);
      assert.lengthOf(
        element.find('button.btn-apply'), // Class name is significant, AssetSelectorRenderer looks for it.
        1
      );
    });
  });

  describe('header', () => {
    const props = {
      componentType: 'measure.card',
      onSetComponentType: sinon.stub()
    };

    it('renders a close button', () => {
      const element = shallow(<ConfigureMeasure {...props} />);
      assert.lengthOf(
        element.find('.modal-header-group button.btn-close'),
        1
      );
    });
  });
});
