import React, { Component } from 'react';
import PropTypes from 'prop-types';
import RolePicker from '../../roles/components/RolePicker';
import { customConnect, I18nPropType } from 'common/connectUtils';
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
  I18n: I18nPropType.isRequired
};

const mapStateToProps = state => {
  return {
    roleId: Selectors.getUserRoleFilter(state)
  };
};

const mapDispatchToProps = {
  onRoleChange: RoleActions.changeUserRoleFilter
};

export default customConnect({ mapStateToProps, mapDispatchToProps })(UserFilter);
