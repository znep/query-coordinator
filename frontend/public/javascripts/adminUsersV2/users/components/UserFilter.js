import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { LocalizedRolePicker } from '../../roles/components/RolePicker';
import { connect } from 'react-redux';
import { roleFilterChanged } from '../../roles/actions';
import connectLocalization from 'common/i18n/components/connectLocalization';

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
        <LocalizedRolePicker
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
    roleId: state.filters.role_ids
  };
};

const mapDispatchToProps = dispatch => {
  return {
    onRoleChange: roleId => dispatch(roleFilterChanged(roleId))
  };
};

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(UserFilter));
