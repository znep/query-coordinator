import ManageUploads from 'components/ManageUploads';

describe('components/ManageUploads', () => {

  it('renders without errors', () => {
    const element = renderComponentWithStore(ManageUploads, {});
    expect(element).to.exist;
  });

});
