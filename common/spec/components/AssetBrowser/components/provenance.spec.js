import { assert } from 'chai';
import { Provenance} from 'common/components/AssetBrowser/components/provenance';
import { FeatureFlags } from 'common/feature_flags';
import { renderComponentWithPropsAndStore } from 'common/spec/helpers';

describe('components/provenance', () => {
  describe('when disable_authority_badge is "none"', () => {
    beforeEach(() => FeatureFlags.updateTestFixture({ disable_authority_badge: 'none' }));

    it('renders the official provenance badge', () => {
      const element = renderComponentWithPropsAndStore(Provenance, { provenance: 'official' });
      assert.isNotNull(element);
      assert.equal(element.className, 'tag-official');
      assert.equal(element.innerText, 'Official');
    });

    it('renders the community provenance badge', () => {
      const element = renderComponentWithPropsAndStore(Provenance, { provenance: 'community' });
      assert.isNotNull(element);
      assert.equal(element.className, 'tag-community');
      assert.equal(element.innerText, 'Community');
    });
  });

  describe('when disable_authority_badge is "official2"', () => {
    beforeEach(() => FeatureFlags.updateTestFixture({ disable_authority_badge: 'official2' }));

    it('renders the community provenance badge', () => {
      const element = renderComponentWithPropsAndStore(Provenance, { provenance: 'community' });
      assert.isNotNull(element);
      assert.equal(element.className, 'tag-community');
      assert.equal(element.innerText, 'Community');
    });

    it('does not render the official provenance badge', () => {
      const element = renderComponentWithPropsAndStore(Provenance, { provenance: 'official' });
      assert.isNull(element);
    });
  });

  describe('when disable_authority_badge is "community"', () => {
    beforeEach(() => FeatureFlags.updateTestFixture({ disable_authority_badge: 'community' }));

    it('renders the official provenance badge', () => {
      const element = renderComponentWithPropsAndStore(Provenance, { provenance: 'official' });
      assert.isNotNull(element);
      assert.equal(element.className, 'tag-official');
      assert.equal(element.innerText, 'Official');
    });

    it('does not render the community provenance badge', () => {
      const element = renderComponentWithPropsAndStore(Provenance, { provenance: 'community' });
      assert.isNull(element);
    });
  });

  describe('when disable_authority_badge is "all"', () => {
    beforeEach(() => FeatureFlags.updateTestFixture({ disable_authority_badge: 'all' }));

    it('does not render the official provenance badge', () => {
      const element = renderComponentWithPropsAndStore(Provenance, { provenance: 'official' });
      assert.isNull(element);
    });

    it('does not render the community provenance badge', () => {
      const element = renderComponentWithPropsAndStore(Provenance, { provenance: 'community' });
      assert.isNull(element);
    });
  });

  describe('when provenance is null', () => {
    beforeEach(() => FeatureFlags.updateTestFixture({ disable_authority_badge: 'none' }));

    it('does not render the official provenance badge', () => {
      const element = renderComponentWithPropsAndStore(Provenance, { provenance: null });
      assert.isNull(element);
    });

    it('does not render the community provenance badge', () => {
      const element = renderComponentWithPropsAndStore(Provenance, { provenance: null });
      assert.isNull(element);
    });
  });

  describe('when includeLabel is false', () => {
    beforeEach(() => FeatureFlags.updateTestFixture({ disable_authority_badge: 'none' }));

    it('does not render the official provenance badge', () => {
      const element = renderComponentWithPropsAndStore(Provenance, { provenance: 'official', includeLabel: false });
      assert.isNotNull(element);
      assert.equal(element.innerText, '');
    });

    it('does not render the community provenance badge', () => {
      const element = renderComponentWithPropsAndStore(Provenance, { provenance: 'community', includeLabel: false });
      assert.isNotNull(element);
      assert.equal(element.innerText, '');
    });
  });

  describe('when provenance is null', () => {
    beforeEach(() => FeatureFlags.updateTestFixture({ disable_authority_badge: 'none' }));

    it('does not render the official provenance badge', () => {
      const element = renderComponentWithPropsAndStore(Provenance, { provenance: null });
      assert.isNull(element);
    });

    it('does not render the community provenance badge', () => {
      const element = renderComponentWithPropsAndStore(Provenance, { provenance: null });
      assert.isNull(element);
    });
  });
});
