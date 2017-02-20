import React from 'react';
import TestUtils from 'react-addons-test-utils';

import defaultProps from '../../defaultProps';
import renderComponent from '../../renderComponent';
import vifs from 'src/authoringWorkflow/vifs';
import { PresentationPane } from 'src/authoringWorkflow/components/panes/PresentationPane';
import { INPUT_DEBOUNCE_MILLISECONDS } from 'src/authoringWorkflow/constants';

function render(type) {
  var props = defaultProps({
    vifAuthoring: { authoring: { selectedVisualizationType: type } },
    onChangeBaseColor: sinon.spy(),
    onSelectBaseLayer: sinon.spy(),
    onChangeBaseLayerOpacity: sinon.spy(),
    onChangePointColor: sinon.spy(),
    onChangePointOpacity: sinon.spy(),
    onChangePointSize: sinon.spy(),
    onChangeShowDimensionLabels: sinon.spy(),
    onChangeShowValueLabels: sinon.spy(),
    onChangeShowValueLabelsAsPercent: sinon.spy(),
    onChangeLabelTop: sinon.spy(),
    onChangeLabelBottom: sinon.spy(),
    onChangeLabelLeft: sinon.spy(),
    onChangeTitle: sinon.stub(),
    onChangeDescription: sinon.stub(),
    onChangeShowSourceDataLink: sinon.stub(),
    onSelectColorScale: sinon.spy(),
    onSelectColorPalette: sinon.spy()
  });

  return {
    props: props,
    component: renderComponent(PresentationPane, props)
  };
}

