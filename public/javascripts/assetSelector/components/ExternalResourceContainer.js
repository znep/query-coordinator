import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { closeExternalResourceContainer } from '../actions/modal';
import BackButton from './BackButton';
import Header from './Header';

export class ExternalResourceContainer extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="external-resource-container">
        <div className="results-container">
          <Header title={'Feature an External Resource'} />{/* TODO: Localization */}
          <div className="centered-content">
            <BackButton onClick={this.props.dispatchCloseExternalResourceContainer} />
          </div>
        </div>
      </div>
    );
  }
}

ExternalResourceContainer.propTypes = {
  dispatchCloseExternalResourceContainer: PropTypes.func.isRequired
};

ExternalResourceContainer.defaultProps = {
  dispatchCloseExternalResourceContainer: _.noop
};

function mapStateToProps(state) {
  return {
  };
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchCloseExternalResourceContainer: function() {
      dispatch(closeExternalResourceContainer());
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ExternalResourceContainer);
