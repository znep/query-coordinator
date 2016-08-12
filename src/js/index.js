import DropdownFactory from './Dropdown';
import FlannelFactory from './Flannel';
import FlyoutFactory from './Flyout';
import MenuFactory from './Menu';
import ModalFactory from './Modal';
import TabsFactory from './Tabs';
import ToggleFactory from './Toggle';
import TourFactory from './Tour';

import ColorPicker from './components/ColorPicker';
import Dropdown from './components/Dropdown';

module.exports = {
  attachTo: function(element) {
    Object.keys(this.factories).forEach(function(factory) {
      new this.factories[factory](element);
    }, this);
  },

  factories: {
    DropdownFactory,
    FlannelFactory,
    FlyoutFactory,
    MenuFactory,
    ModalFactory,
    TabsFactory,
    ToggleFactory,
    TourFactory
  },

  ColorPicker,
  Dropdown
};
