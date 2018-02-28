import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { expect, assert } from 'chai';
import { shallow } from 'enzyme';
import moment from 'moment-timezone';

import { MetadataTable } from 'common/components';
import { formatDateWithLocale } from 'common/dates';
import { FeatureFlags } from 'common/feature_flags';

import mockView from '../data/mockView';

describe('components/MetadataTable', () => {
  const editMetadataUrl = 'https://example.com/editMetadata';

  const getProps = (props) => _.defaultsDeep({}, props, {
    coreView: mockView,
    onExpandMetadataTable: _.noop,
    onExpandTags: _.noop,
    editMetadataUrl
  });

  const shallowWithProps = (props) => shallow(<MetadataTable {...getProps(props)} />);

  it('renders an element', () => {
    assert.lengthOf(shallowWithProps({}), 1);
  });

  describe('header prop', () => {
    describe('not set', () => {
      it('renders the regular header with an edit button', () => {
        const wrapper = shallowWithProps({});
        assert.lengthOf(wrapper.find('.landing-page-header-wrapper'), 1);
        assert.lengthOf(wrapper.find(`a[href="${editMetadataUrl}"]`), 1);
      });

      describe('edit button', () => {
        it('calls onClickEditMetadata', () => {
          const stub = sinon.stub();
          const wrapper = shallowWithProps({
            onClickEditMetadata: stub
          });

          wrapper.find(`a[href="${editMetadataUrl}"]`).simulate('click');
          sinon.assert.calledOnce(stub);
        });
      });
    });

    describe('set to null', () => {
      it('renders no header', () => {
        const wrapper = shallowWithProps({
          header: null
        });
        assert.lengthOf(wrapper.find('.landing-page-header-wrapper'), 0);
        assert.lengthOf(wrapper.find(`a[href="${editMetadataUrl}"]`), 0);
      });
    });

    describe('set to some content', () => {
      it('renders the content', () => {
        const wrapper = shallowWithProps({
          header: 'magic'
        });
        assert.ok(wrapper.contains('magic'));
      });
    });
  });

  it('renders create alert button', () => {
    const wrapper = shallowWithProps({
      showCreateAlertButton: true
    });
    assert.notEqual(wrapper.find('CreateAlertButton'), null);
  });

  it('renders stats link', () => {
    const wrapper = shallowWithProps({
      statsUrl: 'http://example.com/stats'
    });
    assert.lengthOf(wrapper.find('a[href="http://example.com/stats"]'), 1);
  });

  it('renders a contact dataset owner button if disableContactDatasetOwner is undefined', () => {
    const wrapper = shallowWithProps({});
    assert.lengthOf(wrapper.find('.contact-dataset-owner'), 1);
  });

  it('renders a contact dataset owner button if disableContactDatasetOwner is false', () => {
    const wrapper = shallowWithProps({
      disableContactDatasetOwner: false
    });
    assert.lengthOf(wrapper.find('.contact-dataset-owner'), 1);
  });

  it('does not render a contact dataset owner button if disableContactDatasetOwner is true', () => {
    const wrapper = shallowWithProps({
      disableContactDatasetOwner: true
    });
    assert.lengthOf(wrapper.find('.contact-dataset-owner'), 0);
  });

  describe('coreView fields', () => {
    const shallowWithCoreViewProps = (coreViewOverrides) => {
      return shallowWithProps({
        coreView: _.extend({}, mockView, coreViewOverrides)
      });
    };

    // These are pretty minimal.
    it('renders dates section', () => {
      assert.lengthOf(
        shallowWithCoreViewProps().find('.metadata-column .metadata-section'),
        3
      );
    });

    describe('when hide_dates_on_primer_and_data_catalog is true', () => {
      before(() => {
        FeatureFlags.updateTestFixture({ hide_dates_on_primer_and_data_catalog: true });
      });

      it('does not render dates section', () => {
        assert.lengthOf(
          shallowWithCoreViewProps().find('.metadata-column .metadata-section'),
          2
        );
      });

    });

    it('renders attribution', () => {
      assert.ok(shallowWithCoreViewProps({ attribution: 'something' }).contains('something'));
    });

    it('renders attachments', () => {
      const attachments = [
        {
          blobId: 'blobby-blob-id',
          filename: 'a-filename.png'
        },
        {
          name: 'totally legit download me',
          assetId: 'some-asset',
          filename: 'win32.scr'
        },
        {
          blobId: '',
          assetId: 'another-asset',
          filename: 'win32.scr'
        }
      ];

      const wrapper = shallowWithCoreViewProps({
        metadata: { attachments }
      });

      const nodes = wrapper.find('.attachment a');

      assert.lengthOf(nodes, 3);
      assert.equal(
        nodes.at(0).text(),
        'a-filename.png'
      );
      assert.equal(
        nodes.at(0).prop('href'),
        '/api/assets/blobby-blob-id?download=true'
      );

      assert.equal(
        nodes.at(1).text(),
        'totally legit download me'
      );
      assert.equal(
        nodes.at(1).prop('href'),
        '/api/views/test-view/files/some-asset?download=true&filename=win32.scr'
      );

      assert.equal(
        nodes.at(2).prop('href'),
        '/api/views/test-view/files/another-asset?download=true&filename=win32.scr'
      );
    });

    it('renders category', () => {
      assert.ok(shallowWithCoreViewProps({ category: 'felines' }).contains('Felines'));
    });

    it('renders tags', () => {
      const wrapper = shallowWithCoreViewProps({
        tags: ['cats', 'morecats']
      });
      assert.lengthOf(wrapper.find('.tag-list a'), 2);
      assert.ok(wrapper.contains(<a href="/browse?tags=morecats">morecats</a>));
      assert.ok(wrapper.contains(<a href="/browse?tags=cats">cats</a>));
    });

    it('renders license', () => {
      const wrapper = shallowWithCoreViewProps({
        license: {
          name: 'WTFPL',
          logoUrl: 'assets/wtfpl.png',
          termsLink: 'http://example.com'
        }
      });
      assert.ok(wrapper.contains(
        <a href="http://example.com" target="_blank">
          <img src="/assets/wtfpl.png" alt="WTFPL" className="license" />
        </a>
      ));
    });

    it('renders attribution link', () => {
      const wrapper = shallowWithCoreViewProps({
        attributionLink: 'http://example.com/attrib'
      });
      assert.ok(wrapper.find('.attribution').contains('http://example.com/attrib'));
    });

    it('renders download', () => {
      let wrapper = shallowWithCoreViewProps({ downloadCount: 1234 });
      assert.lengthOf(wrapper.find('.download-count'), 1);
      assert.ok(wrapper.contains('1,234'));
    });
  });
});
