import sinon from 'sinon';
import { assert } from 'chai';
import _ from 'lodash';
import { mapStateToProps, mapDispatchToProps } from 'components/FilterBar';
import parentView from 'data/mockParentView';
import view from 'data/mockView';
import filter from 'data/mockFilter';
import { setFilters } from 'actions';

describe('FilterBar', () => {
  const filters = [filter, filter];
  let props;

  describe('mapStateToProps', () => {
    before(() => {
      props = mapStateToProps({ view, filters, parentView });
    });

    it('returns columns', () => {
      assert.isArray(props.columns);
    });

    it('omits money columns without column stats', () => {
      assert.ok(_.find(view.columns, ['fieldName', 'cnidarian_cost']));
      assert.isNotOk(_.find(props.columns, ['fieldName', 'cnidarian_cost']));
    });

    it('omits number columns without column stats', () => {
      assert.ok(_.find(view.columns, ['fieldName', 'cnidarian_age']));
      assert.isNotOk(_.find(props.columns, ['fieldName', 'cnidarian_age']));
    });

    it('returns calendar_date columns', () => {
      assert.ok(_.find(view.columns, ['fieldName', 'marsupial_birthday']));
    });

    it('omits photo column types', () => {
      assert.ok(_.find(view.columns, ['dataTypeName', 'photo']));
      assert.isNotOk(_.find(props.columns, ['dataTypeName', 'photo']));
    });

    it('omits point column types', () => {
      assert.ok(_.find(view.columns, ['dataTypeName', 'point']));
      assert.isNotOk(_.find(props.columns, ['dataTypeName', 'point']));
    });

    it('omits location subcolumns', () => {
      assert.isNotOk(_.find(props.columns, ['fieldName', 'marsupial_location_state']));
      assert.isNotOk(_.find(props.columns, ['fieldName', 'marsupial_location_city']));
      assert.isNotOk(_.find(props.columns, ['fieldName', 'marsupial_location_zip']));
    });

    // EN-17640: Return, rather than omit URL subcolumns, since we need the data to render
    // OBE-like URL columns using NBE columns
    it('returns url subcolumns', () => {
      assert.ok(_.find(props.columns, ['fieldName', 'marsupial_website_description']));
    });

    it('omits phone subcolumns', () => {
      assert.isNotOk(_.find(props.columns, ['fieldName', 'marsupial_phone_type']));
    });

    it('omits internal columns', () => {
      assert.ok(_.find(view.columns, ['fieldName', ':internal_column']));
      assert.isNotOk(_.find(props.columns, ['fieldName', ':internal_column']));
    });

    it('returns filters', () => {
      assert.deepEqual(props.filters, filters);
    });

    it('omits any undisplayable filters', () => {
      props = mapStateToProps({
        view,
        filters: [
          filter,
          {
            ...filter,
            columnName: 'cnidarian_age'
          }
        ],
        parentView
      });
      assert.equal(props.filters.length, 1);
      assert.deepEqual(props.filters[0], filter);
    });

    it('returns a function to valid text filter values', () => {
      assert.isFunction(props.isValidTextFilterColumnValue);
    });
  });

  describe('mapDispatchToProps', () => {
    let spy;

    before(() => {
      spy = sinon.spy();
      props = mapDispatchToProps(spy);
    });

    it('dispatches setFilters when onUpdate is called', () => {
      props.onUpdate(filters);
      sinon.assert.calledWith(spy, setFilters(filters));
    });
  });
});
