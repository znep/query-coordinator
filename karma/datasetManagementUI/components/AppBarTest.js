import AppBar from 'components/AppBar';

describe('components/AppBar', () => {

  it('renders without errors', () => {
    const element = renderComponentWithStore(AppBar, {});
    expect(element).to.exist;
  });

});
