import { TableContainer } from 'components/TableContainer';

describe('components/TableContainer', function() {
  function defaultProps() {
    return {
      results: []
    };
  }

  function getProps(props = {}) {
    return Object.assign({}, defaultProps(), props);
  }

  // TODO: more useful tests once the table container is fleshed out
  it('renders', function() {
    var element = renderPureComponent(TableContainer(getProps()));
    expect(element).to.exist;
    expect(element.className).to.match(/table-container/);
  });
});
