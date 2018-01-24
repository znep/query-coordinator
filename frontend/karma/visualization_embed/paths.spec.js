import { assert } from 'chai';
import { loaderFilename, mainLibraryFilename, loaderLibrarySrc, mainLibrarySrc } from 'visualization_embed/paths';

describe('string constants', () => {
  it('should be defined', () => {
    assert.isString(loaderFilename);
    assert.isString(mainLibraryFilename);
  });
});

describe('loaderLibrarySrc', () => {
  describe('given a domain', () => {
    const src = loaderLibrarySrc('example.com');
    it('should return a path including loaderFilename', () => {
      assert.include(src, loaderFilename);
    });

    it('should return a URL including the domain', () => {
      assert.match(src, /https:\/\/example.com\//);
    });
  });

  describe('given no domain', () => {
    const src = loaderLibrarySrc(undefined);
    it('should return a path including loaderFilename', () => {
      assert.include(src, loaderFilename);
    });

    it('should return a URL including the fallback domain', () => {
      assert.match(src, /https:\/\/opendata.socrata.com\//);
    });
  });
});

describe('mainLibrarySrc', () => {
  describe('given a domain', () => {
    const src = mainLibrarySrc('example.com');
    // This is important, as this invariant is how we avoid
    // loading multiple copies of the main library.
    it('should return a path including mainLibraryFilename', () => {
      assert.include(src, mainLibraryFilename);
    });

    it('should return a URL including the domain', () => {
      assert.match(src, /https:\/\/example.com\//);
    });
  });

  describe('given no domain', () => {
    const src = mainLibrarySrc(undefined);
    // This is important, as this invariant is how we avoid
    // loading multiple copies of the main library.
    it('should return a path including mainLibraryFilename', () => {
      assert.include(src, mainLibraryFilename);
    });

    it('should return a URL including the fallback domain', () => {
      assert.match(src, /https:\/\/opendata.socrata.com\//);
    });
  });
});
