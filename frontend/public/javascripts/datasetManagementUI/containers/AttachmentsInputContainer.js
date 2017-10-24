import React from 'react'; // eslint-disable-line no-unused-vars
import { connect } from 'react-redux';
import AttachmentsInput from 'components/AttachmentsInput/AttachmentsInput';
import { uploadAttachment } from 'reduxStuff/actions/uploadFile';

const mapStateToProps = (state, props) => {
  return props;
};

const mergeProps = (stateProps, { dispatch }, ownProps) => {
  const { revision, setValue } = stateProps;
  const attachments = revision.attachments;

  return {
    ...stateProps,
    ...ownProps,
    uploadAttachment: file => {
      dispatch(uploadAttachment(revision, file))
        .then((result) => {
          const newAttachments = attachments.concat([
            {
              asset_id: result.file_id,
              filename: result.filename,
              name: result.filename
            }
          ]);

          setValue(newAttachments);
        });
    },

    removeAttachment: toRemove => {
      const newAttachments = attachments.filter(a => a.asset_id !== toRemove.asset_id);
      setValue(newAttachments);
    },

    editAttachment: (attachment, newName) => {
      const newAttachments = attachments.map(a => {
        if (a.asset_id === attachment.asset_id) {
          return { ...a, name: newName };
        } else {
          return a;
        }
      });

      setValue(newAttachments);
    }
  };
};

export default connect(mapStateToProps, null, mergeProps)(AttachmentsInput);
