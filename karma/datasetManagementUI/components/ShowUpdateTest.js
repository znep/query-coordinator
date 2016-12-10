import ShowUpdate from 'components/ShowUpdate';

describe('components/ShowUpdate', () => {

  it('renders without errors', () => {
    const element = renderComponentWithStore(ShowUpdate, {});
    expect(element).to.exist;
  });

});
