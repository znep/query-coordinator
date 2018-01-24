import React, { Component } from 'react';
import PropTypes from 'prop-types';
import RolePicker from '../../roles/components/RolePicker';
import { connect as fullConnect } from '../../utils';
import * as RoleActions from '../../roles/actions';
import * as Selectors from '../../selectors';

class UserFilter extends Component {
  render() {
    const { roleId, onRoleChange, I18n } = this.props;

    const initialOption = {
      title: I18n.t('users.roles.all'),
      value: 'all'
    };

    return (
      <div className="user-filter">
        <div className="user-filter-label">Filter by</div>
        <RolePicker
          initialOption={initialOption}
          roleId={roleId ? roleId : 'all'}
          onRoleChange={onRoleChange}
        />
      </div>
    );
  }
}

UserFilter.propTypes = {
  roleId: PropTypes.string,
  I18n: PropTypes.object
};

const mapStateToProps = state => {
  return {
    roleId: Selectors.getUserRoleFilter(state)
  };
};

const mapDispatchToProps = {
  onRoleChange: RoleActions.changeUserRoleFilter
};

export default fullConnect(mapStateToProps, mapDispatchToProps)(UserFilter);
