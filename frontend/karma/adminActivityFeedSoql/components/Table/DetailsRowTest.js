import _ from 'lodash';
import { assert } from 'chai';

import DetailsRow from 'components/Table/DetailsRow';
import mockData from '../../data/mockFetchTable';
import mockTranslations from '../../mockTranslations';

describe('Table/DetailsRow', () => {
  const activity = mockData[3];
  const details = JSON.parse(activity.details);

  const element = renderComponentWithLocalization(DetailsRow, { activity });

  it('renders type', () => {
    const actual = element.querySelector('.type').textContent;
    const expected = `${mockTranslations.type}: ${details.method}`;

    assert.equal(actual, expected);
  });

  it('renders filename', () => {
    const actual = element.querySelector('.filename').textContent;
    const expected = `${mockTranslations.filename}: ${details.fileName}`;

    assert.equal(actual, expected);
  });

  it('renders import method', () => {
    const actual = element.querySelector('.import-method').textContent;
    const expected = `${mockTranslations.import_method}: ${mockTranslations.services[activity.service]}`;

    assert.equal(actual, expected);
  });

  it('renders title', () => {
    const actual = element.querySelector('.title').textContent;
    const expected = mockTranslations.event_messages[_.snakeCase(details.status)][details.eventType.replace(/-/g, '_')].title;

    assert.equal(actual, expected);
  });
});
