import $ from 'jQuery';

import { $transient } from './TransientElement';
import Actions from '../../app/assets/javascripts/editor/Actions';
import Dispatcher from '../../app/assets/javascripts/editor/Dispatcher';
import {__RewireAPI__ as componentEditButtonAPI} from '../../app/assets/javascripts/editor/componentEditButton';

import StandardMocks from './StandardMocks';

describe('componentEditButton jQuery plugin', function() {

  var $component;
  var dispatcher;

  beforeEach(function() {
    dispatcher = new Dispatcher();
    $transient.append('<div>');
    $component = $transient.children('div');
    $component.attr('data-block-id', StandardMocks.validBlockId);
    $component.attr('data-component-index', 0);

    $component.componentEditButton();

    componentEditButtonAPI.__Rewire__('dispatcher', dispatcher);
  });

  afterEach(function() {
    componentEditButtonAPI.__ResetDependency__('dispatcher');
  });

  it('should return a jQuery object for chaining', function() {
    assert.instanceOf($component.componentEditButton(), $, 'Returned value is not a jQuery collection');
  });

  it('dispatches Actions.ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED', function(done) {
    dispatcher.register(function(payload) {
      if (payload.action === Actions.ASSET_SELECTOR_EDIT_EXISTING_ASSET_EMBED) {
        assert.equal(payload.blockId, StandardMocks.validBlockId);
        assert.equal(payload.componentIndex, 0);
        done();
      }
    });
    $component.find('.component-edit-controls-edit-btn').click();
  });
});
