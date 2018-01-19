import { assert } from 'chai';
import $ from 'jquery';
import mockVif from './mockVif';
import { __RewireAPI__ as HydratorAPI, hydrateEmbed } from 'visualization_embed/hydrator';
import _ from 'lodash';
import sinon from 'sinon';

let mockVisualizationRenderer;
let mockLogWarning;

beforeEach(() => {
  mockVisualizationRenderer = sinon.stub();
  mockLogWarning = sinon.stub();
  HydratorAPI.__Rewire__('VisualizationRenderer', mockVisualizationRenderer);
  HydratorAPI.__Rewire__('logWarning', mockLogWarning);
});

afterEach(() => {
  HydratorAPI.__ResetDependency__('VisualizationRenderer');
  HydratorAPI.__ResetDependency__('logWarning');
});

describe('hydrateEmbed', () => {
  const validProps = {
    'data-embed-version': 1,
    'data-vif': JSON.stringify(mockVif)
  };

  const elementContainer = $('<div>');
  let element;

  // Helpers
  const withProps = (props) => {
    beforeEach(() => {
      element = $(
        '<a>',
        props
      )[0];
      elementContainer.empty().append(element);
    });
  };

  const findRendered = () => elementContainer.find('.rendered')[0];

  const itShouldRender = () => {
    it('should call new VisualizationRenderer()', () => {
      hydrateEmbed(element);
      sinon.assert.calledOnce(mockVisualizationRenderer);
    });
    it('should add the `rendered` class', () => {
      hydrateEmbed(element);
      assert.isOk(findRendered());
    });
    it('should store the vif in a data attribute', () => {
      hydrateEmbed(element);
      assert.deepEqual($(findRendered()).data('vif'), mockVif);
    });
    it('should add width and height styles', () => {
      hydrateEmbed(element);
      const style = findRendered().getAttribute('style');
      assert.match(style, /height:/);
      assert.match(style, /width:/);
    });
  };

  const itShouldNotRender = () => {
    it('should call new VisualizationRenderer()', () => {
      hydrateEmbed(element);
      sinon.assert.notCalled(mockVisualizationRenderer);
    });
  };

  const itShouldWarn = () => {
    it('should not log a warning', () => {
      hydrateEmbed(element);
      sinon.assert.called(mockLogWarning);
    });
  };

  const itShouldNotWarn = () => {
    it('should not log a warning', () => {
      hydrateEmbed(element);
      sinon.assert.notCalled(mockLogWarning);
    });
  };

  describe('valid configuration', () => {
    withProps(validProps);
    itShouldRender();
    itShouldNotWarn();
  });

  describe('missing embed version', () => {
    withProps(_.omit(validProps, 'data-embed-version'));
    itShouldNotRender();
    itShouldWarn();
  });

  describe('unexpected embed version', () => {
    withProps(_.extend({}, validProps, { 'data-embed-version': 1000 }));
    itShouldNotRender();
    itShouldWarn();
  });

  describe('missing vif', () => {
    withProps(_.omit(validProps, 'data-vif'));
    itShouldNotRender();
    itShouldWarn();
  });

  describe('unparseable vif', () => {
    withProps(_.extend({}, validProps, { 'data-vif': 'nope' }));
    itShouldNotRender();
    itShouldWarn();
  });

  describe('already rendered', () => {
    withProps(_.extend({}, validProps, { 'class': 'rendered' }));
    itShouldNotRender();
    itShouldWarn();
  });

  describe('custom width and height', () => {
    withProps(_.extend({}, validProps, {
      'data-width': '444px',
      'data-height': '555px'
    }));

    itShouldRender();
    itShouldNotWarn();

    it('should add width and height styles with the correct values', () => {
      hydrateEmbed(element);
      const style = findRendered().getAttribute('style');
      assert.match(style, /width: 444px/);
      assert.match(style, /height: 555px/);
    });
  });

  describe('custom ID and class', () => {
    withProps(_.extend({}, validProps, {
      'class': 'test-class',
      id: 'test-id'
    }));

    itShouldRender();
    itShouldNotWarn();

    it('should add width and height styles with the correct values', () => {
      hydrateEmbed(element);
      const rendered = findRendered();
      assert.match(rendered.getAttribute('class'), /test-class/);
      assert.equal(rendered.getAttribute('id'), 'test-id');
    });
  });
});
