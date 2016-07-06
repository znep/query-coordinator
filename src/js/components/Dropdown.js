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
    value: React.PropTypes.string,
    options: React.PropTypes.arrayOf(React.PropTypes.oneOfType([
      React.PropTypes.array,
      React.PropTypes.object
    ])),
    onSelection: React.PropTypes.func
  },

  getInitialState() {
    let selectedOption;
    let { value, options } = this.props;

    for (let option of options) {
      if (selectedOption) {
        break;
      }

      if (Array.isArray(option)) {
        selectedOption = option.find(item => item.value === value);
      } else if (option.value === value) {
        selectedOption = option;
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
      options: [],
      placeholder: null,
      onSelection: () => {}
    };
  },

  componentDidMount() {
    window.addEventListener('wheel', this.onWheel);
  },

  componentWillUnmount() {
    window.removeEventListener('wheel', this.onWheel);
  },

  onWheel() {
    if (this.options) {
      let dimensions = this.options.getBoundingClientRect();
      let browserWindowHeight = window.document.documentElement.clientHeight - 10;
      let exceedsBrowserWindowHeight = browserWindowHeight < dimensions.top + this.options.scrollHeight;
      let optionHeight = this.options.childNodes[0].clientHeight;
      let determinedHeight = browserWindowHeight - dimensions.top;

      if (exceedsBrowserWindowHeight) {
        this.options.style.height = `${Math.max(determinedHeight, optionHeight)}px`;
      } else if (this.options.style.height !== 'auto') {
        this.options.style.height = 'auto';
      }
    }
  },

  onClickPlaceholder() {
    this.setState({opened: !this.state.opened});
  },

  onFocusPlaceholder() {
    this.setState({focused: true});
  },

  onBlurPlaceholder() {
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
    let optionsLength = options.reduce((previous, next) => {
      return Array.isArray(next) ?
        previous + next.length :
        previous + 1;
    }, 0);

    let { highlightedOption } = this.state;
    let previousOption = highlightedOption === null ?  0 : Math.min(highlightedOption + 1, optionsLength - 1);

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
      let flattenedOptions = options.reduce((previous, next) => previous.concat(next), []);
      let selectedOption = flattenedOptions[highlightedOption];

      this.setState({
        opened: false,
        selectedOption,
        highlightedOption: null
      });

      this.props.onSelection(selectedOption);
    }
  },

  renderOptions() {
    let index = 0;
    let key = () => index++;
    let renderedOptions = [];

    let { opened } = this.state;
    let { options, displayTrueWidthOptions } = this.props;
    let separator = <div className="dropdown-options-separator"/>;
    let classes = classNames('dropdown-options-list', {
      'dropdown-options-true-width': displayTrueWidthOptions,
      'dropdown-invisible': !opened
    });

    options.forEach((groupOrOption, groupOrOptionIndex) => {
      if (Array.isArray(groupOrOption)) {
        renderedOptions.push(...[
          groupOrOptionIndex > 0 ? separator : null,
          ...groupOrOption.map(option => {
            return this.renderOption(option, key());
          }),
          groupOrOptionIndex < options.length ? separator : null
        ]);
      } else {
        renderedOptions.push(this.renderOption(groupOrOption, key()));
      }
    })

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
    let caret = <div className="dropdown-caret"></div>;
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
      placeholder = [<span>{selectedOption.title}</span>, caret];
    } else if (placeholderIsString) {
      placeholder = [<span>{placeholder}</span>, caret];
    } else if (placeholder === null) {
      placeholder = [<span>Select...</span>, caret];
    }

    return <div {...attributes}>{placeholder}</div>;
  },

  render() {
    let { focused, opened } = this.state;
    let reference = ref => this.container = ref;
    let classes = classNames('dropdown-container', {
      'dropdown-focused': focused,
      'dropdown-opened': opened
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
