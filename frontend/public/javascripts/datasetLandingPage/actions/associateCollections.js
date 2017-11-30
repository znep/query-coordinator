import {
  accessPointFor,
  getParentUid,
  getView,
  mergeNewAccessPoints,
  parentHasChild,
  putMetadata,
  removeChildFromParent
} from 'common/usaid_collections/associateCollections';

// EN-19924: USAID sadtimes. Lift 'n shift from DSMUI `apiCalls`
const apiCallStarted = () => ({
  type: 'API_CALL_STARTED',
  status: 'STATUS_CALL_IN_PROGRESS'
});

const apiCallSucceeded = () => ({
  type: 'API_CALL_SUCCEEDED',
  status: 'STATUS_CALL_SUCCEEDED',
  succeededAt: new Date()
});

const apiCallFailed = () => ({
  type: 'API_CALL_FAILED',
  status: 'STATUS_CALL_FAILED'
});

export function associateChildToParent(parentUid, childView) {
  return dispatch => {
    dispatch(apiCallStarted());

    return getView(parentUid).then(parentView => {
      if (!parentHasChild(parentView, childView.id)) {
        // update parent view, adding child
        const childAccessPoint = accessPointFor(childView, false);
        const newParentMetadata = mergeNewAccessPoints(parentView, [childAccessPoint]);
        putMetadata(parentUid, newParentMetadata).catch(() => {
          dispatch(apiCallFailed());
        });
      }

      const oldParentUid = getParentUid(childView);
      if (oldParentUid !== parentUid) {
        if (oldParentUid) {
          // remove the child from the current parent (about to be replaced)
          removeChildFromParent(oldParentUid, childView.id);
        }

        // update child view with new parent
        const newParentAccessPoint = accessPointFor(parentView, true);
        const newMetadata = {
          ...childView.metadata,
          'additionalAccessPoints': [newParentAccessPoint]
        };

        return putMetadata(childView.id, newMetadata).then(() => {
          dispatch(apiCallSucceeded());
        }).then(() => {
          location.reload();
        });
      } else {
        dispatch(apiCallSucceeded());
      }
    }).catch(() => {
      dispatch(apiCallFailed());
    });
  };
}
