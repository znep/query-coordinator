/* eslint new-cap: 0 */
import daggy from 'lib/daggy';
import _ from 'lodash';

const Failure = daggy.taggedSum('Failure', {
  BadEmail: ['details'],
  BadURL: ['details'],
  BadLicense: ['details'],
  BadCategory: ['details'],
  UnknownField: ['details'],
  MissingAttribution: ['details'],
  MissingRequired: ['details'],
  Unknown: []
});

const missingRequired = msg => /cannot be empty/gi.test(msg);

const missingAttribution = msg => /attribution be specified/gi.test(msg);

const badURL = msg => /not a valid url/gi.test(msg);

const badLicense = msg => /not a valid license/gi.test(msg);

const badEmail = msg => /must be a valid email/gi.test(msg);

const badCategory = msg => {
  const isInvalid = /is invalid/gi;

  if (_.isPlainObject(msg) && _.hasIn(msg, 'metadata.category') && isInvalid.test(msg.metadata.category)) {
    return true;
  } else {
    return false;
  }
};

const getRequiredFieldname = msg => /(validation failed:)(\s+View\.)(\w+)/gi.exec(msg)[3];

export const classify = msg => {
  let failure;

  if (missingRequired(msg)) {
    const fieldName = getRequiredFieldname(msg);
    // for now name is the only non-custom required field, but if that changes,
    // we need to figure out a way of getting the fieldset name; here it's just
    // hardcoded
    failure = Failure.MissingRequired({
      fieldName,
      fieldset: I18n.metadata_manage.dataset_tab.titles.dataset_title
    });
  } else if (missingAttribution(msg)) {
    failure = Failure.MissingAttribution({
      fieldName: 'attribution',
      fieldset: I18n.metadata_manage.dataset_tab.titles.licenses_title
    });
  } else if (badURL(msg)) {
    failure = Failure.BadURL({
      fieldName: 'attributionLink',
      fieldset: I18n.metadata_manage.dataset_tab.titles.licenses_title
    });
  } else if (badLicense(msg)) {
    failure = Failure.BadLicense({
      fieldName: 'licenseId',
      fieldset: I18n.metadata_manage.dataset_tab.titles.licenses_title
    });
  } else if (badEmail(msg)) {
    failure = Failure.BadEmail({
      fieldName: 'contactEmail',
      fieldset: I18n.metadata_manage.dataset_tab.titles.contact_title
    });
  } else if (badCategory(msg)) {
    failure = Failure.BadCategory({
      fieldName: 'categories',
      fieldset: I18n.metadata_manage.dataset_tab.titles.tags_title
    });
  } else {
    failure = Failure.Unknown;
  }

  return failure;
};

// const err = classify(reason);
//
// err.cata({
//   BadURL: x => console.log('hey', x),
//   Unknown: () => console.long('hmm')
// });