describe('PresentationPane', function() {
  var component;
  var props;

  function setUpVisualization(type) {
    return function() {
      var renderedParts = render(type);

      component = renderedParts.component;
      props = renderedParts.props;
    };
  }

  function emitsEvent(selector, eventName, eventType) {
    it(`should emit an ${eventName} event`, function(done) {
      TestUtils.Simulate[eventType || 'change'](component.querySelector(selector));

      setTimeout(() => {
        sinon.assert.calledOnce(props[eventName]);
        done();
      }, INPUT_DEBOUNCE_MILLISECONDS);
    });
  }

  function rendersShowDimensionLabelsAndEmitsEvents() {
    describe('rendering', function() {
      it('renders a show dimension labels checkbox', function() {
        expect(component.querySelector('#show-dimension-labels')).to.exist;
      });
    });

    describe('events', function() {
      describe('when changing the show dimension labels checkbox', function() {
        emitsEvent('#show-dimension-labels', 'onChangeShowDimensionLabels');
      });
    });
  }

  function rendersShowValueLabelsAndEmitsEvents() {
    describe('rendering', function() {
      it('renders a show value labels checkbox', function() {
        expect(component.querySelector('#show-value-labels')).to.exist;
      });
    });

    describe('events', function() {
      describe('when changing the show value labels checkbox', function() {
        emitsEvent('#show-value-labels', 'onChangeShowValueLabels');
      });
    });
  }

  function rendersShowValueLabelsAsPercentAndEmitEvents() {
    describe('rendering', function() {
      it('renders a show value labels as percentage checkbox', function() {
        expect(component.querySelector('#show-value-labels-as-percent')).to.exist;
      });
    });

    describe('events', function () {
      describe('when changing the show value labels as percent checkbox', function () {
        emitsEvent('#show-value-labels-as-percent', 'onChangeShowValueLabelsAsPercent');
      })
    });
  }

  function rendersTopAndLeftLabelsAndEmitsEvents() {
    describe('rendering', function() {
      it('renders a top label input', function() {
        expect(component.querySelector('#label-top')).to.exist;
      });

      it('renders a left label input', function() {
        expect(component.querySelector('#label-left')).to.exist;
      });
    });

    describe('events', function() {
      describe('when changing the top label', function() {
        emitsEvent('#label-top', 'onChangeLabelTop');
      });

      describe('when changing the left label', function() {
        emitsEvent('#label-left', 'onChangeLabelLeft');
      });
    });
  }

  function rendersBottomAndLeftLabelsAndEmitsEvents() {
    describe('rendering', function() {
      it('renders a bottom label input', function() {
        expect(component.querySelector('#label-bottom')).to.exist;
      });

      it('renders a left label input', function() {
        expect(component.querySelector('#label-left')).to.exist;
      });
    });

    describe('events', function() {
      describe('when changing the bottom label', function() {
        emitsEvent('#label-bottom', 'onChangeLabelBottom');
      });

      describe('when changing the left label', function() {
        emitsEvent('#label-left', 'onChangeLabelLeft');
      });
    });
  }

  describe('without a visualization type', function() {
    beforeEach(setUpVisualization(null));

    describe('rendering', function() {
      it('renders an empty pane info message', function() {
        expect(component.querySelector('.authoring-empty-pane')).to.exist;
      });
    });
  });

  describe('with a visualization type', function() {
    beforeEach(setUpVisualization('barChart'));

    describe('rendering', function() {
      it('renders a title text input', function() {
        expect(component.querySelector('input[type="text"]')).to.exist;
      });

      it('renders a description text area', function() {
        expect(component.querySelector('textarea')).to.exist;
      });

      it('renders a source data link checkbox', function() {
        expect(component.querySelector('input[type="checkbox"]')).to.exist;
      });
    });

    describe('events', function() {
      describe('when changing the title', function() {
        it('should emit an onChangeTitle event', function(done) {
          var input = component.querySelector('input[type="text"]');

          TestUtils.Simulate.change(input);

          setTimeout(() => {
            sinon.assert.calledOnce(props.onChangeTitle);
            done();
          }, INPUT_DEBOUNCE_MILLISECONDS);
        });
      });

      describe('when changing the description', function() {
        it('should emit an onChangeDescription event', function(done) {
          var textarea = component.querySelector('textarea');

          TestUtils.Simulate.change(textarea);

          setTimeout(() => {
            sinon.assert.calledOnce(props.onChangeDescription);
            done();
          }, INPUT_DEBOUNCE_MILLISECONDS);
        });
      });

      describe('when changing the visibility of source data link', function() {
        it('should emit an onChangeShowSourceDataLink event', function() {
          var checkbox = component.querySelector('input[type="checkbox"]');

          TestUtils.Simulate.change(checkbox);
          sinon.assert.calledOnce(props.onChangeShowSourceDataLink);
        });
      });
    });
  });

  describe('regionMap', function() {
    beforeEach(setUpVisualization('regionMap'));

    describe('rendering', function() {
      it('renders color scale', function() {
        expect(component.querySelector('#color-scale')).to.exist;
      });

      it('renders map type', function() {
        expect(component.querySelector('#base-layer')).to.exist;
      });

      it('renders map opacity', function() {
        expect(component.querySelector('#base-layer-opacity')).to.exist;
      });
    });

    describe('events', function() {
      describe('when changing the color scale', function() {
        emitsEvent('#color-scale .picklist-option', 'onSelectColorScale', 'click');
      });

      describe('when changing the map type', function() {
        emitsEvent('#base-layer .picklist-option', 'onSelectBaseLayer', 'click');
      });
    });
  });

  describe('barChart', function () {
    beforeEach(setUpVisualization('barChart'));

    describe('rendering', function() {
      it('renders an input', function() {
        expect(component.querySelector('.color-picker')).to.exist;
      });
    });

    rendersShowDimensionLabelsAndEmitsEvents();
    rendersShowValueLabelsAndEmitsEvents();
    rendersTopAndLeftLabelsAndEmitsEvents();
  });

  describe('columnChart', function() {
    beforeEach(setUpVisualization('columnChart'));

    describe('rendering', function() {
      it('renders an input', function() {
        expect(component.querySelector('.color-picker')).to.exist;
      });
    });

    rendersShowDimensionLabelsAndEmitsEvents();
    rendersBottomAndLeftLabelsAndEmitsEvents();
  });

  describe('histogram', function() {
    beforeEach(setUpVisualization('histogram'));

    describe('rendering', function() {
      it('renders an input', function() {
        expect(component.querySelector('.color-picker')).to.exist;
      });
    });

    rendersBottomAndLeftLabelsAndEmitsEvents();
  });

  describe('featureMap', function() {
    beforeEach(setUpVisualization('featureMap'));

    describe('rendering', function() {
      it('renders point color', function() {
        expect(component.querySelector('.color-picker')).to.exist;
      });

      it('renders point opacity', function() {
        expect(component.querySelector('#point-opacity')).to.exist;
      });

      it('renders point size', function() {
        expect(component.querySelector('#point-size')).to.exist;
      });

      it('renders map type', function() {
        expect(component.querySelector('#base-layer')).to.exist;
      });

      it('renders map opacity', function() {
        expect(component.querySelector('#base-layer-opacity')).to.exist;
      });
    });

    describe('events', function() {
      emitsEvent('#base-layer .picklist-option', 'onSelectBaseLayer', 'click');
    });
  });

  describe('timelineChart', function() {
    beforeEach(setUpVisualization('timelineChart'));

    describe('rendering', function() {
      it('renders an input', function() {
        expect(component.querySelector('.color-picker')).to.exist;
      });
    });

    rendersBottomAndLeftLabelsAndEmitsEvents();
  });

  describe('pieChart', () => {
    beforeEach(setUpVisualization('pieChart'));

    describe('rendering', () => {
      it('renders color palette selection', () => {
        expect(component.querySelector('#color-palette')).to.exist;
      });
    });

    rendersShowValueLabelsAndEmitsEvents();
    rendersShowValueLabelsAsPercentAndEmitEvents();
  });


});
