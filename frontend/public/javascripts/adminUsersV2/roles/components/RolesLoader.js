import { Component } from 'react';
import { reduxConnect } from 'common/connectUtils';
import { withRouter } from 'react-router';
import flow from 'lodash/fp/flow';
import get from 'lodash/fp/get';

import * as rolesActions from '../actions';

export class RolesLoader extends Component {
  componentDidMount() {
    this.props.loadRoles();
    const roleId = get('location.query.roleId', this.props);
    this.props.changeUserRoleFilter(roleId);
  }
  render() {
    return null;
  }
}

const mapDispatchToProps = {
  loadRoles: rolesActions.loadRoles,
  changeUserRoleFilter: rolesActions.changeUserRoleFilter
};

export default flow(reduxConnect(null, mapDispatchToProps), withRouter)(RolesLoader);
