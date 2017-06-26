import { expect, assert } from 'chai';
import * as Links from 'links';

describe('links', () => {

  // comes from react state
  const mockWrappedRouting = {
    locationBeforeTransitions: {
      pathname: '/dataset/Herp-Derp-27/p4k7-ka86/revisions/0/uploads'
    }
  }

  //come from calling Link_to and passing in a function
  const mockRouting = {
    pathname: '/dataset/Herp-Derp-27/p4k7-ka86/revisions/0/uploads'
  }

  it('creates a home link', () => {
    expect(Links.home(mockWrappedRouting)).to.eq('/dataset/Herp-Derp-27/p4k7-ka86/revisions/0');
    expect(Links.home(mockRouting)).to.eq('/dataset/Herp-Derp-27/p4k7-ka86/revisions/0');
  });

  it('creates a metadata link', () => {
    expect(Links.metadata(mockWrappedRouting)).to.eq('/dataset/Herp-Derp-27/p4k7-ka86/revisions/0/metadata');
    expect(Links.metadata(mockRouting)).to.eq('/dataset/Herp-Derp-27/p4k7-ka86/revisions/0/metadata');
  })

  it('creates an uploads link', () => {
    expect(Links.uploads(mockWrappedRouting)).to.eq('/dataset/Herp-Derp-27/p4k7-ka86/revisions/0/uploads');
    expect(Links.uploads(mockRouting)).to.eq('/dataset/Herp-Derp-27/p4k7-ka86/revisions/0/uploads');
  })

  it('creates a showOutputSchema link', () => {
    expect(Links.showOutputSchema(5, 10, 2)(mockWrappedRouting)).to.eq('/dataset/Herp-Derp-27/p4k7-ka86/revisions/0/uploads/5/schemas/10/output/2');
    expect(Links.showOutputSchema(5, 10, 2)(mockRouting)).to.eq('/dataset/Herp-Derp-27/p4k7-ka86/revisions/0/uploads/5/schemas/10/output/2');
  })


});
