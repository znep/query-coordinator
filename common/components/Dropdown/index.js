import _ from 'lodash';
import $ from 'jquery';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import SocrataUtils from 'common/js_utils';
import SocrataIcon from 'common/components/SocrataIcon';
import Picklist from 'common/components/Picklist';
import { ESCAPE, DOWN, SPACE, isolateEventByKeys, isOneOfKeys } from 'common/dom_helpers/keycodes_deprecated';

export class Dropdown extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedOption: this.getSelectedOption(props),
      focused: false,
      opened: false,
      mousedDownOnDropdown: false
    };

    _.bindAll(this, [
      'onMouseDown',
      'onAnyScroll',
      'onClickPlaceholder',
      'onFocusPlaceholder',
      'onBlurPlaceholder',
      'onKeyDownPlaceholder',
      'onKeyUpPlaceholder',
      'onFocusPicklist',
      'onBlurPicklist',
      'onSelectOption',
      'getSelectedOption',
      'openPicklist',
      'positionPicklist',
      'toggleIsolateScrolling',
      'toggleScrollEvents',
      'renderPlaceholder'
    ]);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      selectedOption: this.getSelectedOption(nextProps)
    });
  }

  shouldComponentUpdate(nextProps, nextState) {
    // Only render when something visible happens
    return (
      this.state.focused !== nextState.focused ||
      this.state.opened !== nextState.opened ||
      !_.isEqual(this.props, nextProps) ||
      // This allows changing selected value from parent component
      this.state.selectedOption !== nextState.selectedOption
    );
  }

  componentWillUpdate(nextProps, nextState) {
    // Only attach event handlers when the picklist is visible
    // And detach them when it is not
    if (this.state.focused !== nextState.focused || this.state.opened !== nextState.opened) {
      this.toggleScrollEvents(nextState.opened);
      this.toggleIsolateScrolling(nextState.opened);
      this.toggleDocumentMouseDown(nextState.opened);
      // Do not position the picklist if it is not visible (getBoundingClientRect triggers a reflow)
      this.positionPicklist();
    }
  }

  componentWillUnmount() {
    this.toggleScrollEvents(false);
    this.toggleIsolateScrolling(false);
    this.toggleDocumentMouseDown(false);
  }

  /*
   * document-level event listeners
   */

  /**
   * Looks up the DOM tree from the target and determine if the
   * options container is an ancestor. If not, close up the options
   * container because the user is scrolling outside of component.
   */
  onAnyScroll(event) {
    if (event && this.state.opened) {
      const list = $(event.target).closest('.dropdown-options-list');
      const nonrelated = list.length === 0;

      if (nonrelated) {
        this.setState({ opened: false });
      }
    }
  }

  /**
   * Safari and IE blur when the scrollbar is clicked to initiate a scrolling action.
   * This handler  will detect mouseDown on any part of the dropdown or picklist (most importantly
   * on the scrollbar itself) and set mousedDownOnDropdown to true.
   * mousedDownOnDropdown is consumed by onBlurPicklist() which will ignore the blur event from the picklist
   * if it's set to true
   * */
  onMouseDown(event) {
    if (event && this.state.opened && this.dropdownRef) {
      const dropdownOptionsList = _.find(this.dropdownRef.children, (elem) => {
        return elem.classList.contains('dropdown-options-list');
      });
      const dropdownRect = dropdownOptionsList.getBoundingClientRect();
      const [mouseX, mouseY] = [event.clientX, event.clientY];

      const xWithinDropdown = mouseX >= dropdownRect.left && mouseX <= dropdownRect.right;
      const yWithinDropdown = mouseY >= dropdownRect.top && mouseY <= dropdownRect.bottom;

      const mousedDownOnDropdown = xWithinDropdown && yWithinDropdown;

      // Close the dropdown if outside click detected
      if (!mousedDownOnDropdown) {
        this.setState({ opened: false, focused: true });
      }

      this.setState({ mousedDownOnDropdown });
    }
  }

  /*
   * component-level event listeners
   */

  onFocusPlaceholder() {
    this.setState({ focused: true });
  }

  onClickPlaceholder() {
    this.onAnyScroll();
    this.setState({ opened: !this.state.opened }, () => {
      if (this.state.opened && this.picklistRef) {
        this.picklistRef.picklist.focus();
      }
    });
  }

  /**
   * The state variable mousedDownOnDropdown determines
   * whether or not the blur we received should be
   * responded to. Mousedown is set to off regardless of
   * how we respond to ready for the next blur.
   */
  onBlurPlaceholder() {
    if (!this.placeholderRef) { return; }

    if (!this.state.mousedDownOnDropdown) {
      this.optionsRef.scrollTop = 0;
      this.setState({ focused: false });
    } else if (!this.state.opened && this.placeholderRef) {
      this.placeholderRef.focus();
    }

    this.setState({ mousedDownOnDropdown: false });
  }

  onKeyDownPlaceholder(event) {
    isolateEventByKeys(event, [DOWN, SPACE]);
  }

  onKeyUpPlaceholder(event) {
    isolateEventByKeys(event, [DOWN, SPACE]);

    if (isOneOfKeys(event, [ESCAPE])) {
      this.onBlurPlaceholder();
    } else if (isOneOfKeys(event, [DOWN, SPACE])) {
      this.openPicklist();
    }
  }

  onFocusPicklist() {
    this.setState({ focused: false });
  }

  onBlurPicklist() {
    if (!this.state.mousedDownOnDropdown) {
      this.setState({ focused: true, opened: false }, () => {
        if (this.placeholderRef) {
          this.placeholderRef.focus();
        }
      });
    }
  }

  onSelectOption(selectedOption) {
    this.props.onSelection(selectedOption);
    this.setState({ selectedOption, focused: true, opened: false }, () => {
      if (this.placeholderRef) {
        this.placeholderRef.focus();
      }
    });
  }

  getSelectedOption(props) {
    const { value, options } = props;
    return _.find(options, { value }) || null;
  }

  openPicklist() {
    const { options } = this.props;
    const selectedOption = this.state.selectedOption || _.first(options);

    this.setState({
      opened: true,
      selectedOption
    }, () => {
      if (this.picklistRef) {
        this.picklistRef.picklist.focus();
      }
    });
  }

  positionPicklist() {
    const hasOptions = this.optionsRef &&
      this.optionsRef.querySelectorAll('.picklist-option').length > 0;

    if (hasOptions) {
      const { displayTrueWidthOptions } = this.props;
      const containerDimensions = this.dropdownRef.getBoundingClientRect();
      const browserWindowHeight = window.document.documentElement.clientHeight - 10;
      const browserWindowWidth = window.document.documentElement.clientWidth;

      const dimensions = this.optionsRef.getBoundingClientRect();

      // Calculate X Position
      const optionWidth = this.optionsRef.querySelector('.picklist-option').clientWidth;
      const exceedsBrowserWindowWidth = browserWindowWidth < (containerDimensions.left + optionWidth);

      const optionsLeft = exceedsBrowserWindowWidth ?
        (containerDimensions.left - optionWidth) : containerDimensions.left;
      this.optionsRef.style.left = `${optionsLeft}px`;

      // Calculate Y Position
      const optionsTop = this.dropdownRef.clientHeight + containerDimensions.top - containerDimensions.height;
      this.optionsRef.style.top = `${optionsTop}px`;

      // Calculate Height
      const scrollHeight = this.optionsRef.scrollHeight;
      const exceedsBrowserWindowHeight = browserWindowHeight < dimensions.top + scrollHeight;
      const optionHeight = this.optionsRef.querySelector('.picklist-option').clientHeight;
      const determinedHeight = browserWindowHeight - dimensions.top;

      if (exceedsBrowserWindowHeight) {
        this.optionsRef.style.height = `${Math.max(determinedHeight, optionHeight)}px`;
      } else if (this.optionsRef.style.height !== 'auto') {
        this.optionsRef.style.height = 'auto';
      }

      if (!displayTrueWidthOptions) {
        this.optionsRef.style.width = `${containerDimensions.width}px`;
      }
    }
  }

  /**
   * When scrolling the options, we don't want the outer containers
   * to accidentally scroll once the start or end of the options is
   * reached.
   */
  toggleIsolateScrolling(onOrOff) {
    if (!this.optionsRef) { return; }

    SocrataUtils.isolateScrolling($(this.optionsRef), onOrOff);
  }

  toggleDocumentMouseDown(onOrOff) {
    document[onOrOff ? 'addEventListener' : 'removeEventListener']('mousedown', this.onMouseDown);
  }

  /**
   * Places scrolling event listeners on all ancestors that are scrollable.
   *
   * This is done to properly hide the dropdown when the user
   * scrolls an inner container.
   *
   * This functions as a toggle that will add or remove the event listeners
   * depending on a boolean value passed as the first parameter.
   */
  toggleScrollEvents(onOrOff) {
    if (!this.dropdownRef) { return; }

    const action = onOrOff ? 'addEventListener' : 'removeEventListener';
    const toggleEvents = (element) => {
      element[action]('scroll', this.onAnyScroll);
      element[action]('wheel', this.onAnyScroll);
    };

    const setEventsOnEveryParent = (node) => {
      let parent = node.parentNode;

      while (parent !== null && parent instanceof HTMLElement) {
        const overflowY = window.getComputedStyle(parent).overflowY;
        const isScrollable = overflowY === 'scroll' || overflowY === 'auto';
        const hasScrollableArea = parent.scrollHeight > parent.clientHeight;

        if (isScrollable && hasScrollableArea) {
          toggleEvents(parent);
        }

        parent = parent.parentNode;
      }
    };

    // Rummage through all the ancestors
    // and apply/remove the event handlers.
    setEventsOnEveryParent(this.dropdownRef);

    // Apply/remove scrolling events on the window as well.
    toggleEvents(window);
  }

  renderPlaceholder() {
    let { placeholder } = this.props;
    let icon = null;
    const { opened, selectedOption } = this.state;
    const caret = <SocrataIcon name="arrow-down" className="dropdown-caret" key="dropdown-caret" />;
    const placeholderText = text => <span className="placeholder" key="placeholder">{text}</span>;
    const placeholderIsFunction = typeof placeholder === 'function';
    const placeholderIsString = typeof placeholder === 'string';

    if (placeholderIsFunction) {
      placeholder = placeholder({ isOpened: opened });
    } else if (selectedOption) {
      placeholder = [placeholderText(selectedOption.title), caret];
      // TODO: Make this an explicit test for a SocrataIcon,
      // or make it wrap a string into a SocrataIcon.
      if (typeof selectedOption.icon === 'object') {
        icon = selectedOption.icon;
      }
    } else if (placeholderIsString) {
      placeholder = [placeholderText(placeholder), caret];
    } else if (placeholder === null) {
      // TODO: this needs I18n!
      placeholder = [placeholderText('Select...'), caret];
    }

    const attributes = {
      onFocus: this.onFocusPlaceholder,
      onBlur: this.onBlurPlaceholder,
      onClick: this.onClickPlaceholder,
      onKeyUp: this.onKeyUpPlaceholder,
      onKeyDown: this.onKeyDownPlaceholder,
      tabIndex: '0',
      ref: ref => this.placeholderRef = ref,
      className: classNames({
        'default': _.get(selectedOption, 'defaultOption'),
        'dropdown-placeholder': !placeholderIsFunction,
        'dropdown-selected': !!selectedOption,
        'dropdown-selected-with-icon': !!selectedOption && !!icon
      }),
      role: 'button'
    };

    return <div {...attributes}>{icon}{placeholder}</div>;
  }

  render() {
    const { disabled, id, labelledBy, options, size } = this.props;
    const { focused, opened, selectedOption } = this.state;
    const value = _.get(selectedOption, 'value', null);

    const dropdownAttributes = {
      id,
      ref: ref => this.dropdownRef = ref,
      className: classNames('dropdown-container', `dropdown-size-${size}`, {
        'dropdown-focused': focused,
        'dropdown-opened': opened,
        'dropdown-disabled': disabled
      }),
      'aria-labelledby': labelledBy
    };

    const dropdownOptionsAttributes = {
      ref: ref => this.optionsRef = ref,
      className: classNames('dropdown-options-list', {
        'dropdown-invisible': !opened
      })
    };

    const picklistAttributes = {
      options,
      disabled,
      value,
      ref: ref => this.picklistRef = ref,
      onSelection: this.onSelectOption,
      onFocus: this.onFocusPicklist,
      onBlur: this.onBlurPicklist,
      size
    };

    const placeholder = this.renderPlaceholder();

    return (
      <div {...dropdownAttributes}>
        {placeholder}
        <div {...dropdownOptionsAttributes}>
          <Picklist {...picklistAttributes} />
        </div>
      </div>
    );
  }
}

Dropdown.propTypes = {
  disabled: PropTypes.bool,
  displayTrueWidthOptions: PropTypes.bool,
  id: PropTypes.string,
  onSelection: PropTypes.func,
  options: PropTypes.arrayOf(PropTypes.object),
  placeholder: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func
  ]),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  // Since this dropdown is not a form input element (gotta love custom
  // components that reimplement browser functionality), we can't rely
  // on built-in accessibility affordances like <label for="some-id">.
  // Fortunately, the Aria spec allows for this using the aria-labelledby
  // attribute, which you can set using this prop.
  labelledBy: PropTypes.string
};

Dropdown.defaultProps = {
  disabled: false,
  onSelection: _.noop,
  options: [],
  placeholder: null,
  size: 'large'
};

export default Dropdown;
