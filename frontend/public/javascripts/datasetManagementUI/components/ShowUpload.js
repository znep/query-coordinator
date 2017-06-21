/* eslint react/jsx-indent: 0 */
import React, { PropTypes } from 'react';
import { push } from 'react-router-redux';
import { connect } from 'react-redux';
import { Modal, ModalHeader, ModalContent } from 'common/components';
import { STATUS_CALL_IN_PROGRESS } from 'lib/apiCallStatus';
import * as Links from '../links';
import UploadBreadcrumbs from 'components/Uploads/UploadBreadcrumbs';
import DragDropUpload from 'components/Uploads/DragDropUpload';
import UploadSidebar from 'components/Uploads/UploadSidebar';
import styles from 'styles/ShowUpload.scss';

export const ShowUpload = ({ inProgress, goHome, uploadId }) =>
  <div className={styles.showUpload}>
    <Modal fullScreen onDismiss={goHome}>
      <ModalHeader onDismiss={goHome}>
        <UploadBreadcrumbs atShowUpload uploadId={uploadId} />
      </ModalHeader>
      <ModalContent className={styles.modalContent}>
        {inProgress
          ? <div className={styles.centeredContainer}>
              <span className={styles.spinner} />
            </div>
          : <div className={styles.uploadContainer}>
              <DragDropUpload />
              <section className={styles.sidebar}>
                <UploadSidebar uploadId={uploadId} />
              </section>
            </div>}
      </ModalContent>
    </Modal>
  </div>;

export const mapStateToProps = ({ entities, ui }, { params }) => {
  const uploadId = Number(params.uploadId);
  const apiCallList = Object.keys(ui.apiCalls).map(callId => ui.apiCalls[callId]);
  const apiCall = apiCallList.filter(
    call =>
      call.operation === 'UPLOAD_FILE' &&
      call.status === STATUS_CALL_IN_PROGRESS &&
      call.params &&
      call.params.id === uploadId
  );
  return {
    inProgress: !!apiCall.length,
    uploadId
  };
};

ShowUpload.propTypes = {
  inProgress: PropTypes.bool.isRequired,
  goHome: PropTypes.func.isRequired,
  uploadId: PropTypes.number.isRequired
};

export const mapDispatchToProps = (dispatch, ownProps) => ({
  goHome: () => dispatch(push(Links.home(ownProps.location)))
});

export default connect(mapStateToProps, mapDispatchToProps)(ShowUpload);

// function query(entities, uploadId) {
//   const upload = entities.uploads[_.toNumber(uploadId)];
//   const inputSchemas = _.filter(entities.input_schemas, { upload_id: upload.id });
//
//   return {
//     upload,
//     latestOutputSchema: inputSchemas.length ? Selectors.latestOutputSchema(entities) : null
//   };
// }
//
// function ShowUpload({ upload, latestOutputSchema, goHome }) {
//   let body;
//   if (!latestOutputSchema) {
//     body = (
//       <div className={styles.centeredContainer}>
//         <span className={styles.spinner} />
//       </div>
//     );
//   } else {
//     body = (
//       <div>
//         Layers:
//         <ul>
//           <li>
//             {latestOutputSchema.name || I18n.home_pane.only_layer}
//             <ul>
//               <li>
//                 <Link
//                   to={Links.showOutputSchema(
//                     upload.id,
//                     latestOutputSchema.input_schema_id,
//                     latestOutputSchema.id
//                   )}>
//                   {latestOutputSchema.id}
//                 </Link>
//               </li>
//             </ul>
//           </li>
//         </ul>
//       </div>
//     );
//   }
//
//   const modalProps = {
//     fullScreen: true,
//     onDismiss: goHome
//   };
//   // Not going to style these breadcrumbs because this page is going to go away.
//   const headerProps = {
//     title: (
//       <ol className={styles.list}>
//         <li className={styles.active}>
//           {I18n.home_pane.data}
//           <SocrataIcon name="arrow-right" className={styles.icon} />
//         </li>
//         <li>
//           {I18n.home_pane.preview}
//         </li>
//       </ol>
//     ),
//     onDismiss: goHome
//   };
//
//   return (
//     <div className={styles.showUpload}>
//       <Modal {...modalProps}>
//         <ModalHeader {...headerProps} />
//
//         <ModalContent>
//           {body}
//         </ModalContent>
//       </Modal>
//     </div>
//   );
// }
//
// ShowUpload.propTypes = {
//   upload: PropTypes.object.isRequired,
//   latestOutputSchema: PropTypes.object,
//   goHome: PropTypes.func.isRequired
// };
//
// function mapStateToProps(state, ownProps) {
//   const params = ownProps.params;
//   return query(state.entities, params.uploadId);
// }
//
// function mapDispatchToProps(dispatch, ownProps) {
//   return {
//     goHome: () => {
//       dispatch(push(Links.home(ownProps.location)));
//     }
//   };
// }
//
// export default connect(mapStateToProps, mapDispatchToProps)(ShowUpload);
