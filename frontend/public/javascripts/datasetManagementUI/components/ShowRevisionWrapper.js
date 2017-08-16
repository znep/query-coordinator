import React, { PropTypes } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import {
  loadRevision,
  redirectToBaseIfTaskSetExists
} from 'actions/loadRevision';

class ShowRevisionWrapper extends React.Component {
  constructor() {
    super();
    this.state = {
      revisionLoaded: false
    };
  }

  componentDidMount() {
    this.props.loadRevision(this.props.params).then(() => {
      this.setState({
        revisionLoaded: true
      });

      this.props.redirectToBaseIfTaskSetExists();
    });
  }

  render() {
    if (this.state.revisionLoaded) {
      return (
        <div>
          {this.props.children}
        </div>
      );
    } else {
      return (
        <div id="initial-spinner-container">
          <span className="spinner-default spinner-large" />
        </div>
      );
    }
  }
}

ShowRevisionWrapper.propTypes = {
  loadRevision: PropTypes.func.isRequired,
  redirectToBaseIfTaskSetExists: PropTypes.func.isRequired,
  params: PropTypes.object.isRequired,
  children: PropTypes.element.isRequired
};

function mapDispatchToProps(dispatch, ownProps) {
  return {
    loadRevision: () => {
      return dispatch(loadRevision(ownProps.params));
    },
    redirectToBaseIfTaskSetExists: () => {
      dispatch(redirectToBaseIfTaskSetExists(ownProps.params));
    }
  };
}

export default withRouter(connect(null, mapDispatchToProps)(ShowRevisionWrapper));
