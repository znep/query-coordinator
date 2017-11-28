import _ from 'lodash';
import uuid from 'uuid';
import { socrataFetch, getJson, checkStatus } from 'lib/http';
import { editRevision, updateRevision, shapeRevision } from 'reduxStuff/actions/revisions';
import { apiCallStarted, apiCallSucceeded, apiCallFailed, UPDATE_REVISION }
  from 'reduxStuff/actions/apiCalls';
import * as coreLinks from 'links/coreLinks';

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

function getView(fourfour) {
  return socrataFetch(coreLinks.view(fourfour)).
    then(checkStatus).
    then(getJson);
}

function putMetadata(fourfour, metadata) {
  return socrataFetch(coreLinks.view(fourfour), {
    method: 'PUT',
    body: JSON.stringify({ metadata })
  }).then(checkStatus).then(getJson);
}

function mergeNewAccessPoints(view, newAccessPoints) {
  const oldMetadata = view.metadata || {};
  const additionalAccessPoints = (oldMetadata.additionalAccessPoints || []).concat(newAccessPoints);
  return { ...oldMetadata, additionalAccessPoints };
}

function linkFor(fourfour, name, category = 'dataset') {
  const location = document.location;
  const path = `/${category}/${name}/${fourfour}`;
  return encodeURI(`${location.protocol}//${location.hostname}${path}`);
}

function accessPointFor(viewInfo, isParent) {
  const name = viewInfo.name;
  if (isParent) {
    return {
      urls: { [name]: linkFor(viewInfo.id, name, viewInfo.category) },
      title: 'Associated with',
      uid: viewInfo.id
    };
  } else {
    return {
      urls: { dataset: linkFor(viewInfo.id, name, viewInfo.category) },
      title: name,
      description: viewInfo.description,
      uid: viewInfo.id
    };
  }
}

// when you update the parent on a child, need to reflect that change on the old parent
function removeChildFromParent(oldParentUid, childUidToRemove) {
  getView(oldParentUid).then(parentView => {
    // TODO: handle top-level accessPoint
    if (parentView.metadata && parentView.metadata.additionalAccessPoints) {
      const filteredAccessPoints = _.filter(parentView.metadata.additionalAccessPoints, href =>
        href.uid !== childUidToRemove
      );

      if (filteredAccessPoints.length !== parentView.metadata.additionalAccessPoints.length) {
        putMetadata(parentView.id, { ...parentView.metadata, additionalAccessPoints: filteredAccessPoints });
      }
    }
  });
}

function getParentUid(childRevision) {
  if (childRevision.metadata.metadata && childRevision.metadata.metadata.additionalAccessPoints) {
    const accessPoints = childRevision.metadata.metadata.additionalAccessPoints;
    return _.find(accessPoints, href => !!href.uid).uid;
  }
}

function parentHasChild(parentView, childUid) {
  if (parentView.metadata && parentView.metadata.additionalAccessPoints) {
    return _.some(parentView.metadata.additionalAccessPoints, (href) => href.uid === childUid);
  }
  return false;
}
