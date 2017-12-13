import { assert } from 'chai';
import * as queryBuilder from 'lib/queryBuilder';
import mockQuery from '../data/mockQuery';

describe.only('lib/queryBuilder', () => {

  describe('.buildSelectClause', () => {
    it('incorrect argument', () => {
      const actual = queryBuilder.buildSelectClause(10);

      assert.isNull(actual);
    });

    it('correct usage single column', () => {
      const actual = queryBuilder.buildSelectClause('column1');

      assert.equal(actual, mockQuery.select_single);
    });

    it('correct usage multiple column', () => {
      const actual = queryBuilder.buildSelectClause(['column1','column2','column3']);

      assert.equal(actual, mockQuery.select_multi);
    });
  });

  it('.buildOffsetClause', () => {
    const actual = queryBuilder.buildOffsetClause(10);

    assert.equal(actual, mockQuery.offset);
  });

  it('.buildLimitClause', () => {
    const actual = queryBuilder.buildLimitClause(50);

    assert.equal(actual, mockQuery.limit);
  });

  it('.buildOrderClause', () => {
    const expected = '$order=date%20desc';
    const actual = queryBuilder.
      buildOrderClause({ column: 'date', direction: 'desc'});

    assert.equal(actual, expected);
  });

  describe('.buildWhereClause', () => {
    const filterWithActiveTabFailure = {
      activeTab: 'failure'
    };

    const filterWithActiveTabDeleted = {
      activeTab: 'deleted'
    };

    const filterWithAssetType = {
      assetType: 'dataset'
    };

    const filterWithEventOrdinary = {
      event: 'AssetMetadataChanged'
    };

    const filterWithEventUpdate = {
      event: 'DataUpdate.Failure'
    };

    const filterWithDate = {
      date: {
        start: '2016-01-01',
        end: '2017-12-12'
      }
    };

    it('returns null with no filters', () => {
      const actual = queryBuilder.buildWhereClause({});

      assert.isNull(actual);
    });

    it('> activeTab > failure', () => {
      const actual = queryBuilder.buildWhereClause(filterWithActiveTabFailure);

      assert.equal(actual, '$where=' + mockQuery.filter.activeTabFailure);
    });

    it('> activeTab > deleted', () => {
      const actual = queryBuilder.buildWhereClause(filterWithActiveTabDeleted);

      assert.equal(actual, '$where=' + mockQuery.filter.activeTabDeleted);
    });

    it('> asset type', () => {
      const actual = queryBuilder.buildWhereClause(filterWithAssetType);

      assert.equal(actual, '$where=' + mockQuery.filter.assetType);
    });

    it('> ordinary event', () => {
      const actual = queryBuilder.buildWhereClause(filterWithEventOrdinary);

      assert.equal(actual, '$where=' + mockQuery.filter.ordinaryEvent);
    });

    it('> update event', () => {
      const actual = queryBuilder.buildWhereClause(filterWithEventUpdate);

      assert.equal(actual, '$where=' + mockQuery.filter.updateEvent);
    });

    it('> date range', () => {
      const actual = queryBuilder.buildWhereClause(filterWithDate);

      assert.equal(actual, '$where=' + mockQuery.filter.date);
    });

    it('> all types at once', () => {
      const filters = Object.assign({}, filterWithActiveTabFailure, filterWithAssetType,
        filterWithEventUpdate, filterWithDate);

      const actual = queryBuilder.buildWhereClause(filters);
      const expected = mockQuery.filter.activeTabFailure + '%20and%20' + mockQuery.filter.assetType +
        '%20and%20' + mockQuery.filter.updateEvent + '%20and%20' + mockQuery.filter.date;

      assert.equal(actual, '$where=' + expected);
    });
  });
});
