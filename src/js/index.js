var Styleguide = {
  DropdownFactory: require('./dropdown'),
  FlannelFactory: require('./flannel'),
  FlyoutFactory: require('./flyout'),
  MenuFactory: require('./menu'),
  ModalFactory: require('./modal'),
  ToggleFactory: require('./toggle'),
  TourFactory: require('./tour')
};

module.exports = function(element) {
  document.addEventListener('DOMContentLoaded', function() {
    new Styleguide.DropdownFactory(element);
    new Styleguide.FlannelFactory(element);
    new Styleguide.FlyoutFactory(element);
    new Styleguide.MenuFactory(element);
    new Styleguide.ToggleFactory(element);
    new Styleguide.TourFactory(element);
  });

  return Styleguide;
};
