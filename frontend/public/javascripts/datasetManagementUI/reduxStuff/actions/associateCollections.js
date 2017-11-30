import uuid from 'uuid';
import { editRevision, updateRevision, shapeRevision } from 'reduxStuff/actions/revisions';
import { apiCallStarted, apiCallSucceeded, apiCallFailed, UPDATE_REVISION }
  from 'reduxStuff/actions/apiCalls';
import {
  accessPointFor,
  getParentUid,
  getView,
  mergeNewAccessPoints,
  parentHasChild,
  putMetadata,
  removeChildFromParent
} from 'common/usaid_collections/associateCollections';

// when the child is the working revision, and the parent is a complete dataset
export function associateChildToParent(parentUid, currentRevision, revisionParams) {
  return dispatch => {
    const callId = uuid();
    dispatch(
      apiCallStarted(callId, { operation: UPDATE_REVISION })
    );

    return getView(parentUid).then(parentView => {
      if (!parentHasChild(parentView, currentRevision.fourfour)) {
        // update parent view, adding child
        const childAccessPoint = accessPointFor({
          ...currentRevision.metadata,
          id: currentRevision.fourfour
        }, false);
        const newParentMetadata = mergeNewAccessPoints(parentView, [childAccessPoint]);
        putMetadata(parentUid, newParentMetadata).catch((err) => {
          dispatch(apiCallFailed(callId, err));
        });
      }

      const oldParentUid = getParentUid(currentRevision);
      if (oldParentUid !== parentUid) {
        if (oldParentUid) {
          // remove the child from the current parent (about to be replaced)
          removeChildFromParent(oldParentUid, currentRevision.fourfour);
        }

        // update child revision with new parent
        const newParentAccessPoint = accessPointFor(parentView, true);
        const newMetadata = {
          ...currentRevision.metadata.metadata,
          'additionalAccessPoints': [newParentAccessPoint]
        };
        return dispatch(updateRevision({ 'metadata': { metadata: newMetadata } }, revisionParams, callId))
          .then(resp => {
            const updatedRevision = shapeRevision(resp.resource);
            dispatch(editRevision(updatedRevision.id, updatedRevision));
          });
      } else {
        dispatch(apiCallSucceeded(callId));
      }
    }).catch(err => {
      dispatch(apiCallFailed(callId, err));
    });
  };
}
