import sinon from 'sinon';
import { expect, assert } from 'chai';
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
      expect(_.isArray(props.columns)).to.equal(true);
    });

    it('omits number columns without column stats', () => {
      assert.ok(_.find(view.columns, ['fieldName', 'cnidarian_age']));
      assert.notOk(_.find(props.columns, ['fieldName', 'cnidarian_age']));
    });

    it('returns calendar_date columns', () => {
      assert.ok(_.find(view.columns, ['fieldName', 'marsupial_birthday']));
    });

    it('omits photo column types', () => {
      assert.ok(_.find(view.columns, ['dataTypeName', 'photo']));
      assert.notOk(_.find(props.columns, ['dataTypeName', 'photo']));
    });

    it('omits point column types', () => {
      assert.ok(_.find(view.columns, ['dataTypeName', 'point']));
      assert.notOk(_.find(props.columns, ['dataTypeName', 'point']));
    });

    it('omits location subcolumns', () => {
      assert.notOk(_.find(props.columns, ['fieldName', 'marsupial_location_state']));
      assert.notOk(_.find(props.columns, ['fieldName', 'marsupial_location_city']));
      assert.notOk(_.find(props.columns, ['fieldName', 'marsupial_location_zip']));
    });

    it('omits url subcolumns', () => {
      assert.notOk(_.find(props.columns, ['fieldName', 'marsupial_website_description']));
    });

    it('omits phone subcolumns', () => {
      assert.notOk(_.find(props.columns, ['fieldName', 'marsupial_phone_type']));
    });

    it('omits internal columns', () => {
      assert.ok(_.find(view.columns, ['fieldName', ':internal_column']));
      assert.notOk(_.find(props.columns, ['fieldName', ':internal_column']));
    });

    it('returns filters', () => {
      expect(props.filters).to.deep.equal(filters);
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
      expect(props.filters.length).to.equal(1);
      expect(props.filters[0]).to.deep.equal(filter);
    });

    it('returns a function to valid text filter values', () => {
      expect(props.isValidTextFilterColumnValue).to.be.a('function');
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
