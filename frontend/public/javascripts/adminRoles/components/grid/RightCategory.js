import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cssModules from 'react-css-modules';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Grid from '../util/Grid';
import Expandable from '../util/Expandable';
import Hoverable from '../util/Hoverable';
import * as Actions from '../../actions';
import { connectLocalization } from 'common/components/Localization';
import * as selectors from '../../adminRolesSelectors';

import styles from './roles-grid.module.scss';
import cssVariables from '../variables.scss';

const cellHeight = parseInt(cssVariables.cellHeight, 10);

const mapDispatchToProps = (dispatch, { rightCategory }) =>
  bindActionCreators(
    {
      toggleExpanded: () => Actions.toggleExpanded(rightCategory)
    },
    dispatch
  );

class RightCategory extends Component {
  render() {
    const { rightCategory, toggleExpanded, localization: { translate } } = this.props;
    return (
      <Expandable
        styleName="expandable-container"
        itemHeight={cellHeight}
        isExpanded={selectors.getExpandedStateFromRightCategory(rightCategory)}
      >
        <Hoverable name={rightCategory.get('translationKey')}>
          <Expandable.Trigger styleName="right-cell-trigger" onClick={toggleExpanded}>
            <h6>
              {translate(selectors.getTranslationKeyPathFromRightCategory(rightCategory))}
            </h6>
          </Expandable.Trigger>
        </Hoverable>
        {selectors.getRightsFromRightCategory(rightCategory).map(right =>
          <Hoverable name={right.get('name')} key={selectors.getNameFromRight(right)}>
            <Grid.Cell styleName="right-cell-item">
              {translate(selectors.getNameTranslationKeyPathFromRight(right))}
            </Grid.Cell>
          </Hoverable>
        )}
      </Expandable>
    );
  }
}

RightCategory.propTypes = {
  rightCategory: PropTypes.object.isRequired,
  toggleExpanded: PropTypes.func.isRequired
};

export default connectLocalization(
  connect(null, mapDispatchToProps)(cssModules(RightCategory, styles))
);
