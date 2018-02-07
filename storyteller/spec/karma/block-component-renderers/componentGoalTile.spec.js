import $ from 'jquery';
import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';

import { $transient } from '../TransientElement';
import I18nMocker from '../I18nMocker';
import StorytellerUtils from 'StorytellerUtils';
import {__RewireAPI__ as componentGoalTileAPI} from 'editor/block-component-renderers/componentGoalTile';

describe('componentGoalTile jQuery plugin', function() {
  var $component;
  var validComponentData = {
    type: 'goal.tile',
    value: {
      domain: 'example.com',
      goalUid: 'test-test',
      goalFullUrl: 'https://example.com/stat/goals/default/abcd-efgh/test-test'
    }
  };
  var validGoalData = {
    'id': 'test-test',
    'name': 'Goal Title',
    'is_public': true,
    'prevailing_measure': {
      'end': '2015-12-31T23:59:59.000',
      'unit': 'percent',
      'computed_values': {
        'status': 'computed',
        'metric': {
          'current_value': 99.999
        },
        'progress': {
          'progress': 'good'
        }
      },
      'summary': 'This is a fake summary'
    }
  };
  var fakeDomainStrings = {
    open_performance: {
      measure: {
        end_progress: {
          bad: 'test override string'
        }
      }
    }
  };

  const getProps = (props) => {
    return _.extend({
      blockId: null,
      componentData: validComponentData,
      componentIndex: null,
      theme: null,
      editMode: true
    }, props);
  };

  function stubApiAndCreateComponentWith(statusCode, response, componentData) {
    var server;

    beforeEach(function(done) {
      server = sinon.fakeServer.create();
      server.respondImmediately = true;
      server.respondWith(
        'GET',
        StorytellerUtils.format(
          'https://example.com/api/stat/v1/goals/{0}.json',
          componentData.value.goalUid
        ),
        [
          statusCode,
          { 'Content-Type': 'application/json' },
          JSON.stringify(response)
        ]
      );

      $component = $component.componentGoalTile(getProps({
        componentData
      }));

      // Need to use a setTimeout to escape the stack and resolve the promise.
      setTimeout(function() { done(); }, 0);
    });

    afterEach(function() {
      server.restore();
    });
  }

  before(function() {
    componentGoalTileAPI.__Rewire__('I18n', I18nMocker);
    sinon.stub(StorytellerUtils, 'fetchDomainStrings').callsFake(function() {
      return Promise.resolve(fakeDomainStrings);
    });
  });

  after(function() {
    componentGoalTileAPI.__ResetDependency__('I18n');
    StorytellerUtils.fetchDomainStrings.restore();
  });

  beforeEach(function() {
    $transient.append('<div>');
    $component = $transient.children('div');
  });

  it('should throw when passed invalid arguments', function() {

    assert.throws(function() { $component.componentGoalTile(); });
    assert.throws(function() { $component.componentGoalTile(1); });
    assert.throws(function() { $component.componentGoalTile(null); });
    assert.throws(function() { $component.componentGoalTile(undefined); });
    assert.throws(function() { $component.componentGoalTile({}); });
    assert.throws(function() { $component.componentGoalTile([]); });
  });

  describe('given a value that does not contain a domain', function() {

    it('should throw when setting the tile source', function() {
      var badData = _.cloneDeep(validComponentData);

      delete badData.value.domain;

      assert.throws(function() {
        $component.componentGoalTile(getProps({
          componentData: badData
        }));
      });
    });
  });

  describe('given a value that does not contain a goalUid', function() {

    it('should throw when setting the tile source', function() {
      var badData = _.cloneDeep(validComponentData);

      delete badData.value.goalUid;

      assert.throws(function() {
        $component.componentGoalTile(getProps({
          componentData: badData
        }));
      });
    });
  });

  describe('given a value that does not contain a goalFullUrl', function() {

    it('should throw when setting the tile source', function() {
      var badData = _.cloneDeep(validComponentData);

      delete badData.value.goalFullUrl;

      assert.throws(function() {
        $component.componentGoalTile(getProps({
          componentData: badData
        }));
      });
    });
  });

  describe('when there is no goal with that 4x4', function() {
    stubApiAndCreateComponentWith(404, {}, validComponentData);

    it('should render an error message', function() {
      assert.isTrue($component.hasClass('component-error'));
    });

    describe('the edit controls', function() {
      it('should still be attached to the component', function() {
        assert.lengthOf($component.find('.component-edit-controls-container'), 1);
      });
    });
  });

  describe('given a valid component type and value', function() {
    stubApiAndCreateComponentWith(200, validGoalData, validComponentData);

    it('should return a jQuery object for chaining', function() {
      assert.instanceOf($component, $, 'Returned value is not a jQuery collection');
    });

    it('should render the tile as a link to the goal', function() {

      assert.equal(
        $component.attr('href'),
        validGoalData.goalFullUrl
      );
    });

    it('should render the goal title container', function() {
      assert.lengthOf($component.find('.goal-tile-title-container'), 1);
    });

    it('should render the goal metric container', function() {
      assert.lengthOf($component.find('.goal-tile-metric-container'), 1);
    });

    describe('for progress values whose translations have not been overridden', function() {

      it('should render the goal metric progress with default status strings', function() {
        var $progress = $component.find('.goal-tile-metric-progress');

        assert.lengthOf($progress, 1);
        assert.include($progress.text(), 'good');
      });
    });

    it('should render the goal metadata container', function() {
      assert.lengthOf($component.find('.goal-tile-metadata-container'), 1);
    });

    it('should render the story title', function() {
      assert.equal($component.find('.goal-tile-title').text(), validGoalData.name);
    });

    it('should render the goal prevailing measure summary', function() {
      assert.equal($component.find('.goal-tile-metric-subtitle').text(), validGoalData.prevailing_measure.summary);
    });

    describe('the edit controls', function() {
      it('should still be attached to the component', function() {
        assert.lengthOf($component.find('.component-edit-controls-container'), 1);
      });
    });
  });

  describe('when there is not a prevailing measure summary', function() {
    var goalData = _.cloneDeep(validGoalData);
    delete goalData.prevailing_measure.summary;

    stubApiAndCreateComponentWith(200, goalData, validComponentData);

    it('should render the goal with a default summary', function() {
      assert.equal($component.find('.goal-tile-metric-subtitle').text(), I18nMocker.t('editor.open_performance.measure.subheadline'));
    });
  });

  describe('with progress values whose translations have been overridden', function() {
    var validGoalDataWithBadProgress = _.cloneDeep(validGoalData);
    var validComponentDataWithDifferentUid = _.cloneDeep(validComponentData);

    validGoalDataWithBadProgress.prevailing_measure.computed_values.progress = { progress: 'bad' };
    validComponentDataWithDifferentUid.value.goalUid = 'asdf-fdsa';

    stubApiAndCreateComponentWith(200, validGoalDataWithBadProgress, validComponentDataWithDifferentUid);

    it('should render the goal metric progress with the overriden status strings', function() {
      var $progress = $component.find('.goal-tile-metric-progress');

      assert.lengthOf($progress, 1);
      assert.include($progress.text(), 'test override string');
    });
  });
});
