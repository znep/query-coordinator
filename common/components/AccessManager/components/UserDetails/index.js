import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';

import SocrataIcon from 'common/components/SocrataIcon';

import UserPropType from 'common/components/AccessManager/propTypes/UserPropType';

import { USER_TYPES } from 'common/components/AccessManager/Constants';

import UserLabel from './UserLabel';
import styles from './list-item.module.scss';

/**
 * Children are rendered after the user label is, for optional actions that can
 * be taken for a user (i.e. changing permissions)
 */
class UserDetails extends Component {
  static propTypes = {
    // user object; must have email
    // if displayName is not present, will be labeled as an "unregistered user"
    user: UserPropType.isRequired,
    children: PropTypes.node
  }

  render() {
    const { user } = this.props;
    const { type } = user;

    return (
      <div styleName="container">
        {/*
          Unfortunately we can't just use "type" here as the icon name since
          the type is "interactive" but the icon is "user"
        */}
        {(type && type === USER_TYPES.TEAM) ?
          (<SocrataIcon name="team" styleName="icon" />) :
          (<SocrataIcon name="user" styleName="icon" />)
        }
        <div styleName="inner-container">
          <UserLabel user={user} />
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default cssModules(UserDetails, styles);
