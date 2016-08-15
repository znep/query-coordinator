import classNames from 'classnames';
import React from 'react';

const KEYS = {
  UP: 38,
  DOWN: 40,
  ENTER: 13,
  TAB: 9,
  ESCAPE: 27
};

export default React.createClass({
  propTypes: {
    disabled: React.PropTypes.bool,
    value: React.PropTypes.string,
    options: React.PropTypes.arrayOf(React.PropTypes.object),
    onSelection: React.PropTypes.func,
    placeholder: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.func]),
    displayTrueWidthOptions: React.PropTypes.bool
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
    let selectedOption;
    const { value, options } = this.props;

    for (let i = 0; i < options.length; i++) {
      const option = options[i];

      if (option.value === value) {
        selectedOption = option;
        break;
      }
    }

    return {
      highlightedOption: null,
      selectedOption: selectedOption || null,
      focused: false,
      opened: false
    };
  },

  componentDidMount() {
    window.addEventListener('scroll', this.onWheel);
    window.addEventListener('wheel', this.onWheel);
    window.addEventListener('resize', this.onWheel);
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
      opened: false,
      highlightedOption: null
    });
  },

  onKeyUpPlaceholder(event) {
    const { UP, DOWN, ENTER, ESCAPE } = KEYS;

    switch (event.keyCode) {
      case UP:
        this.moveToPreviousOption();
        break;

      case DOWN:
        this.moveToNextOption();
        break;

      case ENTER:
        this.selectOption();
        break;

      case ESCAPE:
        this.onBlurPlaceholder();
        break;

      default:
        break;
    }

    event.preventDefault();
  },

  onKeyDownPlaceholder(event) {
    const { UP, DOWN, ENTER } = KEYS;

    if ([UP, DOWN, ENTER].indexOf(event.keyCode) > -1) {
      event.preventDefault();
    }
  },

  onMouseOverOptions() {
    this.setState({ highlightedOption: null });
  },

  onClickOption(selectedOption, event) {
    event.stopPropagation();

    this.props.onSelection(selectedOption);
    this.setState({ selectedOption, opened: false });
  },

  onMouseDownOption(event) {
    event.preventDefault();
  },

  moveToNextOption() {
    const { options } = this.props;
    const { highlightedOption } = this.state;
    const hasHighlightedOption = highlightedOption === null;
    const previousOption = hasHighlightedOption ?
      0 :
      Math.min(highlightedOption + 1, options.length - 1);

    this.setState({ opened: true, highlightedOption: previousOption });
  },

  moveToPreviousOption() {
    const { highlightedOption } = this.state;
    const hasHighlightedOption = highlightedOption === null;
    const nextOption = hasHighlightedOption ? 0 : Math.max(highlightedOption - 1, 0);

    this.setState({ opened: true, highlightedOption: nextOption });
  },

  selectOption() {
    const { opened, highlightedOption } = this.state;

    if (opened && highlightedOption !== null) {
      const { options } = this.props;
      const selectedOption = options[highlightedOption];

      this.setState({
        opened: false,
        selectedOption,
        highlightedOption: null
      });

      this.props.onSelection(selectedOption);
    }
  },

  renderOptions() {
    const renderedOptions = [];

    const { opened } = this.state;
    const { options, displayTrueWidthOptions } = this.props;

    const classes = classNames('dropdown-options-list', {
      'dropdown-options-true-width': displayTrueWidthOptions,
      'dropdown-invisible': !opened
    });

    const attributes = {
      className: classes,
      onMouseOver: this.onMouseOverOptions,
      ref: ref => this.options = ref
    };

    const header = (groupName, key) => (
      <div className="dropdown-options-group-header" key={key}>{groupName}</div>
    );

    const separator = (key) => (
      <div className="dropdown-options-separator" key={key} />
    );

    options.forEach((option, index) => {
      const previousOption = options[index - 1];
      const differentGroup = previousOption && previousOption.group !== option.group;

      if (differentGroup) {
        renderedOptions.push(separator(`${option.group}-separator`));
        renderedOptions.push(header(option.group, `${option.group}-header`));
      } else if (index === 0 && option.group) {
        renderedOptions.push(header(option.group, `${option.group}-header`));
      }

      renderedOptions.push(this.renderOption(option, index));
    });

    return (
      <div {...attributes}>
        {renderedOptions}
      </div>
    );
  },

  renderOption(option, index) {
    const { selectedOption, highlightedOption } = this.state;
    const hasRenderFunction = typeof option.render === 'function';
    const onClickOptionBound = this.onClickOption.bind(this, option);
    const classes = classNames('dropdown-option', {
      'dropdown-option-selected': selectedOption === option,
      'dropdown-option-highlighted': highlightedOption === index
    });

    const attributes = {
      className: classes,
      onClick: onClickOptionBound,
      onMouseDown: this.onMouseDownOption,
      key: index
    };

    const content = hasRenderFunction ?
      option.render(option) :
      <span className="dropdown-option-title" key={index}>{option.title}</span>;

    return (
      <div {...attributes}>
        {content}
      </div>
    );
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
    const { disabled } = this.props;
    const { focused, opened } = this.state;
    const reference = ref => this.container = ref;
    const classes = classNames('dropdown-container', {
      'dropdown-focused': focused,
      'dropdown-opened': opened,
      'dropdown-disabled': disabled
    });

    const options = this.renderOptions();
    const placeholder = this.renderPlaceholder();

    return (
      <div className={classes} ref={reference} {...this.props}>
        {placeholder}
        {options}
      </div>
    );
  }
});
