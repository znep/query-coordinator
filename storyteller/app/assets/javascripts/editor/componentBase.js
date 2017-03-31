import $ from 'jquery';
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';

import './componentResizable';
import './withLayoutHeightFromComponentData';
import Actions from './Actions';
import I18n from './I18n';
import StorytellerUtils from '../StorytellerUtils';
import { dispatcher } from './Dispatcher';
import ComponentEditMenu from './ComponentEditMenu';

//TODO gferrari(11/24/2015): We should consider factoring the
//endemic if(data is different) { update() } logic into here.
//Right now each component implements this in special snowflake
//ways.
$.fn.componentBase = componentBase;

/*
 * Supported props:
 *
 * componentData (required)
 * theme (required)
 * blockId (required)
 * componentIndex (required)
 *
 * isComponentValidMoveDestination
 * isUserChoosingMoveDestination
 * isComponentBeingMoved
 *
 * editMode
 * editButtonSupported
 * resizeSupported
 * resizeOptions
 * defaultHeight
 * firstRenderCallback
 * dataChangedCallback
 */

export default function componentBase(props) {
  StorytellerUtils.assert(arguments.length === 1, 'Invalid invocation of componentBase');

  StorytellerUtils.assertHasProperties(
    props,
    'componentData',
    'theme',
    'blockId',
    'componentIndex'
  );

  props = _.extend(
    {
      // Note that it isn't possible to switch between edit
      // and non-edit modes (not that it would be hard to add,
      // we just don't need it now).
      editMode: false,

      editButtonSupported: true,

      resizeSupported: false,
      resizeOptions: {},

      // If not blank, establishes a default height for the component.
      // It is used if value.layout.height is not defined in componentData.
      defaultHeight: undefined,

      isComponentValidMoveDestination: false,
      isUserChoosingMoveDestination: false,
      isComponentBeingMoved: false,

      dataChangedCallback: _.noop,
      firstRenderCallback: _.noop
    },
    props
  );


  const {
    componentData,
    firstRenderCallback,
    dataChangedCallback,
    editMode,
    editButtonSupported,
    resizeSupported,
    resizeOptions,
    defaultHeight,
    isComponentValidMoveDestination,
    isUserChoosingMoveDestination,
    isComponentBeingMoved
  } = props;

  const currentData = this.data('component-rendered-data');
  this.data('props', props);

  $(document.body).removeClass('moving');
  this.removeClass('moving');

  this.toggleClass('editing', editMode);
  this.withLayoutHeightFromComponentData(componentData, defaultHeight);

  if (editMode) {
    renderMoveActionOverlay(this);

    $(document.body).toggleClass('moving', isUserChoosingMoveDestination);
    this.toggleClass('moving', isUserChoosingMoveDestination);
    this.toggleClass('moving-source', isComponentBeingMoved);
    this.toggleClass('moving-valid-destination', isComponentValidMoveDestination);
  }

  if (editMode && editButtonSupported) {
    let container = this.find('.component-edit-controls-container');

    if (this.find('.component-edit-controls-container').length === 0) {
      container = $('<div>', { class: 'component-edit-controls-container' }).appendTo(this);
    }

    ReactDOM.render(<ComponentEditMenu componentData={componentData} />, container[0]);
  }

  if (editMode && resizeSupported) {
    this.componentResizable(resizeOptions);
  }

  if (!this.data('component-rendered')) {
    // First render
    this.data('component-rendered', true);
    firstRenderCallback.call(this, componentData);
  }

  if (!_.isEqual(currentData, componentData)) {
    this.data('component-rendered-data', componentData);
    dataChangedCallback.call(this, componentData);
  }

  return this;
}

function renderMoveActionOverlay(element) {
  let $moveCancelOverlay = element.find('.component-edit-move-action-overlay');

  if ($moveCancelOverlay.length === 0) {
    const onPlaceButtonClick = (event) => {
      if (!element.hasClass('moving-valid-destination')) {
        return;
      }

      event.stopPropagation();

      const { blockId, componentIndex } = element.data('props');

      dispatcher.dispatch({
        action: Actions.MOVE_COMPONENT_DESTINATION_CHOSEN,
        blockId,
        componentIndex: parseInt(componentIndex, 10)
      });
    };


    const $movePlaceButton = $('<button>', { class: 'btn btn-alternate-2 btn-move-place' }).
      click(onPlaceButtonClick).
      text(I18n.t('editor.components.edit_controls.swap_here'));

    const $moveCancelButton = $('<button>', { class: 'btn btn-simple btn-move-cancel' }).
      click((event) => {
        event.stopPropagation();

        dispatcher.dispatch({
          action: Actions.MOVE_COMPONENT_CANCEL
        });
      }).
      text(I18n.t('editor.components.edit_controls.cancel'));

    $moveCancelOverlay = $('<div>', {
      class: 'component-edit-move-action-overlay'
    }).
    click(onPlaceButtonClick).
    append([$moveCancelButton, $movePlaceButton]);

    element.append($moveCancelOverlay);
  }
}
