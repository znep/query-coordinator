// 11/28/2017
// This is not the droid you're looking for.
//
// Unless you are solving a ticket for USAID or (by some miracle) are here to delete
// this code, you probably don't need to read this.
//
// Here lies the javascript to make what passes for a collection for USAID.
// Associating a child to a parent means adding the child as an external link to an HREF dataset
// representing the collection. It also means adding a piece of href-like metadata to
// the child, which points to the parent. If this were a full feature we would likely
// be implementing it in a different way, through an API call that worked in a trasnactional way.
// Because this is not a fully implemented feature, we've chosen to avoid writing
// new APIs specific to this, and done it this way.
//
// sorry friends
// -- Cate

import _ from 'lodash';
import 'whatwg-fetch';

// copied from dsmui/lib/http
const defaultFetchOptions = {
  credentials: 'same-origin',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};

const headersForWrites = {
  'X-CSRF-Token': window.serverConfig.csrfToken,
  'X-App-Token': window.serverConfig.appToken
};

function socrataFetch(path, options = {}) {
  // only need to add in authenticityToken for non-GET requests
  const mergedBasic = _.merge(options, defaultFetchOptions);
  const mergedForWrites = (!_.isUndefined(options.method) && options.method.toUpperCase() !== 'GET') ?
    _.merge(mergedBasic, { headers: headersForWrites }) :
    mergedBasic;
  return fetch(path, mergedForWrites);
}

// Used to throw errors from non-200 responses when using fetch.
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  const error = new Error(response.statusText);
  error.response = response;
  throw error;
}

function getJson(resp) {
  if (resp) {
    return resp.json();
  } else {
    return resp;
  }
}
// end copied stuff


export function getView(fourfour) {
  return socrataFetch(`/api/views/${fourfour}`).
    then(checkStatus).
    then(getJson);
}

export function putMetadata(fourfour, metadata) {
  return socrataFetch(`/api/views/${fourfour}`, {
    method: 'PUT',
    body: JSON.stringify({ metadata })
  }).then(checkStatus).then(getJson);
}

export function mergeNewAccessPoint(view, newAccessPoint) {
  const oldMetadata = view.metadata || {};
  const currentAccessPoints = oldMetadata.additionalAccessPoints || [];
  const filteredAccessPoints = _.filter(currentAccessPoints, (point) => point.uid !== newAccessPoint.uid);
  const additionalAccessPoints = filteredAccessPoints.concat(newAccessPoint);
  return { ...oldMetadata, additionalAccessPoints };
}

function linkFor(fourfour, name, category) {
  const location = document.location;
  const path = `/${category || 'dataset'}/${name}/${fourfour}`;
  return encodeURI(`${location.protocol}//${location.hostname}${path}`);
}

function nameForChild(viewInfo) {
  const accessLvl = _.get(viewInfo, ['metadata', 'custom_fields', 'Proposed Access Level', 'Proposed Access Level']);
  if (accessLvl === 'Restricted Public' || accessLvl === 'Private') {
    return `${viewInfo.name} (Restricted)`;
  } else {
    return viewInfo.name;
  }
}

export function accessPointFor(viewInfo, isParent) {
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
      title: nameForChild(viewInfo),
      description: viewInfo.description,
      uid: viewInfo.id
    };
  }
}

// when you update the parent on a child, need to reflect that change on the old parent
export function removeChildFromParent(oldParentUid, childUidToRemove) {
  getView(oldParentUid).then(parentView => {
    // TODO: handle top-level accessPoint
    if (parentView.metadata && parentView.metadata.additionalAccessPoints) {
      const filteredAdditionalAccessPoints = _.filter(parentView.metadata.additionalAccessPoints, href =>
        href.uid !== childUidToRemove
      );

      if (filteredAdditionalAccessPoints.length !== parentView.metadata.additionalAccessPoints.length) {
        putMetadata(parentView.id, { ...parentView.metadata, additionalAccessPoints: filteredAdditionalAccessPoints });
      }
    }
  }).catch(err => {
    if (_.isEmpty(err.response) || err.response.status !== 404) {
      // if we 404'd getting the view, its probably been deleted and we don't care about updating it
      throw err;
    }
  });
}

export function getParentUid(childRevision) {
  if (childRevision.metadata && childRevision.metadata.additionalAccessPoints) {
    const accessPoints = childRevision.metadata.additionalAccessPoints;
    return _.find(accessPoints, href => !!href.uid).uid;
  }
}

export function parentHasAccessPoint(parentView, accessPoint) {
  if (parentView.metadata && parentView.metadata.additionalAccessPoints) {
    return _.some(parentView.metadata.additionalAccessPoints, (point) => {
      return point.uid === accessPoint.uid && point.title === accessPoint.title && point.urls.dataset === accessPoint.urls.dataset;
    });
  }
  return false;
}
