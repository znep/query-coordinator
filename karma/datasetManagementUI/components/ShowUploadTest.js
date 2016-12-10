import ShowUpload from 'components/ShowUpload';

describe('components/ShowUpload', () => {

  it('renders without errors', () => {
    const element = renderComponentWithStore(ShowUpload, { params: { uploadId: 5 } });
    expect(element).to.exist;
  });

});
