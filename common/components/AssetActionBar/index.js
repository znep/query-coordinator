import PropTypes from 'prop-types';
import React, { Component } from 'react';

import PublicationState from './components/publication_state/index';
import ShareButton from './components/share_button';

class AssetActionBar extends React.Component {
  render() {
    return (
      <div className="asset-action-bar">
        <ShareButton />
        <PublicationState />
      </div>
    );
  }
}

export default AssetActionBar;
