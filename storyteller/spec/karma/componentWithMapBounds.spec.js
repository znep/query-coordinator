import _ from 'lodash';
import sinon from 'sinon';
import { assert } from 'chai';

import { $transient } from './TransientElement';
import StandardMocks from './StandardMocks';
import Actions from 'editor/Actions';
import Store from 'editor/stores/Store';
import {__RewireAPI__ as componentWithMapBoundsAPI} from '../../app/assets/javascripts/editor/componentWithMapBounds';

describe('componentWithMapBounds jQuery plugin', function() {

  let $component;
  let validComponentData;
  let mapNotificationDismissalStore;
  let dispatchStub;

  beforeEach(function() {
    validComponentData = {
      type: 'socrata.visualization.regionMap',
      value: {
        vif: {
          configuration: {},
          unit: { one: 'record', other: 'records' }
        }
      }
    };

    const MapNotificationDismissalMock = function() {
      _.extend(this, new Store());
      this.isDismissed = _.constant(false);
    };

    mapNotificationDismissalStore = new MapNotificationDismissalMock();
    componentWithMapBoundsAPI.__Rewire__(
      'mapNotificationDismissalStore',
      mapNotificationDismissalStore
    );

    dispatchStub = sinon.stub();
    componentWithMapBoundsAPI.__Rewire__('dispatcher', {
      dispatch: dispatchStub,
      isDispatching: _.constant(false)
    });

    $transient.append(
      `<div data-block-id="${StandardMocks.validBlockId}" data-component-index="0"></div>`
    );
    $component = $transient.children('div');
    $component.componentWithMapBounds(validComponentData);
  });

  afterEach(function() {
    dispatchStub.reset();
    componentWithMapBoundsAPI.__ResetDependency__('dispatcher');
    componentWithMapBoundsAPI.__ResetDependency__('mapNotificationDismissalStore');
  });

  it('dispatches BLOCK_UPDATE_COMPONENT on SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED', function() {
    const newCenterAndZoom = { center: {}, zoom: 5 };
    const newVif = _.cloneDeep(validComponentData.value.vif);
    _.set(newVif, 'configuration.mapCenterAndZoom', newCenterAndZoom);

    $component[0].dispatchEvent(
      new window.CustomEvent(
        'SOCRATA_VISUALIZATION_MAP_CENTER_AND_ZOOM_CHANGED',
        { detail: newCenterAndZoom, bubbles: true }
      )
    );

    sinon.assert.calledWith(dispatchStub, {
      action: Actions.BLOCK_UPDATE_COMPONENT,
      blockId: StandardMocks.validBlockId,
      componentIndex: 0,
      type: 'socrata.visualization.regionMap',
      value: _.merge({}, validComponentData.value, {
        vif: newVif
      })
    });
  });

  describe('map zoom and center notification', function() {
    it('renders', function() {
      assert.equal($component.find('.notification-container').length, 1);
    });

    it('dispatches DISMISS_MAP_NOTIFICATION on dismiss button click', function() {
      $component.find('.notification-container button').click();

      sinon.assert.calledWith(dispatchStub, {
        action: Actions.DISMISS_MAP_NOTIFICATION,
        blockId: StandardMocks.validBlockId,
        componentIndex: 0
      });
    });

    it('removes the notification on dismissal', function() {
      mapNotificationDismissalStore.isDismissed = _.constant(true);
      mapNotificationDismissalStore._emitChange();
      assert.equal($component.find('.notification-container').length, 0);
    });
  });
});
