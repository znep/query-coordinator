(function(root, $) {

  'use strict';

  //TODO gferrari(11/24/2015): We should consider factoring the
  //endemic if(data is different) { update() } logic into here.
  //Right now each component implements this in special snowflake
  //ways.
  function componentBase(componentData, theme, options) {
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

    return this;
  }

  $.fn.componentBase = componentBase;
})(window, jQuery);
