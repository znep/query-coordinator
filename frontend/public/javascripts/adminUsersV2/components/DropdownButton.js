import PropTypes from 'prop-types';
import React, { Children } from 'react';
import { SocrataIcon } from 'common/components/SocrataIcon';

export class DropdownItem extends React.Component {
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

class DropdownButton extends React.Component {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
    isDisabled: PropTypes.bool
  };

  constructor() {
    super();
    this.state = {
      showDropdown: false
    };
  }

  componentWillUnmount() {
    this.toggleDocumentMouseDown(false);
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.state.showDropdown !== nextState.showDropdown) {
      this.toggleDocumentMouseDown(nextState.showDropdown);
    }
  }

  onMouseDown = (ev) => {
    if (!(this.dropdownRef === ev.target || this.dropdownRef.contains(ev.target))) {
      this.setState({ showDropdown: false });
    }
  };

  toggleDocumentMouseDown = (isMounted) => {
    window.document[isMounted ? 'addEventListener' : 'removeEventListener']('mousedown', this.onMouseDown);
  };

  hideDropdown = () => {
    this.setState({ showDropdown: false });
  };

  toggleDropdown = () => {
    this.setState({ showDropdown: !this.state.showDropdown });
  };

  render() {
    const { children, isDisabled } = this.props;
    const { showDropdown } = this.state;

    const buttonClass = `btn btn-transparent kebab-button${showDropdown ? ' selected' : ''}`;
    const childItems = Children.map(children, child => {
      return React.cloneElement(child, { onClick: () => { this.hideDropdown(); child.props.onClick(); }});
    });

    return (
      <div className="dropdown-button" ref={ref => (this.dropdownRef = ref)}>
        <button
          className={buttonClass}
          onClick={() => this.setState({ showDropdown: !showDropdown })}
          disabled={isDisabled}>
          <SocrataIcon name="kebab" />
        </button>
        {showDropdown &&
        <ul className="dropdown-button-actions">
          {childItems}
        </ul>}
      </div>
    );
  }
}

export default DropdownButton;
