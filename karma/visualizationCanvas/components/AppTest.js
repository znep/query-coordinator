import App from 'App';

describe('App', function() {
  it('renders', function() {
    const element = renderComponentWithStore(App, {});
    expect(element).to.exist;
  });
});
