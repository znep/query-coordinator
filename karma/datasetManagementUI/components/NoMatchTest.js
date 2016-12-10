import NoMatch from 'components/NoMatch';

describe('components/NoMatch', () => {

  it('renders without errors', () => {
    const element = renderComponentWithStore(NoMatch, {});
    expect(element).to.exist;
  });

});
