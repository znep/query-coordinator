import $ from 'jQuery';
import _ from 'lodash';
import './componentResizable';
import './componentEditButton';
import './withLayoutHeightFromComponentData';

//TODO gferrari(11/24/2015): We should consider factoring the
//endemic if(data is different) { update() } logic into here.
//Right now each component implements this in special snowflake
//ways.
$.fn.componentBase = componentBase;

export default function componentBase(componentData, theme, options, firstRenderCallback, dataChangedCallback) {
  var currentData = this.data('component-rendered-data');

  options = _.extend(
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
      defaultHeight: undefined
    },
    options
  );

  this.toggleClass('editing', options.editMode);
  this.withLayoutHeightFromComponentData(componentData, options.defaultHeight);

  if (options.editMode && options.editButtonSupported) {
    this.componentEditButton();
  }

  if (options.editMode && options.resizeSupported) {
    this.componentResizable(options.resizeOptions);
  }

  if (!this.data('component-rendered')) {
    // First render
    this.data('component-rendered', true);
    (firstRenderCallback || _.noop).call(this, componentData);
  }

  if (!_.isEqual(currentData, componentData)) {
    this.data('component-rendered-data', componentData);
    (dataChangedCallback || _.noop).call(this, componentData);
  }

  return this;
}
