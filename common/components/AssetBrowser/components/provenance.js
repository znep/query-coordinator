import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { FeatureFlags } from 'common/feature_flags';
import I18n from 'common/i18n';

export class Provenance extends Component {
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
    const { includeLabel, provenance } = this.props;
    const title = I18n.t(`shared.asset_browser.filters.authority.options.${provenance}`);

    return (
      this.hideProvenance() ?
        null :
        <span className={`tag-${provenance}`} title={title}>
          <span aria-hidden className={`socrata-icon-${this.provenanceIcon()}`}></span>
          {includeLabel ? title : null}
        </span>
    );
  }
}

Provenance.propTypes = {
  provenance: PropTypes.string,
  includeLabel: PropTypes.bool
};

Provenance.defaultProps = {
  includeLabel: true
};

export default Provenance;
