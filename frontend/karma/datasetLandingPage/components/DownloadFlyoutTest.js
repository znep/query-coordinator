import _ from 'lodash';
import { assert } from 'chai';
import mockView from 'data/mockView';
import DownloadFlyout from 'components/DownloadFlyout';

describe('components/DownloadFlyout', () => {
  const getProps = (props) => _.defaultsDeep({}, props, {
    view: mockView,
    onDownloadData: _.noop
  });

  it('exists if the dataset is tabular', () => {
    const element = renderComponent(DownloadFlyout, getProps());

    assert.ok(element.querySelector('.btn.download'));
  });

  it('exists if the dataset is blobby', () => {
    const element = renderComponent(DownloadFlyout, getProps({
      view: {
        isBlobby: true
      }
    }));

    assert.ok(element.classList.contains('download'));
  });

  it('does not exist if the dataset is an href', () => {
    const element = renderComponent(DownloadFlyout, getProps({
      view: {
        isHref: true
      }
    }));

    assert.isNull(element);
  });

  it('renders all the options', () => {
    const element = renderComponent(DownloadFlyout, getProps());

    assert.equal(element.querySelectorAll('.download-link').length, mockView.exportFormats.length);
  });

  it('renders CSV for Excel Option', () => {
    const element = renderComponent(DownloadFlyout, getProps());
    const downloadOption = element.querySelector('[data-type="CSV for Excel"]');

    assert.ok(downloadOption);
    assert.include(downloadOption.getAttribute('href'), '.csv');
    assert.include(downloadOption.getAttribute('href'), 'bom');
  });

  it('renders TSV for Excel Option', () => {
    const element = renderComponent(DownloadFlyout, getProps());
    const downloadOption = element.querySelector('[data-type="TSV for Excel"]');

    assert.ok(downloadOption);
    assert.include(downloadOption.getAttribute('href'), '.tsv');
    assert.include(downloadOption.getAttribute('href'), 'bom');
  });

  it('renders CSV for Excel Europe Option', () => {
    const element = renderComponent(DownloadFlyout, getProps());
    const downloadOption = element.querySelector('[data-type="CSV for Excel (Europe)"]');

    assert.ok(downloadOption);
    assert.include(downloadOption.getAttribute('href'), '.csv');
    assert.include(downloadOption.getAttribute('href'), 'format');
    assert.include(downloadOption.getAttribute('href'), 'delimiter');
  });

  it('uses an overrideLink value if it is set', () => {
    const link = 'http://somelink';
    const element = renderComponent(DownloadFlyout, getProps({
      view: _.extend({}, mockView, { metadata: { overrideLink: link } })
    }));

    assert.include(element.href, link);
  });

  it('uses a blob download if the view is blobby', () => {
    const element = renderComponent(DownloadFlyout, getProps({
      view: _.extend({}, mockView, { isBlobby: true })
    }));

    assert.match(element.href, /files/);
  });

});
