var Styleguide = module.exports = {
  Dropdown: require('./dropdown'),
  FlannelFactory: require('./flannel'),
  FlyoutFactory: require('./flyout'),
  MenuFactory: require('./menu'),
  ModalFactory: require('./modal'),
  ToggleFactory: require('./toggle'),
  TourFactory: require('./tour')
};

document.addEventListener('DOMContentLoaded', function() {
  new Styleguide.Dropdown(document);
  new Styleguide.FlannelFactory(document);
  new Styleguide.FlyoutFactory(document);
  new Styleguide.MenuFactory(document);
  new Styleguide.ToggleFactory(document);
  new Styleguide.TourFactory(document);
});
