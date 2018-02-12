import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cssModules from 'react-css-modules';
import { connect } from 'react-redux';

import * as selectors from '../../adminRolesSelectors';
import Grid from '../util/Grid';
import ScrollContainer from '../util/ScrollContainer';
import RightsColumn from './RightsColumn';
import RoleColumn from './RoleColumn';
import styles from './roles-grid.module.scss';

const mapStateToProps = state => ({
  roles: selectors.getRolesFromState(state)
});

class RolesGrid extends Component {
  static propTypes = {
    roles: PropTypes.object.isRequired
  };

  render() {
    const { roles } = this.props;

    return (
      <Grid styleName="roles-grid">
        <RightsColumn />
        <ScrollContainer styleName="scroll-container">
          {roles.map(role => (
            <RoleColumn
              name={selectors.getRoleNameFromRole(role)}
              key={selectors.getRoleNameFromRole(role)}
              role={role}
            />
          ))}
        </ScrollContainer>
      </Grid>
    );
  }
}

export default connect(mapStateToProps)(cssModules(RolesGrid, styles));
