import sinon from 'sinon';
import { assert } from 'chai';
import { translatePreviewImageIdToImageUrl } from 'common/helpers/viewCardHelpers';

describe('translatePreviewImageIdToImageUrl', () => {
  beforeEach(() => {
    window.initialState = {view: {id: 'four-four'}};
  });

  it('returns the correct URL when previewImageId is a blob id', () => {
    assert.equal(
      translatePreviewImageIdToImageUrl('c6d60ec7-0961-4629-b86a-fb96925d1ccc'),
      '/api/views/four-four/files/c6d60ec7-0961-4629-b86a-fb96925d1ccc'
    );
  });
  it('returns the correct URL when previewImageId is an HTTPS URL', () => {
    assert.equal(
      translatePreviewImageIdToImageUrl('https://www.foo.com/image'),
      'https://www.foo.com/image'
    );
  });
  it('returns the correct URL when previewImageId is a DATA URL', () => {
    assert.equal(
      translatePreviewImageIdToImageUrl('data:some_base64_encoded_image_data'),
      'data:some_base64_encoded_image_data'
    );  });
});
