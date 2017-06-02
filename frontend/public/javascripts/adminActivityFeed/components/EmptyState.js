import React from 'react';
import connectLocalization from './Localization/connectLocalization';
import { connect } from 'react-redux';

import './EmptyState.scss';

class EmptyState extends React.Component {
  renderMessage() {
    const { localization } = this.props;

    const message = localization.translate('empty_message', {
      new_dataset_url: `${localization.getLocalePrefix()}/datasets/new`
    });

    return <div className="emptyState" dangerouslySetInnerHTML={{__html: message}} />;
  }

  render() {
    return this.props.isStateEmpty ? this.renderMessage() : null;
  }
}

const mapStateToProps = (state) => ({
  isStateEmpty: state.get('activities').count() === 0
});

export default connectLocalization(connect(mapStateToProps)(EmptyState));
