import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';

import { customConnect, I18nPropType } from 'common/connectUtils';

import * as Actions from '../../actions';
import * as selectors from '../../adminRolesSelectors';
import Expandable from '../util/Expandable';
import Grid from '../util/Grid';
import Hoverable from '../util/Hoverable';
import cssVariables from '../variables.scss';
import styles from './roles-grid.module.scss';

const cellHeight = parseInt(cssVariables.cellHeight, 10);

const mapDispatchToProps = (dispatch, { rightCategory }) =>
  bindActionCreators(
    {
      toggleExpanded: () => Actions.toggleExpanded(rightCategory)
    },
    dispatch
  );

class RightCategory extends Component {
  static propTypes = {
    I18n: I18nPropType,
    rightCategory: PropTypes.object.isRequired,
    toggleExpanded: PropTypes.func.isRequired
  };

  render() {
    const { I18n, rightCategory, toggleExpanded } = this.props;
    return (
      <Expandable
        styleName="expandable-container"
        itemHeight={cellHeight}
        isExpanded={selectors.getExpandedStateFromRightCategory(rightCategory)}
      >
        <Hoverable name={rightCategory.get('translationKey')}>
          <Expandable.Trigger styleName="right-cell-trigger" onClick={toggleExpanded}>
            <h6>{I18n.t(selectors.getTranslationKeyPathFromRightCategory(rightCategory))}</h6>
          </Expandable.Trigger>
        </Hoverable>
        {selectors.getRightsFromRightCategory(rightCategory).map(right => (
          <Hoverable name={right.get('name')} key={selectors.getNameFromRight(right)}>
            <Grid.Cell styleName="right-cell-item">
              {I18n.t(selectors.getNameTranslationKeyPathFromRight(right))}
            </Grid.Cell>
          </Hoverable>
        ))}
      </Expandable>
    );
  }
}

export default customConnect({ mapDispatchToProps, styles })(RightCategory);
