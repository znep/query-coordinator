import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Link, browserHistory } from 'react-router';
import { connect } from 'react-redux';
import * as Links from 'links';
import { loadRevisionsList, createRevision } from 'reduxStuff/actions/showView';

function RevisionsList({ revisions, params }) {
  return (
    <ul>
      {revisions.map(revision =>
        <li key={revision.id}>
          <Link to={Links.revisionBase({ ...params, revisionSeq: revision.revision_seq })}>
            #{revision.revision_seq} by {revision.created_by.display_name}
          </Link>
        </li>
      )}
    </ul>
  );
}

RevisionsList.propTypes = {
  revisions: PropTypes.arrayOf(PropTypes.object).isRequired,
  params: PropTypes.object.isRequired
};

class ShowView extends React.Component {
  constructor() {
    super();
    this.state = {
      revisionsListLoaded: false
    };
  }

  componentDidMount() {
    this.props.loadRevisionsList().then(() => {
      this.setState({
        revisionsListLoaded: true
      });
    });
  }

  render() {
    return (
      <div>
        Revisions:
        {this.state.revisionsListLoaded
          ? <RevisionsList params={this.props.params} revisions={this.props.revisions} />
          : <p>Loading revisions list...</p>}
        <button className="btn btn-primary" onClick={this.props.createRevision}>
          Create Revision
        </button>
        <pre>{JSON.stringify(this.props.view, null, 2)}</pre>
      </div>
    );
  }
}

ShowView.propTypes = {
  params: PropTypes.object.isRequired,
  revisions: PropTypes.arrayOf(PropTypes.object).isRequired,
  view: PropTypes.object.isRequired,
  createRevision: PropTypes.func.isRequired,
  loadRevisionsList: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  return {
    view: _.values(state.entities.views)[0],
    revisions: _.values(state.entities.revisions)
  };
}

function mapDispatchToProps(dispatch, ownProps) {
  return {
    loadRevisionsList: () => {
      return dispatch(loadRevisionsList());
    },
    createRevision: () => {
      return dispatch(createRevision()).then(revision => {
        browserHistory.push(Links.revisionBase({ ...ownProps.params, revisionSeq: revision.revision_seq }));
      });
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowView);
