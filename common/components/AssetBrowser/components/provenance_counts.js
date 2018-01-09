import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import classNames from 'classnames';

import { FeatureFlags } from 'common/feature_flags';
import I18n from 'common/i18n';
import * as filtersActions from 'common/components/AssetBrowser/actions/filters';

export class ProvenanceCounts extends Component {

  componentWillReceiveProps() {
    this.render();
  }

  render() {
    const {
      fetchingProvenanceCounts,
      fetchingProvenanceCountsError,
      filters,
      provenanceCounts
    } = this.props;

    if (_.isEmpty(_.compact(_.values(provenanceCounts)))) {
      return null;
    }

    const scope = 'shared.asset_browser.header.provenance_counts';
    const provenanceTypeTranslation = (key, count) => I18n.t(key, { count, scope });

    const provenanceCountItems = _.map(provenanceCounts, (provenanceCount, provenanceType) => {
      if (provenanceCount === 0) return;
      const provenanceTypeName = provenanceTypeTranslation(provenanceType, provenanceCount);
      const provenanceCountsItemClass = `provenance-counts-item ${provenanceType}`;

      return (
        <div className={provenanceCountsItemClass} key={provenanceType}>
          <div className="item-count">{provenanceCount}</div>
          <div className="item-name">{provenanceTypeName}</div>
        </div>
      );
    });

    const provenanceCountsClass = classNames('provenance-counts', {
      'fetching': fetchingProvenanceCounts,
      'has-error': fetchingProvenanceCountsError
    });

    return (
      <div className={provenanceCountsClass}>
        {provenanceCountItems}
      </div>
    );
  }
}

ProvenanceCounts.propTypes = {
  provenanceCounts: PropTypes.shape({
    community: PropTypes.number,
    official: PropTypes.number
  }).isRequired,
  fetchingProvenanceCounts: PropTypes.bool,
  fetchingProvenanceCountsError: PropTypes.bool,
  filters: PropTypes.shape({
    provenanceTypes: PropTypes.string
  })
};

const mapStateToProps = (state) => ({
  provenanceCounts: _.get(state, 'provenanceCounts.values', {}),
  fetchingProvenanceCounts: _.get(state, 'provenanceCounts.fetchingProvenanceCounts', false),
  fetchingProvenanceCountsError: _.get(state, 'provenanceCounts.fetchingProvenanceCountsError', false),
  filters: state.filters
});

export default connect(mapStateToProps)(ProvenanceCounts);
