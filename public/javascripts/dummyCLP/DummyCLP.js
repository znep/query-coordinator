import React, { Component } from 'react';
import _ from 'lodash';
import AssetSelector from '../assetSelector/components/AssetSelector';
import ExternalResourceWizard from '../externalResourceWizard/components/ExternalResourceWizard';
import ExternalResourceWizardButton from './components/ExternalResourceWizardButton';

export class DummyCLP extends Component {
  constructor(props) {
    super(props);

    this.state = {
      assetSelectorIsOpen: false,
      externalResourceWizardIsOpen: false
    };

    _.bindAll(this, ['toggleAssetSelector', 'toggleExternalResourceWizard']);
  }

  onAssetSelection(result) {
    // This is where CLP would actually do stuff with the data
    console.log(result);
  }

  toggleAssetSelector() {
    this.setState({ assetSelectorIsOpen: !this.state.assetSelectorIsOpen });
  }

  toggleExternalResourceWizard() {
    this.setState({ externalResourceWizardIsOpen: !this.state.externalResourceWizardIsOpen });
  }

  render() {

    // TODO: remove these dummy divs
    const demoDivStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '200px',
      width: '300px',
      border: '1px dashed #999',
      margin: '1rem'
    };

    return (
      <div>
        {[...Array(3)].map((x, i) => (
          <div style={demoDivStyle} key={i}>
            <button
              className="btn btn-primary"
              onClick={this.toggleAssetSelector}>
              Add...
            </button>
          </div>
        ))}

        <AssetSelector
          additionalTopbarComponents={[
            <ExternalResourceWizardButton
              key={0}
              onClick={this.toggleExternalResourceWizard} />
          ]}
          category={'Education'}
          modalIsOpen={this.state.assetSelectorIsOpen}
          onClose={this.toggleAssetSelector}
          onSelect={this.onAssetSelection}
          resultsPerPage={6} />

        <ExternalResourceWizard
          modalIsOpen={this.state.externalResourceWizardIsOpen}
          onClose={this.toggleExternalResourceWizard}
          onSelect={this.onAssetSelection} />
      </div>
    );
  }
}

export default DummyCLP;
