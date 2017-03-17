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
import EditBar from './components/EditBar';
import ExternalViewCard from './components/ViewCard/ExternalViewCard';
import FilterBar from './components/FilterBar';
import InfoPane from './components/InfoPane';
import Slider from './components/Slider';
import DateRangePicker from './components/DateRangePicker';
import SocrataIcon from './components/SocrataIcon';
import Modal, { ModalHeader, ModalContent, ModalFooter } from './components/Modal';
import SideMenu, { MenuListItem, ExpandableMenuListItem } from './components/SideMenu';
import { Flannel, FlannelHeader, FlannelContent, FlannelFooter } from './components/Flannel';

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
  EditBar,
  ExternalViewCard,
  FilterBar,
  InfoPane,
  Slider,
  DateRangePicker,
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
  SocrataIcon,
  SideMenu,
  MenuListItem,
  ExpandableMenuListItem,
  Flannel,
  FlannelHeader,
  FlannelContent,
  FlannelFooter
};
