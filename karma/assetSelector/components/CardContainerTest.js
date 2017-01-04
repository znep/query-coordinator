import { CardContainer } from 'components/CardContainer';

describe('components/CardContainer', function() {
  function defaultProps() {
    return {
      results: []
    };
  }

  function getProps(props = {}) {
    return Object.assign({}, defaultProps(), props);
  }

  it('renders', function() {
    var element = renderPureComponent(CardContainer(getProps()));
    expect(element).to.exist;
    expect(element.className).to.match(/card-container/);
  });
});
