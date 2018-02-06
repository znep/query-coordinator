import PropTypes from 'prop-types';
import React, { Children, PureComponent } from 'react';
import { SocrataIcon } from 'common/components/SocrataIcon';
import Button from 'common/components/Button';
import cx from 'classnames';

export class DropdownItem extends PureComponent {
  static propTypes = {
    children: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired
  };

  render() {
    const { children, onClick } = this.props;

    return (
      <li className="dropdown-button-item">
        <button type="button" className="btn btn-transparent" onClick={onClick}>
          {children}
        </button>
      </li>
    );
  }
}

class DropdownContainer extends PureComponent {
  state = {
    marginOffset: 0
  };

  componentDidMount() {
    if (this.container) {
      const windowWidth = window.innerWidth;
      const rightBounds = this.container.getBoundingClientRect().right;
      if (rightBounds > windowWidth) {
        this.setState({ marginOffset: windowWidth - rightBounds });
      }
    }
  }

  render() {
    const { children } = this.props;
    const { marginOffset } = this.state;
    return (
      <ul
        style={{ marginLeft: marginOffset }}
        ref={ref => (this.container = ref)}
        className="dropdown-button-actions"
      >
        {children}
      </ul>
    );
  }
}

class DropdownButton extends PureComponent {
  static Item = DropdownItem;

  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
    isDisabled: PropTypes.bool
  };

  state = {
    showDropdown: false
  };

  componentWillUnmount() {
    this.toggleDocumentMouseDown(false);
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.state.showDropdown !== nextState.showDropdown) {
      this.toggleDocumentMouseDown(nextState.showDropdown);
    }
  }

  onMouseDown = ev => {
    if (!(this.dropdownRef === ev.target || this.dropdownRef.contains(ev.target))) {
      this.setState({ showDropdown: false });
    }
  };

  toggleDocumentMouseDown = isMounted => {
    window.document[isMounted ? 'addEventListener' : 'removeEventListener']('mousedown', this.onMouseDown);
  };

  hideDropdown = () => this.setState({ showDropdown: false });

  toggleDropdown = () => this.setState(({ showDropdown }) => ({ showDropdown: !showDropdown }));

  render() {
    const { children, isDisabled } = this.props;
    const { showDropdown } = this.state;

    const childItems = Children.map(children, child => {
      return React.cloneElement(child, {
        onClick: () => {
          this.hideDropdown();
          child.props.onClick();
        }
      });
    });

    const buttonClass = cx(
      {
        selected: showDropdown
      },
      'kebab-button'
    );

    return (
      <div className="dropdown-button" ref={ref => (this.dropdownRef = ref)}>
        <Button transparent className={buttonClass} onClick={this.toggleDropdown} disabled={isDisabled}>
          <SocrataIcon name="kebab" />
        </Button>
        {showDropdown && <DropdownContainer>{childItems}</DropdownContainer>}
      </div>
    );
  }
}

export default DropdownButton;
