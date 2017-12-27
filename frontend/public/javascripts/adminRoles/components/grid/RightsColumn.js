import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cssModules from 'react-css-modules';
import { connect } from 'react-redux';

import Grid from '../util/Grid';
import RightCategory from './RightCategory';
import { connectLocalization } from 'common/components/Localization';
import * as selectors from '../../selectors';

import styles from './roles-grid.module.scss';

const mapStateToProps = state => ({
  rightCategories: selectors.getRightCategoriesFromState(state)
});

class RightsColumn extends Component {
  render() {
    const { rightCategories, localization: { translate } } = this.props;

    return (
      <Grid.Column styleName="rights-column">
        <Grid.Header styleName="rights-header-cell">
          <h4>
            {translate('screens.admin.roles.index_page.grid.role')}
          </h4>
        </Grid.Header>
        {rightCategories.map(rightCategory =>
          <RightCategory
            key={selectors.getTranslationKeyFromRightCategory(rightCategory)}
            rightCategory={rightCategory}
          />
        )}
        <Grid.Cell styleName="right-footer-cell">
          {translate('screens.admin.roles.index_page.grid.currently')}:
        </Grid.Cell>
      </Grid.Column>
    );
  }
}

RightsColumn.propTypes = {
  rightCategories: PropTypes.object.isRequired
};

export default connectLocalization(connect(mapStateToProps)(cssModules(RightsColumn, styles)));
