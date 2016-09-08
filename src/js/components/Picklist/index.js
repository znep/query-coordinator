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
    // A top-level HTML id attribute for easier selection.
    id: React.PropTypes.string,
    // Disables option selection.
    disabled: React.PropTypes.bool,
    // Sets the initial value when provided.
    value: React.PropTypes.string,
    options: React.PropTypes.arrayOf(
      React.PropTypes.shape({
        // Used to render the option title.
        title: React.PropTypes.string,
        // Used for value comparisons during selection.
        value: React.PropTypes.string,
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
      focused: false
    };
  },

  componentWillMount() {
    this.setSelectedOptionBasedOnValue(this.props);
  },

  componentDidMount() {
    if (this.state.selectedOption) {
      const option = this.picklist.querySelector('.picklist-option-selected');
      this.setScrollPositionToOption(option);
    }
  },

  componentWillReceiveProps(nextProps) {
    this.setSelectedOptionBasedOnValue(nextProps);
  },

  onClickOption(selectedOption, event) {
    event.stopPropagation();

    this.picklist.focus();
    this.setSelectedOption(selectedOption);
  },

  onKeyUpSelection(event) {
    const { disabled } = this.props;

    if (disabled) {
      return;
    }

    event.preventDefault();

    switch (event.keyCode) {
      case UP:
        this.move('up');
        break;
      case DOWN:
        this.move('down');
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
    event.stopPropagation();

    this.onKeyUpSelection(event);
    this.onKeyUpBlur(event);
  },

  onKeyDown(event) {
    const keys = [UP, DOWN, ENTER, ESCAPE];

    if (_.includes(keys, event.keyCode)) {
      event.stopPropagation();
      event.preventDefault();
    }
  },

  onMouseDownOption(event) {
    event.preventDefault();
  },

  onFocus() {
    this.setState({ focused: true });
  },

  onBlur() {
    this.setState({ focused: false });
  },

  setSelectedOptionBasedOnValue(props) {
    const { options, value } = props;
    const selectedOption = _.find(options, { value });

    this.setState({ selectedOption });
  },

  setSelectedOption(selectedOption) {
    this.setState({ selectedOption });
    this.props.onSelection(selectedOption);
  },

  setScrollPositionToOption(picklistOption) {
    const picklist = this.picklist;
    const picklistTop = picklist.getBoundingClientRect().top - picklist.scrollTop;
    const picklistCenter = picklist.clientHeight / 2;
    const picklistOptionTop = picklistOption.getBoundingClientRect().top;

    this.picklist.scrollTop = (picklistOptionTop - picklistTop) - picklistCenter;
  },

  blur() {
    this.picklist.blur();
  },

  move(upOrDown) {
    let optionElement;
    let newSelectedOption;

    const { selectedOption } = this.state;
    const { options } = this.props;
    const index = _.indexOf(options, selectedOption);

    const movingUp = upOrDown === 'up';

    const indexOffset = movingUp ? -1 : 1;
    const candidateOption = options[index + indexOffset];
    const sibling = movingUp ? 'previousSibling' : 'nextSibling';
    const unselectedStartPosition = movingUp ? 'last' : 'first';
    const picklistOptions = this.picklist.querySelectorAll('.picklist-option');

    if (index !== -1 && _.isPlainObject(candidateOption)) {
      optionElement = this.picklist.querySelector('.picklist-option-selected')[sibling];
      newSelectedOption = candidateOption;
    } else if (index === -1) {
      optionElement = _[unselectedStartPosition](picklistOptions);
      newSelectedOption = _[unselectedStartPosition](options);
    } else {
      optionElement = this.picklist.querySelector('.picklist-option-selected');
      newSelectedOption = selectedOption;
    }

    this.setSelectedOption(newSelectedOption);
    this.setScrollPositionToOption(optionElement);
  },

  renderOption(option, index) {
    const hasRenderFunction = _.isFunction(option.render);
    const onClickOptionBound = this.onClickOption.bind(this, option);
    const classes = classNames('picklist-option', {
      'picklist-option-selected': this.state.selectedOption === option
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
    const { disabled, options, id } = this.props;
    const { focused } = this.state;
    const attributes = {
      id,
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
