// This component needs to be ported to ES6 classes, see EN-16506.
/* eslint-disable react/prefer-es6-class */
import _ from 'lodash';
import $ from 'jquery';
import classNames from 'classnames';
import React from 'react';
import SocrataUtils from 'common/js_utils';
import SocrataIcon from '../SocrataIcon';
import Picklist from '../Picklist';
import { ESCAPE, DOWN, SPACE, isolateEventByKeys, isOneOfKeys } from 'common/keycodes';

export default React.createClass({
  propTypes: {
    disabled: React.PropTypes.bool,
    displayTrueWidthOptions: React.PropTypes.bool,
    id: React.PropTypes.string,
    onSelection: React.PropTypes.func,
    options: React.PropTypes.arrayOf(React.PropTypes.object),
    placeholder: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.func
    ]),
    size: React.PropTypes.oneOf(['small', 'medium', 'large']),
    value: React.PropTypes.string
  },

  getDefaultProps() {
    return {
      disabled: false,
      onSelection: _.noop,
      options: [],
      placeholder: null,
      size: 'large'
    };
  },

  getInitialState() {
    return {
      selectedOption: this.getSelectedOption(this.props),
      focused: false,
      opened: false,
      mousedDownOnOptions: false,
      keyupOnOptions: false
    };
  },

  componentDidMount() {
    this.toggleScrollEvents(true);
    this.toggleIsolateScrolling(true);
    this.toggleDocumentMouseDown(true);
  },

  componentWillReceiveProps(nextProps) {
    this.setState({
      selectedOption: this.getSelectedOption(nextProps)
    });
  },

  componentWillUpdate() {
    this.positionPicklist();
  },

  componentDidUpdate() {
    if (this.state.opened) {
      this.picklistRef.picklist.focus();
    }
  },

  componentWillUnmount() {
    this.toggleScrollEvents(false);
    this.toggleIsolateScrolling(false);
    this.toggleDocumentMouseDown(false);
  },

  /**
   * Safari and IE blur when the scrollbar is clicked to initiate
   * a scrolling action. This event handler prevents any clicks within the
   * dropdown from kicking off a blur.
   */
  onMouseDown(event) {
    const mousedDownOnOptions = event.target === this.optionsRef;

    if (mousedDownOnOptions) {
      event.preventDefault();
    }

    this.setState({ mousedDownOnOptions });
  },

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
  },

  onClickPlaceholder() {
    this.onAnyScroll();
    this.setState({ opened: !this.state.opened });
  },

  onFocusPlaceholder() {
    this.setState({ focused: true });
  },

  /**
   * The state variable mousedDownOnOptions determines
   * whether or not the blur we received should be
   * responded to. Mousedown is set to off regardless of
   * how we respond to ready for the next blur.
   */
  onBlurPlaceholder() {
    if (!this.state.mousedDownOnOptions) {
      this.optionsRef.scrollTop = 0;
      this.setState({ focused: false });
    } else if (!this.state.opened) {
      this.placeholderRef.focus();
    }

    this.setState({ mousedDownOnOptions: false });
  },

  onKeyDownPlaceholder(event) {
    isolateEventByKeys(event, [DOWN, SPACE]);
  },

  onKeyUpPlaceholder(event) {
    isolateEventByKeys(event, [DOWN, SPACE]);

    if (isOneOfKeys(event, [ESCAPE])) {
      this.onBlurPlaceholder();
    } else if (isOneOfKeys(event, [DOWN, SPACE])) {
      this.openPicklist();
    }
  },

  onFocusPicklist() {
    this.setState({ focused: false });
  },

  onBlurPicklist() {
    this.setState({ focused: true, opened: false });
    this.placeholderRef.focus();
  },

  onClickOption(selectedOption) {
    this.props.onSelection(selectedOption);
    this.setState({ selectedOption, focused: true, opened: false });
  },

  getSelectedOption(props) {
    const { value, options } = props;
    return _.find(options, { value }) || null;
  },

  openPicklist() {
    const { options } = this.props;
    const selectedOption = this.state.selectedOption || _.first(options);

    this.setState({
      opened: true,
      selectedOption
    });
  },

  positionPicklist() {
    const hasOptions = this.optionsRef &&
      this.optionsRef.querySelectorAll('.picklist-option').length > 0;

    if (hasOptions) {
      const { displayTrueWidthOptions } = this.props;
      const containerDimensions = this.dropdownRef.getBoundingClientRect();
      const browserWindowHeight = window.document.documentElement.clientHeight - 10;

      // Calculate Position

      const optionsTop = this.dropdownRef.clientHeight + containerDimensions.top - containerDimensions.height;

      this.optionsRef.style.top = `${optionsTop}px`;
      this.optionsRef.style.left = `${containerDimensions.left}px`;

      // Calculate Height

      const dimensions = this.optionsRef.getBoundingClientRect();
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
  },

  toggleDocumentMouseDown(onOrOff) {
    document[onOrOff ? 'addEventListener' : 'removeEventListener']('mousedown', this.onMouseDown);
  },

  /**
   * When scrolling the options, we don't want the outer containers
   * to accidentally scroll once the start or end of the options is
   * reached.
   */
  toggleIsolateScrolling(onOrOff) {
    SocrataUtils.isolateScrolling($(this.optionsRef), onOrOff);
  },

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
  },

  renderPlaceholder() {
    let { placeholder } = this.props;
    let icon = null;
    const { opened, selectedOption } = this.state;
    const caret = <SocrataIcon name="arrow-down" className="dropdown-caret" key="dropdown-caret" />;
    const placeholderText = text => <span key="placeholder">{text}</span>;
    const placeholderIsFunction = typeof placeholder === 'function';
    const placeholderIsString = typeof placeholder === 'string';

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
        'dropdown-selected': !!selectedOption
      }),
      role: 'button'
    };

    if (placeholderIsFunction) {
      placeholder = placeholder({isOpened: opened});
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
      placeholder = [placeholderText('Select...'), caret];
    }

    return <div {...attributes}>{icon}{placeholder}</div>;
  },

  render() {
    const { disabled, id, options, size } = this.props;
    const { focused, opened, selectedOption } = this.state;
    const value = _.get(selectedOption, 'value', null);

    const dropdownAttributes = {
      id,
      ref: ref => this.dropdownRef = ref,
      className: classNames('dropdown-container', `dropdown-size-${size}`, {
        'dropdown-focused': focused,
        'dropdown-opened': opened,
        'dropdown-disabled': disabled
      })
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
      onSelection: this.onClickOption,
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
});
