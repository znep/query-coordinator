// This line is due to an eslint config mismatch between frontend and common.
// See EN-16549
/* eslint-disable import/default */

/**
 * Main entry point of Common Components.
 * You should import this file instead of directly
 * importing the components. This gives us the option
 * of changing internal file organization without
 * having to update all code using common components.
 */
import DropdownFactory from './legacy/Dropdown';
import FlannelFactory from './legacy/Flannel';
import FlyoutFactory from './legacy/Flyout';
import MenuFactory from './legacy/Menu';
import ModalFactory from './legacy/Modal';
import TabsFactory from './legacy/Tabs';
import ToggleFactory from './legacy/Toggle';
import TourFactory from './legacy/Tour';

import ColorPicker from './ColorPicker';
import Dropdown from './Dropdown';
import Picklist from './Picklist';
import ViewCard from './ViewCard';
import EditBar from './EditBar';
import ExternalViewCard from './ViewCard/ExternalViewCard';
import FilterBar from './FilterBar';
import InfoPane from './InfoPane';
import Slider from './Slider';
import DateRangePicker from './DateRangePicker';
import FilterItem from './FilterBar/FilterItem';
import SocrataIcon from './SocrataIcon';
import Modal, { ModalHeader, ModalContent, ModalFooter } from './Modal';
import SideMenu, { MenuListItem, ExpandableMenuListItem } from './SideMenu';
import { Flannel, FlannelHeader, FlannelContent, FlannelFooter } from './Flannel';

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
  FilterItem,
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
