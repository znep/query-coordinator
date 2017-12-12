import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import SocrataIcon from 'common/components/SocrataIcon';
import I18n from 'common/i18n';

class PublicationState extends React.Component {
  render() {
    const { publicationState } = this.props;
    const scope = 'shared.components.asset_action_bar.publication_state';

    const { socrataIcon, translationKey } = {
      'draft': {
        socrataIcon: 'draft',
        translationKey: 'draft'
      },
      'pending': {
        socrataIcon: 'pending',
        translationKey: 'pending'
      },
      'published': {
        socrataIcon: 'checkmark-alt',
        translationKey: 'published'
      }
    }[publicationState];
    return (
      <div className="publication-state">
        <SocrataIcon name={socrataIcon} className={`publication-state-${publicationState}`} />
        {I18n.t(translationKey, { scope })}
      </div>
    );
  }
}

PublicationState.propTypes = {
  publicationState: PropTypes.oneOf(['draft', 'pending', 'published']).isRequired
};

export default PublicationState;
