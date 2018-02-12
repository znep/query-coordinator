import PropTypes from 'prop-types';
import React from 'react';
import cssModules from 'react-css-modules';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import Button from 'common/components/Button';
import { connectLocalization } from 'common/components/Localization';
import { SocrataIcon } from 'common/components/SocrataIcon';

import * as Actions from '../../actions';
import * as Selectors from '../../adminRolesSelectors';
import styles from './role-edit-control.module.scss';

const mapDispatchToProps = (dispatch, { role }) =>
  bindActionCreators(
    {
      deleteRole: () => Actions.deleteRole(role),
      editRole: () => Actions.editRoleStart(role),
      renameRole: () => Actions.renameRole(role)
    },
    dispatch
  );

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

class RoleEditControl extends React.Component {
  static propTypes = {
    deleteRole: PropTypes.func.isRequired,
    editRole: PropTypes.func.isRequired,
    renameRole: PropTypes.func.isRequired,
    role: PropTypes.object.isRequired
  };

  state = {
    showDropdown: false
  };

  toggleDocumentMouseDown = isMounted => {
    window.document[isMounted ? 'addEventListener' : 'removeEventListener']('mousedown', this.onMouseDown);
  };

  onMouseDown = ev => {
    if (!(this.dropdownRef === ev.target || this.dropdownRef.contains(ev.target))) {
      this.setState({ showDropdown: false });
    }
  };

  componentDidMount() {
    this.toggleDocumentMouseDown(true);
  }

  componentWillUnmount() {
    this.toggleDocumentMouseDown(false);
  }

  hideDropdown = () => {
    this.setState({ showDropdown: false });
  };

  toggleDropdown = () => {
    const { showDropdown } = this.state;
    this.setState({ showDropdown: !showDropdown });
  };

  handleDeleteRole = () => {
    const { deleteRole, localization: { translate }, role } = this.props;
    const confirmationMessage = translate('screens.admin.roles.confirmation.delete_role', {
      name: Selectors.getRoleNameFromRole(role)
    });
    if (window.confirm(confirmationMessage)) {
      deleteRole();
    }
  };

  render() {
    const { editRole, renameRole, localization: { translate } } = this.props;
    const { showDropdown } = this.state;

    return (
      <div styleName="container" ref={ref => (this.dropdownRef = ref)}>
        <Button variant="simple" size="xs" styleName="role-edit-control" onClick={this.toggleDropdown}>
          <SocrataIcon name="kebab" />
        </Button>
        {showDropdown && (
          <ul>
            <DropdownItem
              name={translate('screens.admin.roles.index_page.edit_controls.rename_role')}
              hideDropdown={this.hideDropdown}
              onClick={renameRole}
            />
            <DropdownItem
              name={translate('screens.admin.roles.index_page.edit_controls.edit_role')}
              hideDropdown={this.hideDropdown}
              onClick={editRole}
            />
            <DropdownItem
              name={translate('screens.admin.roles.index_page.edit_controls.delete_role')}
              hideDropdown={this.hideDropdown}
              onClick={this.handleDeleteRole}
            />
          </ul>
        )}
      </div>
    );
  }
}

export default connectLocalization(connect(null, mapDispatchToProps)(cssModules(RoleEditControl, styles)));
