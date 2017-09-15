import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cssModules from 'react-css-modules';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Grid from '../util/Grid';
import Expandable from '../util/Expandable';
import { toggleExpanded } from '../../actions';
import { connectLocalization } from 'common/components/Localization';
import * as selectors from '../../selectors';

import styles from './roles-grid.scss';
import cssVariables from '../variables.scss';

const cellHeight = parseInt(cssVariables.cellHeight, 10);

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      toggleExpanded: rightCategory => toggleExpanded({ rightCategory })
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
        <Expandable.Trigger styleName="right-cell-trigger" onClick={() => toggleExpanded(rightCategory)}>
          <h6>
            {translate(selectors.getTranslationKeyPathFromRightCategory(rightCategory))}
          </h6>
        </Expandable.Trigger>
        {selectors.getRightsFromRightCategory(rightCategory).map(right =>
          <Grid.Cell styleName="right-cell-item" key={selectors.getNameFromRight(right)}>
            {translate(selectors.getNameTranslationKeyPathFromRight(right))}
          </Grid.Cell>
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
  connect(mapStateToProps, mapDispatchToProps)(cssModules(RightCategory, styles))
);
