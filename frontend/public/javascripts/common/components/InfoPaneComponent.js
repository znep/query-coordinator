import _ from 'lodash';
import React, { PropTypes, Component } from 'react';
import { InfoPane } from 'common/components';
import { FeatureFlags } from 'common/feature_flags';

// This higher order component implements the business logic that interprets FeatureFlags to ensure
// that the display of the authority badge respects the business logic expressed in the feature flag.
class InfoPaneComponent extends Component {
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
  }
  // Hide if there is no provenance or if the provenanceIcon is either 'all', 'official2', or 'community'
  hideProvenance() {
    return this.props.provenance === null ||
      _.includes(['all', this.provenanceIcon()], FeatureFlags.value('disable_authority_badge'));
  }

  render() {
    return (
      <InfoPane
        {...this.props}
        provenanceIcon={this.provenanceIcon()}
        hideProvenance={this.hideProvenance()} />
    );
  }
}

InfoPaneComponent.propTypes = {
  provenance: PropTypes.oneOf(['official', 'community', null])
};

export default InfoPaneComponent;
