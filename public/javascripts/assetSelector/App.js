import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import AssetSelector from './components/AssetSelector';
import ExternalResourceWizard from '../externalResourceWizard/components/ExternalResourceWizard';
import ExternalResourceWizardButton from '../externalResourceWizard/components/ExternalResourceWizardButton';
import { openAssetSelector } from './actions/modal';

export const App = (props) => {
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
            onClick={props.dispatchOpenAssetSelector}>
            Add...
          </button>
        </div>
      ))}

      <AssetSelector
        category={'Education'}
        resultsPerPage={6}
        additionalTopbarComponents={[
          <ExternalResourceWizardButton key={0} />
        ]} />
      <ExternalResourceWizard />
    </div>
  );
};

App.propTypes = {
  dispatchOpenAssetSelector: PropTypes.func
};

App.defaultProps = {
  dispatchOpenAssetSelector: _.noop
};

function mapDispatchToProps(dispatch) {
  return {
    dispatchOpenAssetSelector: function() {
      dispatch(openAssetSelector());
    }
  };
}

export default connect(null, mapDispatchToProps)(App);
