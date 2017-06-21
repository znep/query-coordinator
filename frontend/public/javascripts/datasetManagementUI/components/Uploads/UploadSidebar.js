import React, { PropTypes } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import moment from 'moment';

export const UploadSidebar = ({ currentUpload, otherUploadsList }) => {
  const items = otherUploadsList.map(upload =>
    <li>{upload.filename}<span>{moment.utc(upload.finished_at).fromNow()}</span></li>
  );

  return (
    <section>
      <ul>
        <li>{currentUpload.filename}<span>{moment.utc(currentUpload.finished_at).fromNow()}</span></li>
      </ul>
      <ul>
        {items}
      </ul>
    </section>
  );
};

export const mapStateToProps = ({ entities }, { uploadId }) => {
  const currentUpload = entities.uploads[uploadId];
  const otherUploads = _.omit(entities.uploads, uploadId);
  const otherUploadsList = Object.keys(otherUploads).map(id => entities.uploads[id]);

  return {
    currentUpload,
    otherUploadsList
  };
};

export default connect(mapStateToProps)(UploadSidebar);
