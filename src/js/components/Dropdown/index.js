import _ from 'lodash';
import classNames from 'classnames';
import React from 'react';
import Picklist from '../Picklist';

const KEYS = {
  ESCAPE: 27
};

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
    value: React.PropTypes.string
  },

  getDefaultProps() {
    return {
      disabled: false,
      options: [],
      placeholder: null,
      onSelection: () => {}
    };
  },

  getInitialState() {
    return {
      selectedOption: this.getSelectedOption(this.props),
      focused: false,
      opened: false
    };
  },

  componentDidMount() {
    window.addEventListener('scroll', this.onWheel);
    window.addEventListener('wheel', this.onWheel);
    window.addEventListener('resize', this.onWheel);
  },

  componentWillReceiveProps(nextProps) {
    this.setState({
      selectedOption: this.getSelectedOption(nextProps)
    });
  },

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onWheel);
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('resize', this.onWheel);
  },

  onWheel() {
    if (this.options && this.options.childNodes.length) {
      const { displayTrueWidthOptions } = this.props;
      const containerDimensions = this.container.getBoundingClientRect();
      const browserWindowHeight = window.document.documentElement.clientHeight - 10;

      // Calculate Position

      this.options.style.top = `${this.container.clientHeight + containerDimensions.top - 1}px`;
      this.options.style.left = `${containerDimensions.left}px`;

      // Calculate Height

      const dimensions = this.options.getBoundingClientRect();
      const scrollHeight = this.options.scrollHeight;
      const exceedsBrowserWindowHeight = browserWindowHeight < dimensions.top + scrollHeight;
      const optionHeight = this.options.childNodes[0].clientHeight;
      const determinedHeight = browserWindowHeight - dimensions.top;

      if (exceedsBrowserWindowHeight) {
        this.options.style.height = `${Math.max(determinedHeight, optionHeight)}px`;
      } else if (this.options.style.height !== 'auto') {
        this.options.style.height = 'auto';
      }

      if (!displayTrueWidthOptions) {
        this.options.style.width = `${containerDimensions.width}px`;
      }
    }
  },

  onClickPlaceholder() {
    this.onWheel();
    this.setState({ opened: !this.state.opened });
  },

  onFocusPlaceholder() {
    this.setState({ focused: true });
  },

  onBlurPlaceholder() {
    this.options.scrollTop = 0;
    this.setState({
      focused: false,
      opened: false
    });
  },

  onKeyUpPlaceholder(event) {
    const { ESCAPE } = KEYS;

    if (event.keyCode === ESCAPE) {
      this.onBlurPlaceholder();
    }

    event.preventDefault();
  },

  onClickOption(selectedOption) {
    this.props.onSelection(selectedOption);
    this.setState({ selectedOption, opened: false });
  },

  getSelectedOption(props) {
    const { value, options } = props;
    return _.find(options, { value }) || null;
  },

  renderPlaceholder() {
    let { placeholder } = this.props;
    const { selectedOption } = this.state;
    const caret = <div className="dropdown-caret" key="caret"></div>;
    const placeholderText = text => <span key="placeholder">{text}</span>;
    const placeholderIsFunction = typeof placeholder === 'function';
    const placeholderIsString = typeof placeholder === 'string';
    const classes = classNames({
      'dropdown-placeholder': !placeholderIsFunction,
      'dropdown-selected': !!selectedOption
    });
    const attributes = {
      className: classes,
      onFocus: this.onFocusPlaceholder,
      onBlur: this.onBlurPlaceholder,
      onClick: this.onClickPlaceholder,
      onKeyUp: this.onKeyUpPlaceholder,
      onKeyDown: this.onKeyDownPlaceholder,
      tabIndex: '0',
      ref: ref => this.placeholder = ref
    };

    if (placeholderIsFunction) {
      placeholder = placeholder();
    } else if (selectedOption) {
      placeholder = [placeholderText(selectedOption.title), caret];
    } else if (placeholderIsString) {
      placeholder = [placeholderText(placeholder), caret];
    } else if (placeholder === null) {
      placeholder = [placeholderText('Select...'), caret];
    }

    return <div {...attributes}>{placeholder}</div>;
  },

  render() {
    const { disabled, options, id } = this.props;
    const { focused, opened, selectedOption } = this.state;

    const dropdownAttributes = {
      id,
      ref: ref => this.container = ref,
      className: classNames('dropdown-container', {
        'dropdown-focused': focused,
        'dropdown-opened': opened,
        'dropdown-disabled': disabled
      })
    };

    const dropdownOptionsAttributes = {
      ref: ref => this.options = ref,
      className: classNames('dropdown-options-list', {
        'dropdown-invisible': !opened
      })
    };

    const picklistAttributes = {
      options,
      disabled,
      value: _.get(selectedOption, 'value', null),
      onSelection: this.onClickOption
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
