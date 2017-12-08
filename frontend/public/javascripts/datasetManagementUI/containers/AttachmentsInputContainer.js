import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import AttachmentsInput from 'components/AttachmentsInput/AttachmentsInput';
import { uploadAttachment } from 'reduxStuff/actions/uploadFile';
import { editRevision } from 'reduxStuff/actions/revisions';
import { getRevision } from 'containers/ManageMetadataContainer.js';

const mapStateToProps = ({ entities }, { params }) => {
  const revisionSeq = Number(params.revisionSeq);
  const revision = getRevision(entities.revisions, revisionSeq) || {};

  return {
    revision
  };
};

const mergeProps = (stateProps, { dispatch }, ownProps) => {
  const { revision } = stateProps;
  const { handleAttachmentChange, field, inErrorState } = ownProps;
  const attachments = revision.attachments;

  return {
    field,
    inErrorState,
    uploadAttachment: file => {
      dispatch(uploadAttachment(revision, file)).then(result => {
        const newAttachments = attachments.concat([
          {
            asset_id: result.file_id,
            filename: result.filename,
            name: result.filename
          }
        ]);

        handleAttachmentChange(newAttachments);
      });
    },

    removeAttachment: toRemove => {
      const newAttachments = attachments.filter(a => a.asset_id !== toRemove.asset_id);
      dispatch(editRevision(revision.id, { attachments: newAttachments }));
      handleAttachmentChange(newAttachments);
    },

    editAttachment: (attachment, newName) => {
      const newAttachments = attachments.map(a => {
        if (a.asset_id === attachment.asset_id) {
          return { ...a, name: newName };
        } else {
          return a;
        }
      });

      handleAttachmentChange(newAttachments);
    }
  };
};

export default withRouter(connect(mapStateToProps, null, mergeProps)(AttachmentsInput));
