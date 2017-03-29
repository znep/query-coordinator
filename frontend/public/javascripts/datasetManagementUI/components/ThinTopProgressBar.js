import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import NProgress from 'nprogress';
import * as Selectors from '../selectors';

window.NProgress = NProgress;

class ThinTopProgressBar extends Component {

  componentWillReceiveProps(nextProps) {
    if (this.props.numLoadsInProgress === 0 && nextProps.loadsInProgress > 0) {
      console.log('nprogress start');
      NProgress.start();
    } else if (this.props.numLoadsInProgress > 0 && nextProps.loadsInProgress === 0) {
      console.log('nprogress done');
      NProgress.done();
      NProgress.remove();
    }
  }

  render() {
    return (
      <span />
    );
  }

}

ThinTopProgressBar.propTypes = {
  numLoadsInProgress: PropTypes.number.isRequired
};

function mapStateToProps(state) {
  return {
    numLoadsInProgress: Selectors.numLoadsInProgress(state.db)
  };
}

export default connect(mapStateToProps)(ThinTopProgressBar);
