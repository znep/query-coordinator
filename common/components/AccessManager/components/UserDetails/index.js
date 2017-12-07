import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';

import UserLabel from './UserLabel';
import styles from './list-item.scss';
import SocrataIcon from '../../../SocrataIcon';
import UserPropType from '../../propTypes/UserPropType';

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

    return (
      <div styleName="container">
        <SocrataIcon name="user" styleName="icon" />
        <div styleName="inner-container">
          <UserLabel user={user} />
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default cssModules(UserDetails, styles);
