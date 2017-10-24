import PropTypes from 'prop-types';
import React from 'react';
import { SocrataIcon } from 'common/components/SocrataIcon';
import bindAll from 'lodash/fp/bindAll';
import connectLocalization from 'common/i18n/components/connectLocalization';

class DropdownItem extends React.Component {
  render() {
    const { hideDropdown, name, onClick } = this.props;
    const handleClick = () => {
      hideDropdown();
      onClick();
    };

    return (
      <li>
        <button type="button" className="btn btn-transparent" onClick={handleClick}>
          {name}
        </button>
      </li>
    );
  }
}

DropdownItem.propTypes = {
  hideDropdown: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired
};

class UserEditControl extends React.Component {
  constructor() {
    super();
    this.state = {
      showDropdown: false
    };
    bindAll(['hideDropdown', 'toggleDropdown', 'toggleDocumentMouseDown', 'onMouseDown'], this);
  }

  componentDidMount() {
    this.toggleDocumentMouseDown(true);
  }

  componentWillUnmount() {
    this.toggleDocumentMouseDown(false);
  }

  onMouseDown(ev) {
    if (!(this.dropdownRef === ev.target || this.dropdownRef.contains(ev.target))) {
      this.setState({ showDropdown: false });
    }
  }

  toggleDocumentMouseDown(isMounted) {
    window.document[isMounted ? 'addEventListener' : 'removeEventListener']('mousedown', this.onMouseDown);
  }

  hideDropdown() {
    this.setState({ showDropdown: false });
  }

  toggleDropdown() {
    this.setState({ showDropdown: !this.state.showDropdown });
  }

  render() {
    const { removeRole, I18n } = this.props;
    const { showDropdown } = this.state;

    const buttonClass = `btn btn-transparent kebab-button${showDropdown ? ' selected' : ''}`;

    return (
      <div className="user-edit-control" ref={ref => (this.dropdownRef = ref)}>
        <button className={buttonClass} onClick={() => this.setState({ showDropdown: !showDropdown })}>
          <SocrataIcon name="kebab" />
        </button>
        {showDropdown && (
          <ul className="user-edit-actions">
            <DropdownItem
              name={I18n.t('users.actions.remove_role')}
              hideDropdown={this.hideDropdown}
              onClick={removeRole}
            />
          </ul>
        )}
      </div>
    );
  }
}

UserEditControl.propTypes = {
  removeRole: PropTypes.func.isRequired,
  I18n: PropTypes.object.isRequired
};

export default connectLocalization(UserEditControl);
