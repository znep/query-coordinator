import { connect } from 'react-redux';
import _ from 'lodash';
import uuid from 'uuid';
import isURLHelper from 'validator/lib/isURL';
import * as Selectors from 'selectors';
import HrefForm from 'components/HrefForm/HrefForm';
import { updateRevision, editRevision } from 'reduxStuff/actions/revisions';
import * as FormActions from 'reduxStuff/actions/forms';
import * as FlashActions from 'reduxStuff/actions/flashMessage';

// CONSTANTS
const FORM_NAME = 'hrefForm';

// DATA SHAPING STUFF
function namespaceURLs(href) {
  // Check if the href saved on the server was saved with no urls--ie, a url key
  // with the value of {}. If so, create an empty url obj and insert it
  if (_.isEmpty(href.urls)) {
    return {
      ...href,
      urls: {
        [uuid()]: {
          url: '',
          filetype: ''
        }
      }
    };
    // If not, re-shape the existing urls into a nicer, namespaced format
  } else {
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
  const filetypes = _.values(hrefURLObj)
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
  const urls = _.values(hrefURLObj)
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
    .map(err => new DuplicateExtension(err.dupes, err.hrefId))
    .value();

  const badUrls = _.chain(hrefs)
    .flatMap(href => findInvalidURLs(href.urls))
    .thru(urls => (urls.length ? [new BadUrl(urls)] : []))
    .value();

  const empties = _.chain(hrefs)
    .flatMap(href => findEmpties(href, href.urls))
    .filter(err => err)
    .map(err => new MissingValue(err.id, err.hrefId))
    .value();

  return [...dupes, ...badUrls, ...empties];
};

// FORM ERROR TYPES
// DuplicateExtension :: [ String ] Int ->
//  { name : String, extensions : [ String ], hrefId : Int }
// example: DuplicateExtension(['csv', 'txt'], 7)
export function DuplicateExtension(extensions, hrefId) {
  this.name = 'DuplicateExtension';
  this.extensions = extensions;
  this.hrefId = hrefId;
}

// BadUrl :: [ String ] -> { name : String, urls : [ String ] }
// example: BadUrl(['ww.not-valid-url.com', 'www.another-bad-one'])
export function BadUrl(urls) {
  this.name = 'BadUrl';
  this.urls = urls;
}

// MissingValue :: String -> Int -> { name : String, urlId : String, hrefId : Int }
// A dataset can have many hrefs
// An href can have many urls
// hrefId refers to the href in which the requried value is missing
// urlId refers to the url inside the href in which the required value is missing
// example: MissingValue('478c91d4-783f-49a7-8d38-b6900116bda8', 8)
export function MissingValue(urlId, hrefId) {
  this.name = 'MissingValue';
  this.urlId = urlId;
  this.hrefId = hrefId;
}

// HrefError = MissingValue | BadUrl | DuplicateExtension
// FormValidationError :: String -> [ HrefError ] ->
//   { name : String, message : String, errors : [ HrefError ] }
export function FormValidationError(formName, errors) {
  this.name = 'FormValidationError';
  this.formName = formName;
  this.message = `Validation of ${formName} failed`;
  this.errors = errors;
}

FormValidationError.prototype = new Error();

// CONTAINER COMPONENT
const mapStateToProps = ({ entities, ui }, { params }) => {
  const revision = Selectors.currentRevision(entities, _.toNumber(params.revisionSeq));

  let hrefs = [];

  if (revision && revision.href && Array.isArray(revision.href)) {
    hrefs = revision.href;
  }

  return {
    hrefs: hrefs.map(namespaceURLs).map((href, idx) => addHrefIds(href, idx + 1)),
    shouldExit: ui.forms.hrefForm.shouldExit,
    schemaExists: !!revision.output_schema_id,
    blobExists: !!revision.blob_id
  };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  markFormDirty: () => dispatch(FormActions.markFormDirty(FORM_NAME)),
  markFormClean: () => dispatch(FormActions.markFormClean(FORM_NAME)),
  setFormErrors: errors => dispatch(FormActions.setFormErrors(FORM_NAME, errors)),
  showFlash: (type, msg) => dispatch(FlashActions.showFlashMessage(type, msg)),
  clearFlash: () => dispatch(FlashActions.hideFlashMessage()),
  validateAndSaveHrefs: hrefs => {
    const errors = validate(hrefs);

    if (errors.length) {
      return Promise.reject(new FormValidationError(FORM_NAME, errors));
    }

    const serverHrefs = { href: shapeHrefState(hrefs) };

    return dispatch(updateRevision(serverHrefs, ownProps.params))
      .then(resp => dispatch(editRevision(resp.resource.id, { href: resp.resource.href })))
      .catch(err =>
        err.response.json().then(({ params }) => {
          if (!params) {
            return;
          }

          const badURLs = _.chain(params.href)
            .filter(href => !_.isEmpty(href))
            .flatMap(href => href.urls)
            .value();

          throw new FormValidationError(FORM_NAME, [new BadUrl(badURLs)]);
        })
      );
  },
  ...ownProps
});

export default connect(mapStateToProps, mapDispatchToProps)(HrefForm);
