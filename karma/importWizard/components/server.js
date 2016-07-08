import React, { PropTypes } from 'react';
import _ from 'lodash';
import TestUtils from 'react-addons-test-utils';

import {
  modelToViewParam,
  customMetadataModelToCoreView,
  licenseToView,
  coreViewToModel,
  transformToImports2Translation,
  update,
  importProgress
} from 'server';

describe('ImportStatus reducer', () => {
  const stateBefore = { type: 'Started' };
  it('adds a notification key when notifications are enabled', () => {
    const stateAfter = update(stateBefore, importProgress({rowsImported: 0}, true));
    expect(stateAfter).to.deep.equal({
      type: 'InProgress',
      progress: { rowsImported: 0 },
      notification: 'Available'
    });
  });

  it('does not add a notification key when notifications are not enabled', () => {
    const stateAfter = update(stateBefore, importProgress({rowsImported: 0}));
    expect(stateAfter).to.deep.equal({
      type: 'InProgress',
      progress: { rowsImported: 0 }
    });
  });

});

describe("testing for API responses", () => {
  const metadata = {
    license: {
      licenseId: "PDDL",
      licenseName: "Open Data Commons",
      licensing: "Public Domain Dedication and License",
      provider: "Me",
      sourceLink: "google.com"
    },
    contents: {
      name: 'name',
      description: 'desc',
      category: 'cat',
      tags: ['one', 'two'],
      rowLabel: 'row',
      attributionLink: 'link',
      contactEmail: 'email@email.com',
      privacySettings: 'private',
      customMetadata: {
        'jack':
          [
            {
              field: '1',
              value: 'ant',
              privateField: false
            },
            {
              field: '2',
              value: 'frank',
              privateField: true
            },
            {
              field: '3',
              value: 'fred',
              privateField: false
            }
          ],
        'second':
          [
            {
              field: 'mars',
              value: 'mars',
              privateField: false
            },
            {
              field: 'venus',
              value: 'earth',
              privateField: false
            },
            {
              field: 'neptune',
              value: '50',
              privateField: false
            },
            {
              field: 'jupiter',
              value: 'eritrea',
              privateField: false
            }
          ]
        }
    }
  };

  describe('privacyCustomMetadata', () => {
    const customMetadata = metadata.contents.customMetadata;

    it('test that public metadata values are correctly returned', () => {
      const publicCustom = customMetadataModelToCoreView(customMetadata, false);

      expect(publicCustom).to.deep.equal({
        jack: {
          '1': 'ant',
          '3': 'fred'
        },
        second: {
          mars: 'mars',
          venus: 'earth',
          neptune: '50',
          jupiter: 'eritrea'
        }
      });
    });

    it('test that private metadata values are correctly returned', () => {
      const privateCustom = customMetadataModelToCoreView(customMetadata, true);
      const jack = privateCustom.jack;
      const second = privateCustom.second;

      expect(jack['2']).to.equal('frank');
      expect(second).to.deep.equal({});
    });
  });

  describe('licenseToView', () => {
    it('test that license values are correctly returned', () => {
      const license = licenseToView(metadata.license);

      expect(license).to.deep.equal({
        name: 'Open Data Commons Public Domain Dedication and License',
        termsLink: "http://opendatacommons.org/licenses/pddl/1.0/",
        logoUrl: ''
      });
    });
  });

  describe('modelToViewParam', () => {
    it('test everything else', () => {
      const coreView = modelToViewParam(metadata);
      const viewMetadata = coreView.metadata;

      expect(coreView.name).to.equal('name');
      expect(coreView.description).to.equal('desc');
      expect(coreView.category).to.equal('cat');
      expect(coreView.tags).to.deep.equal(['one', 'two']);
      expect(viewMetadata.rowLabel).to.equal('row');
      expect(viewMetadata.attributionLink).to.equal('link');
      expect(coreView.privateMetadata.contactEmail).to.equal('email@email.com');
      expect(coreView.attribution).to.equal('Me');
      expect(coreView.attributionLink).to.equal('google.com');
      expect(coreView.licenseId).to.equal('PDDL');
    });
  });

  describe('coreViewToModel', () => {
    it('test round trip', () => {
      const view = modelToViewParam(metadata);
      const meta = coreViewToModel(view);

      expect(metadata.contents).to.deep.equal(meta.contents);
    });
  });

});

describe('server.js testing', () => {

  describe('basic blueprint generation', () => {
    const transform = JSON.parse('[{"sourceColumn":{"name":"user_id","processed":3,"suggestion":"number","types":{"number":3,"text":3,"calendar_date":3,"money":3,"percent":3},"index":0},"name":"user_id","chosenType":"number","transforms":[],"showColumnTransforms":true},{"sourceColumn":{"name":"first","processed":3,"suggestion":"number","types":{"number":3,"text":3,"calendar_date":3,"money":3,"percent":3},"index":1},"name":"first","chosenType":"number","transforms":[]},{"sourceColumn":{"name":"second","processed":3,"suggestion":"text","types":{"number":0,"text":3,"calendar_date":0,"money":0,"percent":0},"index":2},"name":"second","chosenType":"text","transforms":[]},{"sourceColumn":{"name":"third","processed":3,"suggestion":"number","types":{"number":3,"text":3,"calendar_date":3,"money":3,"percent":3},"index":3},"name":"third","chosenType":"number","transforms":[]},{"sourceColumn":{"name":"fourth","processed":3,"suggestion":"text","types":{"number":0,"text":3,"calendar_date":0,"money":0,"percent":0},"index":4},"name":"fourth","chosenType":"text","transforms":[]}]');
    const result = transformToImports2Translation(transform);
    expect(result).to.equal('[col1,col2,col3,col4,col5]');
  });

  describe('more complicated blueprint generation', () => {
      const transform = JSON.parse('[{"sourceColumn":{"name":"user_id","processed":3,"suggestion":"number","types":{"number":3,"text":3,"calendar_date":3,"money":3,"percent":3},"index":0},"name":"user_id","chosenType":"number","transforms":[{"type":"title"},{"type":"upper"},{"type":"lower"},{"type":"toStateCode"},{"type":"findReplace","findText":"abc","replaceText":"def","caseSensitive":true}],"showColumnTransforms":true},{"sourceColumn":{"name":"first","processed":3,"suggestion":"number","types":{"number":3,"text":3,"calendar_date":3,"money":3,"percent":3},"index":1},"name":"first","chosenType":"number","transforms":[]},{"sourceColumn":{"name":"second","processed":3,"suggestion":"text","types":{"number":0,"text":3,"calendar_date":0,"money":0,"percent":0},"index":2},"name":"second","chosenType":"text","transforms":[]},{"sourceColumn":{"name":"third","processed":3,"suggestion":"number","types":{"number":3,"text":3,"calendar_date":3,"money":3,"percent":3},"index":3},"name":"third","chosenType":"number","transforms":[]},{"sourceColumn":{"name":"fourth","processed":3,"suggestion":"text","types":{"number":0,"text":3,"calendar_date":0,"money":0,"percent":0},"index":4},"name":"fourth","chosenType":"text","transforms":[]}]');
      const result = transformToImports2Translation(transform);
      expect(result).to.equal('[(toStateCode(lower(upper(title(col1))))).replace(/abc/g, "def"),col2,col3,col4,col5]');
  });

});
