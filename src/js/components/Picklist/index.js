import _ from 'lodash';
import React from 'react';
import classNames from 'classnames';

import {
  UP,
  DOWN,
  ENTER,
  ESCAPE
} from '../../common/keycodes';

export const Picklist = React.createClass({
  propTypes: {
    // Disables option selection
    disabled: React.PropTypes.bool,
    // Sets the initial value when provided
    value: React.PropTypes.string,
    options: React.PropTypes.arrayOf(
      React.PropTypes.shape({
        // Used to render the option title
        title: React.PropTypes.string,
        // Used for value comparisons during selection.
        value: React.PropTypes.string.isRequired,
        // Used to visually group similar options.
        // This value is UI text and should be human-friendly.
        group: React.PropTypes.string,
        // Receives the relevant option and
        // must return a DOM-renderable value.
        render: React.PropTypes.func
      })
    ),
    // Calls a function after user selection.
    onSelection: React.PropTypes.func
  },

  getDefaultProps() {
    return {
      disabled: false,
      options: [],
      onSelection: _.noop,
      value: null
    };
  },

  getInitialState() {
    return {
      selectedOption: null,
      highlightedOption: null,
      focused: false
    };
  },

  componentWillMount() {
    this.setSelectedOptionBasedOnValue(this.props);
  },

  componentDidMount() {
    this.setScrollPositionToSelectedOption();
  },

  componentWillReceiveProps(nextProps) {
    this.setSelectedOptionBasedOnValue(nextProps);
  },

  componentDidUpdate(prevProps, prevState) {
    const { selectedOption, highlightedOption } = this.state;
    const changedHighlightedOption = prevState.highlightedOption !== highlightedOption;
    const unchangedSelectedOption = prevState.selectedOption === selectedOption;

    if (changedHighlightedOption && unchangedSelectedOption) {
      this.setScrollPositionToHighlightedOption();
    }
  },

  onClickOption(selectedOption, event) {
    event.stopPropagation();

    this.picklist.focus();
    this.setSelectedOption(selectedOption);
  },

  onKeyUpSelection(event) {
    const { disabled } = this.props;
    const option = this.props.options[this.state.highlightedOption];

    if (disabled) {
      return;
    }

    event.preventDefault();

    switch (event.keyCode) {
      case UP:
        this.moveToPreviousOption();
        break;
      case DOWN:
        this.moveToNextOption();
        break;
      case ENTER:
        this.setSelectedOption(option);
        break;
      default:
        break;
    }
  },

  onKeyUpBlur(event) {
    if (event.keyCode === ESCAPE) {
      event.preventDefault();
      this.picklist.blur();
    }
  },

  onKeyUp(event) {
    this.onKeyUpSelection(event);
    this.onKeyUpBlur(event);
  },

  onKeyDown(event) {
    const keys = [UP, DOWN, ENTER, ESCAPE];

    if (_.includes(keys, event.keyCode)) {
      event.preventDefault();
    }
  },

  onMouseDownOption(event) {
    event.preventDefault();
  },

  onFocus() {
    const { selectedOption } = this.state;

    if (selectedOption) {
      this.setSelectedOption(selectedOption);
    }

    this.setState({ focused: true });
  },

  onBlur() {
    this.clearHighlightedOption();
    this.setState({ focused: false });
  },

  setSelectedOptionBasedOnValue(props) {
    const { options, value } = props;
    const selectedOption = _.find(options, { value });

    this.setState({ selectedOption });
  },

  setSelectedOption(selectedOption) {
    const { options, onSelection } = this.props;
    const index = _.findIndex(options, selectedOption);

    this.setState({ selectedOption, highlightedOption: index });
    onSelection(selectedOption);
  },

  setScrollPosition(stateKey, selector) {
    const option = this.state[stateKey];
    const picklist = this.picklist;

    if (_.isObject(option) || _.isNumber(option)) {
      const picklistTop = picklist.getBoundingClientRect().top - picklist.scrollTop;
      const picklistCenter = picklist.clientHeight / 2;
      const picklistOption = picklist.querySelector(selector);
      const picklistOptionTop = picklistOption.getBoundingClientRect().top;

      this.picklist.scrollTop = (picklistOptionTop - picklistTop) - picklistCenter;
    }
  },

  setScrollPositionToSelectedOption() {
    this.setScrollPosition('selectedOption', '.picklist-option-selected');
  },

  setScrollPositionToHighlightedOption() {
    this.setScrollPosition('highlightedOption', '.picklist-option-highlighted');
  },

  clearHighlightedOption() {
    this.setState({ highlightedOption: null });
  },

  blur() {
    this.picklist.blur();
  },

  moveToPreviousOption() {
    const { highlightedOption } = this.state;
    const hasHighlightedOption = _.isNumber(highlightedOption);
    const previousOption = hasHighlightedOption ? Math.max(highlightedOption - 1, 0) : 0;

    this.setState({ highlightedOption: previousOption });
  },

  moveToNextOption() {
    const { options } = this.props;
    const { highlightedOption } = this.state;
    const hasHighlightedOption = _.isNumber(highlightedOption);
    const nextOption = hasHighlightedOption ?
      Math.min(highlightedOption + 1, options.length - 1) : 0;

    this.setState({ highlightedOption: nextOption });
  },

  renderOption(option, index) {
    const hasRenderFunction = _.isFunction(option.render);
    const onClickOptionBound = this.onClickOption.bind(this, option);
    const classes = classNames('picklist-option', {
      'picklist-option-selected': this.state.selectedOption === option,
      'picklist-option-highlighted': this.state.highlightedOption === index
    });

    const attributes = {
      className: classes,
      onClick: onClickOptionBound,
      onMouseDown: this.onMouseDownOption,
      key: index
    };

    const content = hasRenderFunction ?
      option.render(option) :
      <span className="picklist-title" key={index}>{option.title}</span>;

    return (
      <div {...attributes}>
        {content}
      </div>
    );
  },

  render() {
    const renderedOptions = [];
    const { disabled, options } = this.props;
    const { focused } = this.state;
    const attributes = {
      tabIndex: 0,
      ref: ref => this.picklist = ref,
      className: classNames('picklist', {
        'picklist-disabled': disabled,
        'picklist-focused': focused
      }),
      onKeyUp: this.onKeyUp
    };

    if (!disabled) {
      _.merge(attributes, {
        onKeyDown: this.onKeyDown,
        onFocus: this.onFocus,
        onBlur: this.onBlur
      });
    }

    const header = (group) => (
      <div className="picklist-group-header" key={`${group}-separator`}>{group}</div>
    );

    const separator = (group) => (
      <div className="picklist-separator" key={`${group}-header`} />
    );

    _.forEach(options, (option, index) => {
      const { group } = option;
      const previousOption = options[index - 1];
      const differentGroup = previousOption && previousOption.group !== group;

      if (differentGroup) {
        renderedOptions.push(separator(group));
        renderedOptions.push(header(group));
      } else if (index === 0 && group) {
        renderedOptions.push(header(group));
      }

      renderedOptions.push(this.renderOption(option, index));
    });

    return (
      <div {...attributes}>
        {renderedOptions}
      </div>
    );
  }
});

export default Picklist;
