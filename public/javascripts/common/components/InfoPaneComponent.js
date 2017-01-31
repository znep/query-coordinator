import _ from 'lodash';
import React, { PropTypes } from 'react';
import { InfoPane } from 'socrata-components';
import { FeatureFlags } from 'socrata-utils';

// This higher order component implements the business logic that interprets FeatureFlags to ensure
// that the display of the authority badge respects the business logic expressed in the feature flag.
const InfoPaneComponent = React.createClass({
  displayName: `${InfoPane.displayName}Component`,
  propTypes: {
    provenance: PropTypes.oneOf(['official', 'community', null])
  },

  provenanceIcon() {
    if (this.props.provenance === 'official') {
      return 'official2';
    }
    if (this.props.provenance === 'community') {
      return 'community';
    }
    if (!this.props.provenance) {
      return null;
    }
  },

  // Hide if there is no provenance or if the provenanceIcon is either 'all', 'official2', or 'community'
  hideProvenance() {
    return this.props.provenance === null ||
      _.includes(['all', this.provenanceIcon()], FeatureFlags.value('disableAuthorityBadge'));
  },

  render() {
    return (
      <InfoPane
        {...this.props}
        provenanceIcon={this.provenanceIcon()}
        hideProvenance={this.hideProvenance()} />
    );
  }
});

export default InfoPaneComponent;
