import { connect } from 'react-redux';
import _ from 'lodash';
import uuid from 'uuid';
import isURLHelper from 'validator/lib/isURL';
import * as Selectors from 'selectors';
import HrefForm from 'components/HrefForm/HrefForm';
import { updateRevision } from 'reduxStuff/actions/revisions';
import * as FormActions from 'reduxStuff/actions/forms';
import * as FlashActions from 'reduxStuff/actions/flashMessage';

// DATA SHAPING STUFF
function namespaceURLs(href) {
  if (_.isEmpty(href.urls)) {
    // Check if the href saved on the serve was saved with no urls--ie, a url key
    // with the value of {}. If so, create an empty url obj and insert it

    return {
      ...href,
      urls: {
        [uuid()]: {
          url: '',
          filetype: ''
        }
      }
    };
  } else {
    // If not, re-shape the existing urls into a nicer, namespaced format

    return {
      ...href,
      urls: Object.keys(href.urls).reduce(
        (acc, key) => ({
          ...acc,
          [uuid()]: {
            url: href.urls[key],
            filetype: key
          }
        }),
        {}
      )
    };
  }
}

function addHrefIds(href, id) {
  return {
    ...href,
    id
  };
}

const removeEmptyValues = hrefURLObj => _.omitBy(hrefURLObj, val => !val.url);

const makeExtKeys = hrefURLObj =>
  Object.keys(hrefURLObj).reduce((acc, uuident) => {
    const entry = hrefURLObj[uuident];

    return {
      ...acc,
      [entry.filetype]: entry.url
    };
  }, {});

const hrefIsEmpty = href => {
  const hasUrls = !_.isEmpty(href.urls);

  return !(hasUrls || href.title || href.description || href.data_dictionary_type || href.data_dictionary);
};

const shapeHrefState = rawState =>
  rawState
    .map(href => ({
      ...href,
      urls: makeExtKeys(removeEmptyValues(href.urls))
    }))
    .filter(href => !hrefIsEmpty(href));

// FORM DATA VALIDATORS
const findDupes = hrefURLObj => {
  const filetypes = Object.values(hrefURLObj)
    .map(val => val.filetype)
    .filter(ft => ft);

  const dupes = filetypes.filter(filetype => {
    const firstIdx = _.findIndex(filetypes, ft => ft === filetype);
    const withCurrentOmitted = filetypes.filter((ft, idx) => firstIdx !== idx);
    return withCurrentOmitted.includes(filetype);
  });

  return [...new Set(dupes)];
};

const findInvalidURLs = hrefURLObj => {
  const urls = Object.values(hrefURLObj)
    .map(val => val.url)
    .filter(url => !!url);

  return urls.filter(url => !isURLHelper(url, { require_protocol: true }));
};

const findEmpties = (href, hrefURLObj) =>
  _.map(hrefURLObj, (val, uuident) => {
    if (val.url && !val.filetype) {
      return { hrefId: href.id, id: uuident };
    } else {
      return null;
    }
  });

export const validate = hrefs => {
  const dupes = _.chain(hrefs)
    .map(href => ({ hrefId: href.id, dupes: findDupes(href.urls) }))
    .filter(err => err.dupes.length)
    .map(err => new DuplicateFiletypeError(err.dupes, err.id))
    .value();

  const badUrls = _.chain(hrefs)
    .flatMap(href => findInvalidURLs(href.urls))
    .thru(urls => (urls.length ? [new UrlError(urls)] : []))
    .value();

  const empties = _.chain(hrefs)
    .flatMap(href => findEmpties(href, href.urls))
    .filter(err => err)
    .map(err => new EmptyError(err.id, err.hrefId))
    .value();

  return [...dupes, ...badUrls, ...empties];
};

// FORM ERROR TYPES
function DuplicateFiletypeError(dupes, hrefId) {
  this.name = 'DuplicateFiletypeError';
  this.dupes = dupes;
  this.hrefId = hrefId;
}

DuplicateFiletypeError.prototype = new Error();

function UrlError(urls) {
  this.name = 'UrlError';
  this.urls = urls;
}

UrlError.protoType = new Error();

function EmptyError(id, hrefId) {
  this.name = 'EmptyError';
  this.id = id;
  this.hrefId = hrefId;
}

EmptyError.prototype = new Error();

// CONTAINER COMPONENT
const mapStateStateToProps = ({ entities, ui }, { params }) => {
  const revision = Selectors.currentRevision(entities, _.toNumber(params.revisionSeq));

  let hrefs = [];
  let revisionId = null;

  if (revision && revision.href && Array.isArray(revision.href)) {
    hrefs = revision.href;
    revisionId = revision.id;
  }

  return {
    hrefs: hrefs.map(namespaceURLs).map((href, idx) => addHrefIds(href, idx + 1)),
    shouldSave: ui.forms.hrefForm.shouldSave,
    schemaExists: !!revision.output_schema_id,
    blobExists: !!revision.blob_id,
    revisionId
  };
};

const mergeProps = (stateProps, { dispatch }, ownProps) => ({
  hrefs: stateProps.hrefs,
  schemaExists: stateProps.schemaExists,
  blobExists: stateProps.blobExists,
  shouldSave: stateProps.shouldSave,
  markFormDirty: () => dispatch(FormActions.markFormDirty('hrefForm')),
  markFormClean: () => dispatch(FormActions.markFormClean('hrefForm')),
  toggleShouldSaveOff: () => dispatch(FormActions.setShouldFormSave('hrefForm', false)),
  setFormErrors: errors => dispatch(FormActions.setFormErrors('hrefForm', errors)),
  showFlash: (type, msg) => dispatch(FlashActions.showFlashMessage(type, msg)),
  clearFlash: () => dispatch(FlashActions.hideFlashMessage()),
  saveHrefs: hrefs => {
    const serverHrefs = { href: shapeHrefState(hrefs) };

    return dispatch(updateRevision(serverHrefs, ownProps.params)).catch(err =>
      err.response.json().then(({ message, params }) => {
        if (!message || !params) {
          return;
        }

        const errs = _.chain(params.href)
          .filter(href => !_.isEmpty(href))
          .flatMap(href => href.urls)
          .value();

        throw new UrlError(errs);
      })
    );
  },
  ...ownProps
});

export default connect(mapStateStateToProps, null, mergeProps)(HrefForm);
