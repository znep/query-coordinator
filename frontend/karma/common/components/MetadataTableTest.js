import sinon from 'sinon';
import { expect, assert } from 'chai';
import MetadataTable, { coreViewToViewlikeObject } from 'common/components/MetadataTable';
import mockViewlikeObject from './MetadataTableMockViewlikeObject';
import { shallow } from 'enzyme';
import moment from 'moment-timezone';

describe('components/MetadataTable', () => {
  const getProps = (props) => _.defaultsDeep({}, props, {
    viewlikeObject: mockViewlikeObject,
    onExpandMetadataTable: _.noop,
    onExpandTags: _.noop
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
        assert.lengthOf(wrapper.find(`a[href="${mockViewlikeObject.editMetadataUrl}"]`), 1);
      });

      describe('edit button', () => {
        it('calls onClickEditMetadata', () => {
          const stub = sinon.stub();
          const wrapper = shallowWithProps({
            onClickEditMetadata: stub
          });

          wrapper.find(`a[href="${mockViewlikeObject.editMetadataUrl}"]`).simulate('click');
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
        assert.lengthOf(wrapper.find(`a[href="${mockViewlikeObject.editMetadataUrl}"]`), 0);
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

  describe('viewlikeObject fields', () => {
    const shallowWithViewlikeObject = (viewlikeObjectOverrides) => {
      return shallowWithProps({
        viewlikeObject: _.extend({}, mockViewlikeObject, viewlikeObjectOverrides)
      });
    };

    // These are pretty minimal.
    it('renders attribution', () => {
      assert.ok(shallowWithViewlikeObject({ attribution: 'something' }).contains('something'));
    });
    it('renders attachments', () => {
      const wrapper = shallowWithViewlikeObject({
        attachments: [ { link: 'foo' }, { link: 'bar' } ]
      });
      assert.lengthOf(wrapper.find('.attachment'), 2);
    });
    it('renders category', () => {
      assert.ok(shallowWithViewlikeObject({ category: 'felines' }).contains('Felines'));
    });
    it('renders tags', () => {
      const wrapper = shallowWithViewlikeObject({
        tags: [ 'cats', 'morecats' ]
      });
      assert.lengthOf(wrapper.find('.tag-list a'), 2);
      assert.ok(wrapper.contains(<a href="/browse?tags=morecats">morecats</a>));
      assert.ok(wrapper.contains(<a href="/browse?tags=cats">cats</a>));
    });
    it('renders license', () => {
      const wrapper = shallowWithViewlikeObject({
        licenseName: 'WTFPL',
        licenseLogo: 'assets/wtfpl.png',
        licenseLink: 'http://example.com'
      });
      assert.ok(wrapper.contains(
        <a href="http://example.com" target="_blank">
         <img src="/assets/wtfpl.png" alt="WTFPL" className="license" />
        </a>
      ));
    });
    it('renders attribution link', () => {
      const wrapper = shallowWithViewlikeObject({
        attributionLink: 'http://example.com/attrib'
      });
      assert.ok(wrapper.find('.attribution').contains('http://example.com/attrib'));
    });
    it('renders stats link', () => {
      const wrapper = shallowWithViewlikeObject({
        statsUrl: 'http://example.com/stats'
      });
      assert.lengthOf(wrapper.find('a[href="http://example.com/stats"]'), 1);
    });
    it('renders a contact dataset owner button if disableContactDatasetOwner is undefined', () => {
      const wrapper = shallowWithViewlikeObject({});
      assert.lengthOf(wrapper.find('.contact-dataset-owner'), 1);
    });
    it('ers a contact dataset owner button if disableContactDatasetOwner is false', () => {
      const wrapper = shallowWithViewlikeObject({
        disableContactDatasetOwner: false
      });
      assert.lengthOf(wrapper.find('.contact-dataset-owner'), 1);
    });
    it('does not render a contact dataset owner button if disableContactDatasetOwner is true', () => {
      const wrapper = shallowWithViewlikeObject({
        disableContactDatasetOwner: true
      });
      assert.lengthOf(wrapper.find('.contact-dataset-owner'), 0);
    });
    it('renders download count only if not null', () => {
      let wrapper = shallowWithViewlikeObject({ downloadCount: 1234 });
      assert.lengthOf(wrapper.find('.download-count'), 1);
      assert.ok(wrapper.contains('1,234'));
      wrapper = shallowWithViewlikeObject({ downloadCount: null });
      assert.lengthOf(wrapper.find('.download-count'), 0);
    });
  });

  describe('coreViewToViewlikeObject', () => {
    const itPassesThroughProp = (inName, outName) => {
      outName = outName || inName;

      it(`passes through ${inName} as ${outName}`, () => {
        const coreView = {};
        _.set(coreView, inName, 'foobar');
        assert.deepPropertyVal(coreViewToViewlikeObject(coreView), outName, 'foobar');
      });
    };

    const itParsesTimestampPropAs = (inName, outName) => {
      outName = outName || inName;

      it(`parses ${inName} into ISO8601 as ${outName}`, () => {
        const coreView = {};
        _.set(coreView, inName, 123456);
        assert.ok(
          moment.unix(123456).isSame(coreViewToViewlikeObject(coreView)[outName])
        );
      });
    };

    itPassesThroughProp('tags');
    itPassesThroughProp('attribution');
    itPassesThroughProp('attributionLink');
    itPassesThroughProp('attachments');
    itPassesThroughProp('viewCount');
    itPassesThroughProp('downloadCount');
    itPassesThroughProp('license.name', 'licenseName');
    itPassesThroughProp('license.logoUrl', 'licenseLogo');
    itPassesThroughProp('license.termsLink', 'licenseLink');
    itPassesThroughProp('owner.displayName', 'ownerName');
    itParsesTimestampPropAs('rowsUpdatedAt', 'dataLastUpdatedAt');
    itParsesTimestampPropAs('viewLastModified', 'metadataLastUpdatedAt');
    itParsesTimestampPropAs('createdAt');
    it('chooses the most recent timestamp as lastUpdatedAt', () => {
      const timeA = 1234;
      const timeB = 2345;
      const timeC = 3456;
      const coreView = {};
      assert.isNull(coreViewToViewlikeObject(coreView).lastUpdatedAt);
      coreView.rowsUpdatedAt = timeA;
      assert.ok(moment.unix(timeA).isSame(coreViewToViewlikeObject(coreView).lastUpdatedAt));
      coreView.createdAt = timeB;
      assert.ok(moment.unix(timeB).isSame(coreViewToViewlikeObject(coreView).lastUpdatedAt));
      coreView.viewLastModified = timeC;
      assert.ok(moment.unix(timeC).isSame(coreViewToViewlikeObject(coreView).lastUpdatedAt));
    });
  });
});
