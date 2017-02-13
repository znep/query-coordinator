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
      expect(_.find(view.columns, ['fieldName', 'cnidarian_age'])).to.exist;
      expect(_.find(props.columns, ['fieldName', 'cnidarian_age'])).to.not.exist;
    });

    it('returns calendar_date columns', () => {
      expect(_.find(view.columns, ['fieldName', 'marsupial_birthday'])).to.exist;
    });

    it('omits photo column types', () => {
      expect(_.find(view.columns, ['dataTypeName', 'photo'])).to.exist;
      expect(_.find(props.columns, ['dataTypeName', 'photo'])).to.not.exist;
    });

    it('omits point column types', () => {
      expect(_.find(view.columns, ['dataTypeName', 'point'])).to.exist;
      expect(_.find(props.columns, ['dataTypeName', 'point'])).to.not.exist;
    });

    it('omits location subcolumns', () => {
      expect(_.find(props.columns, ['fieldName', 'marsupial_location_state'])).to.not.exist;
      expect(_.find(props.columns, ['fieldName', 'marsupial_location_city'])).to.not.exist;
      expect(_.find(props.columns, ['fieldName', 'marsupial_location_zip'])).to.not.exist;
    });

    it('omits url subcolumns', () => {
      expect(_.find(props.columns, ['fieldName', 'marsupial_website_description'])).to.not.exist;
    });

    it('omits phone subcolumns', () => {
      expect(_.find(props.columns, ['fieldName', 'marsupial_phone_type'])).to.not.exist;
    });

    it('omits internal columns', () => {
      expect(_.find(view.columns, ['fieldName', ':internal_column'])).to.exist;
      expect(_.find(props.columns, ['fieldName', ':internal_column'])).to.not.exist;
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

    it('returns a function to fetch suggestions', () => {
      expect(props.fetchSuggestions).to.be.a('function');
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
      expect(spy).to.have.been.calledWith(setFilters(filters));
    });
  });
});
