import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';
import { UP, DOWN, ESCAPE, ENTER, SPACE, isolateEventByKeys } from 'common/keycodes';

export class Picklist extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedIndex: -1,
      selectedOption: null,
      focused: false
    };

    _.bindAll(this, [
      'onClickOption',
      'onKeyUpSelection',
      'onKeyUpBlur',
      'onKeyUp',
      'onKeyDown',
      'onMouseDownOption',
      'onFocus',
      'onBlur',
      'setNavigationPointer',
      'setSelectedOptionBasedOnValue',
      'setSelectedOption',
      'setChangedOption',
      'setScrollPositionToOption',
      'blur',
      'move',
      'renderOption'
    ]);
  }

  componentWillMount() {
    this.setSelectedOptionBasedOnValue(this.props);
  }

  componentDidMount() {
    if (this.state.selectedOption) {
      const options = this.picklist.querySelectorAll('.picklist-option');
      const option = this.picklist.querySelector('.picklist-option-selected');
      const index = _.indexOf(options, option);

      this.setScrollPositionToOption(index);
      this.setNavigationPointer(index);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.setSelectedOptionBasedOnValue(nextProps);
    }
  }

  onClickOption(selectedOption, event) {
    const optionElements = this.picklist.querySelectorAll('.picklist-option');
    const index = _.indexOf(optionElements, event.target);

    event.stopPropagation();

    // If a consumer wants to focus something immediately after a selection
    // occurs, we shouldn't hijack its focus. To let the consumer have a
    // moment to focus whatever it wants, we delay the default focus a
    // handful of milliseconds. Do note, this will steal focus if
    // the picklist is left viewable on the page after a click.
    _.delay(() => {
      if (this.picklist) {
        this.picklist.focus();
      }
    }, 1);

    this.setNavigationPointer(index);
    this.setSelectedOption(selectedOption);
  }

  onKeyUpSelection(event) {
    const { disabled, onSelection } = this.props;

    if (disabled) {
      return;
    }

    switch (event.keyCode) {
      case UP:
        this.move('up');
        break;
      case DOWN:
        this.move('down');
        break;
      case ENTER:
      case SPACE:
        if (!_.isUndefined(this.state.selectedOption)) {
          onSelection(this.state.selectedOption);
        }
        break;
      default:
        break;
    }
  }

  onKeyUpBlur(event) {
    if (event.keyCode === ESCAPE) {
      this.picklist.blur();
    }
  }

  onKeyUp(event) {
    isolateEventByKeys(event, [UP, DOWN, ENTER, SPACE]);

    this.onKeyUpSelection(event);
    this.onKeyUpBlur(event);
  }

  onKeyDown(event) {
    isolateEventByKeys(event, [UP, DOWN, ENTER, SPACE]);
  }

  onMouseDownOption(event) {
    event.preventDefault();
  }

  onFocus() {
    this.props.onFocus();
    this.setState({ focused: true });
  }

  onBlur() {
    this.props.onBlur();
    this.setState({ focused: false });
  }

  setNavigationPointer(selectedIndex) {
    this.setState({ selectedIndex });
  }

  setSelectedOptionBasedOnValue(props) {
    const { options, value } = props;
    const selectedOptionIndex = _.findIndex(options, { value });

    this.setState({
      selectedOption: props.options[selectedOptionIndex],
      selectedIndex: selectedOptionIndex
    });
  }

  setSelectedOption(selectedOption) {
    this.setState({ selectedOption });
    this.props.onSelection(selectedOption);
  }

  setChangedOption(selectedOption) {
    this.setState({ selectedOption });
    this.props.onChange(selectedOption);
  }

  setScrollPositionToOption(picklistOptionIndex) {
    const picklist = this.picklist;
    const picklistOptions = this.picklist.querySelectorAll('.picklist-option');
    const picklistOption = picklistOptions[picklistOptionIndex];
    const picklistTop = picklist.getBoundingClientRect().top - picklist.scrollTop;
    const picklistCenter = picklist.clientHeight / 2;
    const picklistOptionTop = picklistOption.getBoundingClientRect().top;

    this.picklist.scrollTop = (picklistOptionTop - picklistTop) - picklistCenter;
  }

  blur() {
    this.picklist.blur();
  };

  move(upOrDown) {
    let newIndex;
    let newSelectedOption;

    const { selectedOption, selectedIndex } = this.state;
    const { options } = this.props;

    const movingUp = upOrDown === 'up';

    const indexOffset = movingUp ? -1 : 1;
    const candidateOption = options[selectedIndex + indexOffset];
    const unselectedStartPosition = movingUp ? 'last' : 'first';

    if (selectedIndex !== -1 && _.isPlainObject(candidateOption)) {
      newIndex = selectedIndex + indexOffset;
      newSelectedOption = candidateOption;
    } else if (selectedIndex === -1) {
      newIndex = 0;
      newSelectedOption = _[unselectedStartPosition](options);
    } else {
      newIndex = selectedIndex;
      newSelectedOption = selectedOption;
    }

    this.setNavigationPointer(newIndex);
    this.setChangedOption(newSelectedOption);
    this.setScrollPositionToOption(newIndex);
  }

  renderOption(option, index) {
    const { selectedOption } = this.state;
    const hasRenderFunction = _.isFunction(option.render);
    const onClickOptionBound = this.onClickOption.bind(this, option);
    const isSelected = _.isEqual(selectedOption, option);
    const optionClasses = classNames('picklist-option', {
      'picklist-option-selected': isSelected
    });

    const attributes = {
      className: optionClasses,
      onClick: onClickOptionBound,
      onMouseDown: this.onMouseDownOption,
      key: index,
      role: 'option',
      id: `${option.value}-${index}`,
      'aria-selected': isSelected
    };

    const pickListTitleClasses = classNames('picklist-title', { 'picklist-with-icon' : !!option.icon })
    const content = hasRenderFunction ?
      option.render(option) :
      <span className={pickListTitleClasses} key={index}>
        {option.icon}
        <span className="picklist-item">{option.title}</span>
      </span>;

    return (
      <div {...attributes}>
        {content}
      </div>
    );
  }

  render() {
    const renderedOptions = [];
    const { disabled, id, options, size } = this.props;
    const { focused, selectedOption, selectedIndex } = this.state;
    const activeDescendant = selectedOption ? `${selectedOption.value}-${selectedIndex}` : '';
    const attributes = {
      id,
      tabIndex: 0,
      ref: ref => this.picklist = ref,
      className: classNames('picklist', `picklist-size-${size}`, {
        'picklist-disabled': disabled,
        'picklist-focused': focused
      }),
      onKeyUp: this.onKeyUp,
      role: 'listbox',
      'aria-activedescendant': activeDescendant,
      'aria-disabled': disabled
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
}

Picklist.propTypes = {
  // A top-level HTML id attribute for easier selection.
  id: PropTypes.string,
  // Disables option selection.
  disabled: PropTypes.bool,
  // Sets the initial value when provided.
  value: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      // Used to render the option title.
      title: PropTypes.string,
      // Used for value comparisons during selection.
      value: PropTypes.string,
      // Used to visually group similar options.
      // This value is UI text and should be human-friendly.
      group: PropTypes.string,
      // Receives the relevant option and
      // must return a DOM-renderable value.
      render: PropTypes.func
    })
  ),
  // Calls a function after user selection.
  onSelection: PropTypes.func,
  // Calls a function after user navigation.
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  size: PropTypes.oneOf(['small', 'medium', 'large'])
};

Picklist.defaultProps = {
  disabled: false,
  options: [],
  onSelection: _.noop,
  onChange: _.noop,
  onFocus: _.noop,
  onBlur: _.noop,
  size: 'large',
  value: null
};

export default Picklist;
