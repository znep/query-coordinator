import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';

import { updateQueryString } from 'actions/query_string';

describe('actions/query_string', () => {
  describe('updateQueryString', () => {
    const baseUrl = `${location.protocol}//${location.host}${location.pathname}`;
    let historyStub;

    beforeEach(() => {
      historyStub = sinon.stub(window.history, 'pushState');
    });

    afterEach(() => {
      historyStub.restore()
    });

    it('returns an empty query string when getState is empty', () => {
      const getState = () => ({});

      updateQueryString({ getState });

      const expectedUrl = `${baseUrl}?`;
      sinon.assert.calledWith(historyStub, { path: expectedUrl }, '', expectedUrl);
    });

    it('returns an empty query string when there are no filters, ordering, or paging present', () => {
      const getState = () => ({
        catalog: {
          order: null,
          pageNumber: 1
        },
        filters: {
          assetTypes: null,
          authority: null,
          category: null,
          ownedBy: null,
          q: null,
          tag: null,
          visibility: null
        }
      });

      updateQueryString({ getState });

      const expectedUrl = `${baseUrl}?`;
      sinon.assert.calledWith(historyStub, { path: expectedUrl }, '', expectedUrl);
    });

    it('returns a query string populated with values when there are filters present', () => {
      const getState = () => ({
        catalog: {
          order: null,
          pageNumber: 1
        },
        filters: {
          assetTypes: 'charts',
          authority: 'official',
          category: 'Paint',
          ownedBy: {
            displayName: 'bobross',
            id: 'abcd-1234'
          },
          q: 'paint',
          tag: 'painting',
          visibility: 'open'
        }
      });

      updateQueryString({ getState });

      const expectedUrl = `${baseUrl}?assetTypes=charts&authority=official&category=Paint&q=paint&tag=painting&visibility=open&ownerId=abcd-1234&ownerName=bobross`;
      sinon.assert.calledWith(historyStub, { path: expectedUrl }, '', expectedUrl);
    });

    it('returns a query string populated with values when there is ordering and paging present', () => {
      const getState = () => ({
        catalog: {
          order: {
            ascending: true,
            value: 'testColumn'
          },
          pageNumber: 23
        },
        filters: {
          assetTypes: null,
          authority: null,
          category: null,
          ownedBy: null,
          q: null,
          tag: null,
          visibility: null
        }
      });

      updateQueryString({ getState });

      const expectedUrl = `${baseUrl}?page=23&orderColumn=testColumn&orderDirection=asc`;
      sinon.assert.calledWith(historyStub, { path: expectedUrl }, '', expectedUrl);
    });

  });

});
