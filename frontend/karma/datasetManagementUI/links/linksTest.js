import { expect, assert } from 'chai';
import * as Links from 'links';

describe('Links', () => {

  // comes from react state
  const mockWrappedRouting = {
    locationBeforeTransitions: {
      pathname: '/dataset/Herp-Derp-27/p4k7-ka86/revisions/0/sources'
    }
  };

  //come from calling Link_to and passing in a function
  const mockRouting = {
    pathname: '/dataset/Herp-Derp-27/p4k7-ka86/revisions/0/sources'
  };

  it('creates a home link', () => {
    expect(Links.home(mockWrappedRouting)).to.eq('/dataset/Herp-Derp-27/p4k7-ka86/revisions/0');
    expect(Links.home(mockRouting)).to.eq('/dataset/Herp-Derp-27/p4k7-ka86/revisions/0');
  });

  it('creates a home link when there\'s a locale prefix', () => {
    const wrappedRoutingWithLocale = {
      locationBeforeTransitions: {
        pathname: '/en/dataset/Herp-Derp-27/p4k7-ka86/revisions/0/sources'
      }
    };
    const routingWithLocale = {
      pathname: '/en/dataset/Herp-Derp-27/p4k7-ka86/revisions/0/sources'
    };
    expect(Links.home(wrappedRoutingWithLocale)).to.eq('/en/dataset/Herp-Derp-27/p4k7-ka86/revisions/0');
    expect(Links.home(routingWithLocale)).to.eq('/en/dataset/Herp-Derp-27/p4k7-ka86/revisions/0');
  });

  it('creates a home link when there\'s a multi-word custom category', () => {
    const wrappedRoutingWithLocale = {
      locationBeforeTransitions: {
        pathname: '/my-category/Herp-Derp-27/p4k7-ka86/revisions/0/sources'
      }
    };
    const routingWithLocale = {
      pathname: '/my-category/Herp-Derp-27/p4k7-ka86/revisions/0/sources'
    };
    expect(Links.home(wrappedRoutingWithLocale)).to.eq('/my-category/Herp-Derp-27/p4k7-ka86/revisions/0');
    expect(Links.home(routingWithLocale)).to.eq('/my-category/Herp-Derp-27/p4k7-ka86/revisions/0');
  });

  it('creates a metadata link', () => {
    expect(Links.metadata(mockWrappedRouting)).to.eq('/dataset/Herp-Derp-27/p4k7-ka86/revisions/0/metadata');
    expect(Links.metadata(mockRouting)).to.eq('/dataset/Herp-Derp-27/p4k7-ka86/revisions/0/metadata');
  });

  it('creates an sources link', () => {
    expect(Links.sources(mockWrappedRouting)).to.eq('/dataset/Herp-Derp-27/p4k7-ka86/revisions/0/sources');
    expect(Links.sources(mockRouting)).to.eq('/dataset/Herp-Derp-27/p4k7-ka86/revisions/0/sources');
  });

  it('creates a showOutputSchema link', () => {
    expect(Links.showOutputSchema(5, 10, 2)(mockWrappedRouting)).to.eq('/dataset/Herp-Derp-27/p4k7-ka86/revisions/0/sources/5/schemas/10/output/2');
    expect(Links.showOutputSchema(5, 10, 2)(mockRouting)).to.eq('/dataset/Herp-Derp-27/p4k7-ka86/revisions/0/sources/5/schemas/10/output/2');
  });

});
