import React, { PropTypes } from 'react';
import { connect } from 'react-redux';

import { Dropdown } from 'common/components';
import connectLocalization from 'common/i18n/components/connectLocalization';

import * as filterOptions from '../../lib/catalog_filter_options';
import * as filters from '../../actions/filters';

export class VisibilityFilter extends React.Component {
  render() {
    const { visibility, changeVisibility, I18n } = this.props;

    const labelText = I18n.t('internal_asset_manager.filters.visibility.label');

    return (
      <div className="filter-section visibility">
        <label className="filter-label">{labelText}</label>
        <Dropdown
          onSelection={(option) => changeVisibility(option.value)}
          options={filterOptions.visibilityOptions}
          size="medium"
          value={visibility || null} />
      </div>
    );
  }
}

VisibilityFilter.propTypes = {
  visibility: PropTypes.string,
  changeVisibility: PropTypes.func.isRequired,
  I18n: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  visibility: state.filters.visibility
});

const mapDispatchToProps = (dispatch) => ({
  changeVisibility: (value) => dispatch(filters.changeVisibility(value))
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(VisibilityFilter));
