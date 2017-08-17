import React, { Component, PropTypes } from 'react';
import cssModules from 'react-css-modules';
import { connect } from 'react-redux';

import Grid from '../util/Grid';
import ScrollContainer from '../util/ScrollContainer';
import RightsColumn from './RightsColumn';
import RoleColumn from './RoleColumn';
import * as selectors from '../../selectors';

import styles from './roles-grid.scss';

const mapStateToProps = state => ({
  roles: selectors.getRolesFromState(state)
});

class RolesGrid extends Component {
  render() {
    const { roles } = this.props;

    return (
      <Grid styleName="roles-grid">
        <RightsColumn />
        <ScrollContainer styleName="scroll-container">
          {roles.map(role =>
            <RoleColumn
              name={selectors.getRoleNameFromRole(role)}
              key={selectors.getRoleNameFromRole(role)}
              role={role}
            />
          )}
        </ScrollContainer>
      </Grid>
    );
  }
}

RolesGrid.propTypes = {
  roles: PropTypes.object.isRequired
};

export default connect(mapStateToProps)(cssModules(RolesGrid, styles));
