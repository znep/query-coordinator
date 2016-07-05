module.exports = {
  attachTo: function(element) {
    Object.keys(this.factories).forEach(function(factory) {
      new this.factories[factory](element);
    }, this);
  },

  factories: {
    DropdownFactory: require('./Dropdown'),
    FlannelFactory: require('./Flannel'),
    FlyoutFactory: require('./Flyout'),
    MenuFactory: require('./Menu'),
    ModalFactory: require('./Modal'),
    TabsFactory: require('./Tabs'),
    ToggleFactory: require('./Toggle'),
    TourFactory: require('./Tour')
  },

  components: {
    ColorPicker: require('./ColorPicker').ColorPicker,
    Dropdown: require('./components/Dropdown').Dropdown
  }
};
