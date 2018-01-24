import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import SocrataIcon from 'common/components/SocrataIcon';
import I18n from 'common/i18n';

class PublicationState extends Component {
  static propTypes = {
    publicationState: PropTypes.oneOf(['draft', 'pending', 'published']).isRequired
  };

  render() {
    const { publicationState } = this.props;
    const scope = 'shared.components.asset_action_bar.publication_state';

    const { socrataIcon, translationKey } = {
      'draft': {
        socrataIcon: 'edit',
        translationKey: 'draft'
      },
      'pending': {
        socrataIcon: 'pending2',
        translationKey: 'pending'
      },
      'published': {
        socrataIcon: 'checkmark3',
        translationKey: 'published'
      }
    }[publicationState];
    return (
      <button className="btn btn-transparent publication-state">
        <SocrataIcon name={socrataIcon} className={`publication-state-${publicationState}`} />
        {I18n.t(translationKey, { scope })}
      </button>
    );
  }
}

export default PublicationState;
