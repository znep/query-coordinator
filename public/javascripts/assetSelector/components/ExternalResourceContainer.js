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
            <div class="description">
              <p>{/* TODO: localization */}
                <strong>Create a link to an external resource for this category.</strong>
                <br />
                For example, this could be a visualization on the web, a blog post, or a link to another part of your site.
              </p>
            </div>
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
