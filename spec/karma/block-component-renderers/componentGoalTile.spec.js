import $ from 'jQuery';
import _ from 'lodash';

import { $transient } from '../TransientElement';
import StorytellerUtils from '../../../app/assets/javascripts/StorytellerUtils';
import '../../../app/assets/javascripts/editor/block-component-renderers/componentGoalTile';

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
    'metadata': {
      'custom_subtitle': 'Custom Subtitle'
    },
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
      }
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

  function stubApiAndCreateComponentWith(statusCode, response, componentData) {
    var server;

    beforeEach(function(done) {
      server = sinon.fakeServer.create();
      server.respondImmediately = true;
      server.respondWith(
        'GET',
        StorytellerUtils.format(
          'https://example.com/stat/api/v1/goals/{0}.json',
          componentData.value.goalUid
        ),
        [
          statusCode,
          { 'Content-Type': 'application/json' },
          JSON.stringify(response)
        ]
      );

      $component = $component.componentGoalTile(componentData);

      // Need to use a setTimeout to escape the stack and resolve the promise.
      setTimeout(function() { done(); }, 0);
    });

    afterEach(function() {
      server.restore();
    });
  }

  before(function() {
    sinon.stub(StorytellerUtils, 'fetchDomainStrings', function() {
      return Promise.resolve(fakeDomainStrings);
    });
  });

  after(function() {
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
        $component.componentGoalTile(badData);
      });
    });
  });

  describe('given a value that does not contain a goalUid', function() {

    it('should throw when setting the tile source', function() {
      var badData = _.cloneDeep(validComponentData);

      delete badData.value.goalUid;

      assert.throws(function() {
        $component.componentGoalTile(badData);
      });
    });
  });

  describe('given a value that does not contain a goalFullUrl', function() {

    it('should throw when setting the tile source', function() {
      var badData = _.cloneDeep(validComponentData);

      delete badData.value.goalFullUrl;

      assert.throws(function() {
        $component.componentGoalTile(badData);
      });
    });
  });

  describe('when there is no goal with that 4x4', function() {
    stubApiAndCreateComponentWith(404, {}, validComponentData);

    it('should render an error message', function() {
      assert.isTrue($component.hasClass('component-error'));
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
