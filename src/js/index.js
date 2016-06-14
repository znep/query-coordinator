var Styleguide = {
  DropdownFactory: require('./dropdown'),
  FlannelFactory: require('./flannel'),
  FlyoutFactory: require('./flyout'),
  MenuFactory: require('./menu'),
  ModalFactory: require('./modal'),
  TabsFactory: require('./tabs'),
  ToggleFactory: require('./toggle'),
  TourFactory: require('./tour')
};

function bootstrap(element) {
  return function() {
    Object.keys(Styleguide).forEach(function(factory) {
      new Styleguide[factory](element);
    });
  };
}

module.exports = function(element) {
  if (document.readyState === 'complete') {
    bootstrap(element)();
  } else {
    document.addEventListener('DOMContentLoaded', bootstrap(element));
  }

  return Styleguide;
};
