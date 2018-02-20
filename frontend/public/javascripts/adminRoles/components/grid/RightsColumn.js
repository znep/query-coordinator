import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { customConnect, I18nPropType } from 'common/connectUtils';

import * as selectors from '../../adminRolesSelectors';
import Grid from '../util/Grid';
import RightCategory from './RightCategory';
import styles from './roles-grid.module.scss';

const mapStateToProps = state => ({
  rightCategories: selectors.getRightCategoriesFromState(state)
});

class RightsColumn extends Component {
  static propTypes = {
    I18n: I18nPropType,
    rightCategories: PropTypes.object.isRequired
  };

  render() {
    const { I18n, rightCategories } = this.props;

    return (
      <Grid.Column styleName="rights-column">
        <Grid.Header styleName="rights-header-cell">
          <h4>{I18n.t('screens.admin.roles.index_page.grid.role')}</h4>
        </Grid.Header>
        {rightCategories.map(rightCategory => (
          <RightCategory
            key={selectors.getTranslationKeyFromRightCategory(rightCategory)}
            rightCategory={rightCategory}
          />
        ))}
        <Grid.Cell styleName="right-footer-cell">
          {I18n.t('screens.admin.roles.index_page.grid.currently')}:
        </Grid.Cell>
      </Grid.Column>
    );
  }
}

export default customConnect({ mapStateToProps, styles })(RightsColumn);
