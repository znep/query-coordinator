import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import FilterPanelDesktop from './FilterPanelDesktop';
import FilterPanelMobile from './FilterPanelMobile';

class FilterPanel extends PureComponent {

  render() {
    const { isMobile } = this.props;

    const panel = isMobile ?
      <FilterPanelMobile /> :
      <FilterPanelDesktop />;

    return (
      <div className="catalog-filters">
        {panel}
      </div>
    );
  }
}


FilterPanel.propTypes = {
  isMobile: PropTypes.bool.isRequired
};

const mapStateToProps = (state) => ({
  isMobile: state.windowDimensions.isMobile
});

export default connect(mapStateToProps)(FilterPanel);
