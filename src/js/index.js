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
import Picklist from './components/Picklist';
import ViewCard from './components/ViewCard';
import ExternalViewCard from './components/ViewCard/ExternalViewCard';
import FilterBar from './components/FilterBar';
import InfoPane from './components/InfoPane';
import Slider from './components/Slider';
import Modal, { ModalHeader, ModalContent, ModalFooter } from './components/Modal';

module.exports = {
  attachTo: function(element) {
    Object.keys(this.factories).forEach(function(factory) {
      new this.factories[factory](element); // eslint-disable-line no-new
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
  Dropdown,
  Picklist,
  ViewCard,
  ExternalViewCard,
  FilterBar,
  InfoPane,
  Slider,
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter
};
