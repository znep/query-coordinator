import sinon from 'sinon';
import { expect, assert } from 'chai';
import { Card } from 'components/AssetSelector/card';
import { useTestTranslations } from 'common/i18n';
import mockTranslations from '../../mockTranslations';

describe('Card', () => {
  beforeEach(() => {
    useTestTranslations(mockTranslations);
  });

  const defaultProps = {
    categories: ['Fun'],
    description: 'jorts and other denim articles of clothing',
    id: 'abcd-1234',
    isFederated: false,
    isPublic: true,
    link: 'http://davidhasselhoffonline.com/',
    name: 'David Hasselhoff',
    previewImageUrl: 'https://opendata-demo.test-socrata.com/views/7237-mge9/files/573050a0-c39e-4cd5-bdd1-38f12f5f1e84',
    provenance: 'official',
    tags: [],
    type: 'dataset',
    updatedAt: '2016-12-15T12:52:12.006Z',
    viewCount: 9999999
  };

  const getProps = (props = {}) => {
    return {...defaultProps, ...props};
  }

  it('renders an empty card with no data', () => {
    const element = renderComponent(Card, {});
    assert.isDefined(element);
    assert.match(element.className, /result-card/);
  });

  it('renders a card with correct data', () => {
    const element = renderComponent(Card, getProps());
    assert.isDefined(element);
    assert.equal(element.querySelector('.entry-title').textContent, 'David Hasselhoff');
    assert.equal(element.querySelector('.entry-description').textContent,
      'jorts and other denim articles of clothing');
    assert.equal(element.querySelector('.first').querySelector('.date').textContent,
      'December 15, 2016');
    assert.isNotNull(element.querySelector('.entry-view-type').querySelector('.socrata-icon-dataset'));
    assert.isNotNull(element.querySelector('.entry-main').
      querySelector('a[href="http://davidhasselhoffonline.com/"][aria-label="View David Hasselhoff"]'));
  });

  it('calls onSelect and onClose on click', () => {
    const onCloseSpy = sinon.spy();
    const onSelectSpy = sinon.spy();
    const element = renderComponent(Card, getProps({ onClose: onCloseSpy, onSelect: onSelectSpy }));
    TestUtils.Simulate.click(element.querySelector('.hover-target'));
    sinon.assert.calledOnce(onCloseSpy);
    sinon.assert.calledOnce(onSelectSpy);
  });

  it('calls onSelect with the mapped props', () => {
    const onSelectSpy = sinon.spy();
    const element = renderComponent(Card, getProps({ onSelect: onSelectSpy }));
    TestUtils.Simulate.click(element.querySelector('.hover-target'));
    sinon.assert.calledWith(onSelectSpy, {
      name: 'David Hasselhoff',
      description: 'jorts and other denim articles of clothing',
      displayType: 'dataset',
      id: 'abcd-1234',
      imageUrl: 'https://opendata-demo.test-socrata.com/views/7237-mge9/files/573050a0-c39e-4cd5-bdd1-38f12f5f1e84',
      isPrivate: false,
      updatedAt: '2016-12-15T12:52:12.006Z',
      url: 'http://davidhasselhoffonline.com/',
      viewCount: 9999999
    });
  });
});
