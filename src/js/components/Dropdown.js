import classNames from 'classnames';
import React from 'react';

const KEYS = {
  UP: 38,
  DOWN: 40,
  ENTER: 13,
  TAB: 9,
  ESCAPE: 27
};

export const Dropdown = React.createClass({
  propTypes: {
    disabled: React.PropTypes.bool,
    value: React.PropTypes.string,
    options: React.PropTypes.arrayOf(React.PropTypes.object),
    onSelection: React.PropTypes.func,
    placeholder: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.func]),
    displayTrueWidthOptions: React.PropTypes.bool
  },

  getInitialState() {
    let selectedOption;
    let { value, options } = this.props;

    for (let option of options) {
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

  getDefaultProps() {
    return {
      disabled: false,
      options: [],
      placeholder: null,
      onSelection: () => {}
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
    if (this.options) {
      let { displayTrueWidthOptions } = this.props;
      let containerDimensions = this.container.getBoundingClientRect();
      let browserWindowHeight = window.document.documentElement.clientHeight - 10;

      // Calculate Position

      this.options.style.top = `${this.container.clientHeight + containerDimensions.top - 1}px`;
      this.options.style.left = `${containerDimensions.left}px`;

      // Calculate Height

      let dimensions = this.options.getBoundingClientRect();
      let exceedsBrowserWindowHeight = browserWindowHeight < dimensions.top + this.options.scrollHeight;
      let optionHeight = this.options.childNodes[0].clientHeight;
      let determinedHeight = browserWindowHeight - dimensions.top;

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
    this.setState({opened: !this.state.opened});
  },

  onFocusPlaceholder() {
    this.setState({focused: true});
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
    let { UP, DOWN, ENTER, ESCAPE } = KEYS;

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
    }

    event.preventDefault();
  },

  onKeyDownPlaceholder(event) {
    let { UP, DOWN, ENTER } = KEYS;

    if ([UP, DOWN, ENTER].includes(event.keyCode)) {
      event.preventDefault();
    }
  },

  onMouseOverOptions() {
    this.setState({highlightedOption: null});
  },

  onClickOption(selectedOption, event) {
    event.stopPropagation();

    this.props.onSelection(selectedOption);
    this.setState({selectedOption, opened: false});
  },

  onMouseDownOption(event) {
    event.preventDefault();
  },

  moveToNextOption() {
    let { options } = this.props;
    let { highlightedOption } = this.state;
    let previousOption = highlightedOption === null ?  0 : Math.min(highlightedOption + 1, options.length - 1);

    this.setState({ opened: true, highlightedOption: previousOption });
  },

  moveToPreviousOption() {
    let { highlightedOption } = this.state;
    let nextOption = highlightedOption === null ?  0 : Math.max(highlightedOption - 1, 0);

    this.setState({ opened: true, highlightedOption: nextOption });
  },

  selectOption() {
    let { opened, highlightedOption } = this.state;

    if (opened && highlightedOption !== null) {
      let { options } = this.props;
      let selectedOption = options[highlightedOption];

      this.setState({
        opened: false,
        selectedOption,
        highlightedOption: null
      });

      this.props.onSelection(selectedOption);
    }
  },

  renderOptions() {
    let renderedOptions = [];

    let { opened } = this.state;
    let { options, displayTrueWidthOptions } = this.props;

    let header = (groupName, key) => <div className="dropdown-options-group-header" key={key}>{groupName}</div>;
    let separator = (key) => <div className="dropdown-options-separator" key={key} />;

    let classes = classNames('dropdown-options-list', {
      'dropdown-options-true-width': displayTrueWidthOptions,
      'dropdown-invisible': !opened
    });

    options.forEach((option, index) => {
      let previousOption = options[index - 1];
      let differentGroup = previousOption && previousOption.group !== option.group;

      if (differentGroup) {
        renderedOptions.push(separator(`${option.group}-separator`));
        renderedOptions.push(header(option.group, `${option.group}-header`));
      } else if (index === 0 && option.group) {
        renderedOptions.push(header(option.group, `${option.group}-header`));
      }

      renderedOptions.push(this.renderOption(option, index));
    });

    return (
      <div className={classes} onMouseOver={this.onMouseOverOptions} ref={ref => this.options = ref}>
        {renderedOptions}
      </div>
    );
  },

  renderOption(option, index) {
    let { selectedOption, highlightedOption } = this.state;
    let hasRenderFunction = typeof option.render === 'function';
    let onClickOptionBound = this.onClickOption.bind(this, option);
    let classes = classNames('dropdown-option', {
      'dropdown-option-selected': selectedOption === option,
      'dropdown-option-highlighted': highlightedOption === index
    });

    let content = hasRenderFunction ?
      option.render(option) :
      <span className="dropdown-option-title" key={index}>{option.title}</span>;

    return (
      <div className={classes} onClick={onClickOptionBound} onMouseDown={this.onMouseDownOption} key={index}>
        {content}
      </div>
    );
  },

  renderPlaceholder() {
    let { placeholder } = this.props;
    let { selectedOption } = this.state;
    let caret = <div className="dropdown-caret" key="caret"></div>;
    let placeholderText = text => <span key="placeholder">{text}</span>;
    let placeholderIsFunction = typeof placeholder === 'function';
    let placeholderIsString = typeof placeholder === 'string';
    let classes = classNames({
      'dropdown-placeholder': !placeholderIsFunction,
      'dropdown-selected': !!selectedOption
    });
    let attributes = {
      className: classes,
      onFocus: this.onFocusPlaceholder,
      onBlur: this.onBlurPlaceholder,
      onClick: this.onClickPlaceholder,
      onKeyUp: this.onKeyUpPlaceholder,
      onKeyDown: this.onKeyDownPlaceholder,
      tabIndex: "0",
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
    let { disabled } = this.props;
    let { focused, opened } = this.state;
    let reference = ref => this.container = ref;
    let classes = classNames('dropdown-container', {
      'dropdown-focused': focused,
      'dropdown-opened': opened,
      'dropdown-disabled': disabled
    });

    let options = this.renderOptions();
    let placeholder = this.renderPlaceholder();

    return (
      <div className={classes} ref={reference}>
        {placeholder}
        {options}
      </div>
    );
  }
});
