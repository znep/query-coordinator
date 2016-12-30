import { TableResult } from 'components/TableResult';

describe('components/TableResult', function() {
  function defaultProps() {
    return {
      name: 'Bob Saget',
      link: 'https://data.bobsaget.gov/d/2345-sdfg',
      type: 'chart',
      updatedAt: '2016-12-15T22:52:12.006Z',
      viewCount: 2
    };
  }

  function getProps(props = {}) {
    return Object.assign({}, defaultProps(), props);
  }

  // TODO: more useful tests once the table element is fleshed out
  it('renders', function() {
    var element = renderPureComponent(TableResult(getProps()));
    expect(element).to.exist;
    expect(element.className).to.match(/result/);
  });
});
