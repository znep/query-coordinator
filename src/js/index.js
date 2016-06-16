module.exports = {
  attachTo: function(element) {
    Object.keys(this.factories).forEach(function(factory) {
      new this.factories[factory](element);
    }, this);
  },

  factories: {
    DropdownFactory: require('./dropdown'),
    FlannelFactory: require('./flannel'),
    FlyoutFactory: require('./flyout'),
    MenuFactory: require('./menu'),
    ModalFactory: require('./modal'),
    TabsFactory: require('./tabs'),
    ToggleFactory: require('./toggle'),
    TourFactory: require('./tour')
  },

  components: {
    ColorPicker: require('./colorpicker').ColorPicker
  }
};
