import PropTypes from 'prop-types';
import React from 'react';
import { bindActionCreators } from 'redux';
import cssModules from 'react-css-modules';
import styles from './role-edit-control.scss';
import { SocrataIcon } from 'common/components/SocrataIcon';
import SocrataButton from 'common/components/SocrataButton';
import { startEditRole, deleteRole, startRenameRole } from '../../actions';
import { connect } from 'react-redux';
import bindAll from 'lodash/fp/bindAll';
import { connectLocalization } from 'common/components/Localization';

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      deleteRole: role => deleteRole({ role }),
      editRole: role => startEditRole({ role }),
      renameRole: role => startRenameRole({ role })
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
  constructor() {
    super();
    this.state = {
      showDropdown: false
    };
    bindAll(['hideDropdown', 'toggleDropdown', 'toggleDocumentMouseDown', 'onMouseDown'], this);
  }

  toggleDocumentMouseDown(isMounted) {
    window.document[isMounted ? 'addEventListener' : 'removeEventListener']('mousedown', this.onMouseDown);
  }

  onMouseDown(ev) {
    if (!(this.dropdownRef === ev.target || this.dropdownRef.contains(ev.target))) {
      this.setState({ showDropdown: false });
    }
  }

  componentDidMount() {
    this.toggleDocumentMouseDown(true);
  }

  componentWillUnmount() {
    this.toggleDocumentMouseDown(false);
  }

  hideDropdown() {
    this.setState({ showDropdown: false });
  }

  toggleDropdown() {
    this.setState({ showDropdown: !this.state.showDropdown });
  }

  render() {
    const { deleteRole, editRole, renameRole, role, localization: { translate } } = this.props;
    const { showDropdown } = this.state;

    return (
      <div styleName="container" ref={ref => (this.dropdownRef = ref)}>
        <SocrataButton
          buttonType="simple"
          buttonSize="xs"
          styleName="role-edit-control"
          onClick={() => this.setState({ showDropdown: !showDropdown })}
        >
          <SocrataIcon name="kebab" />
        </SocrataButton>
        {showDropdown &&
          <ul>
            <DropdownItem
              name={translate('screens.admin.roles.index_page.edit_controls.rename_role')}
              hideDropdown={this.hideDropdown}
              onClick={() => renameRole(role)}
            />
            <DropdownItem
              name={translate('screens.admin.roles.index_page.edit_controls.edit_role')}
              hideDropdown={this.hideDropdown}
              onClick={() => editRole(role)}
            />
            <DropdownItem
              name={translate('screens.admin.roles.index_page.edit_controls.delete_role')}
              hideDropdown={this.hideDropdown}
              onClick={() => deleteRole(role)}
            />
          </ul>}
      </div>
    );
  }
}

RoleEditControl.propTypes = {
  deleteRole: PropTypes.func.isRequired,
  editRole: PropTypes.func.isRequired,
  renameRole: PropTypes.func.isRequired,
  role: PropTypes.object.isRequired
};

export default connectLocalization(
  connect(mapStateToProps, mapDispatchToProps)(cssModules(RoleEditControl, styles))
);
