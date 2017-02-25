import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { EditBar } from 'socrata-components';

function AppBar({ name, showPreviewLink }) {
  const previewLink = (
    <div className="primer-preview">
      <a
        href={`/d/${window.initialState.view.id}`}
        target="_blank">
        Preview Primer<span className="socrata-icon-preview" />
      </a>
    </div>
  );

  return (
    <EditBar name={name} >
      {showPreviewLink ? previewLink : null}
    </EditBar>
  );
}

AppBar.propTypes = {
  name: PropTypes.string.isRequired,
  showPreviewLink: PropTypes.bool.isRequired
};

function mapStateToProps(state) {
  // only show the preview link when an upsert job has successfully completed
  const showPreviewLink = !!_.find(state.db.upsert_jobs, { status: 'successful' });

  return {
    name: state.db.views[0].name,
    showPreviewLink
  };
}

export default connect(mapStateToProps)(AppBar);
