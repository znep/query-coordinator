import _ from 'lodash';
import { mapStateToProps, mapDispatchToProps } from 'components/FilterBar';
import view from 'data/mockView';
import filter from 'data/mockFilter';
import { setFilters } from 'actions';

describe('FilterBar', () => {
  const filters = [filter, filter];
  let props;

  describe('mapStateToProps', () => {
    before(() => {
      props = mapStateToProps({ view, filters });
    });

    it('returns columns', () => {
      expect(_.isArray(props.columns)).to.equal(true);
    });

    it('omits number columns without column stats', () => {
      expect(_.find(view.columns, ['fieldName', 'cnidarian_age'])).to.exist;
      expect(_.find(props.columns, ['fieldName', 'cnidarian_age'])).to.not.exist;
    });

    it('omits unsupported column types', () => {
      expect(_.find(view.columns, ['dataTypeName', 'photo'])).to.exist;
      expect(_.find(props.columns, ['dataTypeName', 'photo'])).to.not.exist;
    });

    it('returns filters', () => {
      expect(props.filters).to.deep.equal(filters);
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
