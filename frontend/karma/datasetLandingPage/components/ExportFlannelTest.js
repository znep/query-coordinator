import _ from 'lodash';
import { assert } from 'chai';
import mockView from 'data/mockView';
import ExportFlannel from 'components/ExportFlannel';
import { FeatureFlags } from 'common/feature_flags';

describe('components/ExportFlannel', () => {

  beforeEach(() => {
    FeatureFlags.useTestFixture({
      hide_csv_for_excel_download: false
    });
  });

  const getProps = (props) => _.defaultsDeep({}, props, {
    view: mockView,
    onDownloadData: _.noop,
    flannelOpen: true
  });

  it('exists if the dataset is tabular', () => {
    const element = renderComponent(ExportFlannel, getProps());

    assert.ok(element.querySelector('.btn.download'));
  });

  it('exists if the dataset is blobby', () => {
    const element = renderComponent(ExportFlannel, getProps({
      view: {
        isBlobby: true
      }
    }));

    assert.ok(element.classList.contains('download'));
  });

  it('does not exist if the dataset is an href', () => {
    const element = renderComponent(ExportFlannel, getProps({
      view: {
        isHref: true
      }
    }));

    assert.isNull(element);
  });

  it('renders all the options', () => {
    const element = renderComponent(ExportFlannel, getProps());

    const typesLengthExceptJson = mockView.exportFormats.filter(type => type !== 'json').length;

    assert.equal(element.querySelectorAll('.download-link').length, typesLengthExceptJson);
  });

  it('renders CSV for Excel Option', () => {
    const element = renderComponent(ExportFlannel, getProps());
    const downloadOption = element.querySelector('[data-type="CSV for Excel"]');

    assert.ok(downloadOption);
    assert.include(downloadOption.getAttribute('href'), '.csv');
    assert.include(downloadOption.getAttribute('href'), 'bom');
  });

  it('renders TSV for Excel Option', () => {
    const element = renderComponent(ExportFlannel, getProps());
    const downloadOption = element.querySelector('[data-type="TSV for Excel"]');

    assert.ok(downloadOption);
    assert.include(downloadOption.getAttribute('href'), '.tsv');
    assert.include(downloadOption.getAttribute('href'), 'bom');
  });

  it('renders CSV for Excel Europe Option', () => {
    const element = renderComponent(ExportFlannel, getProps());
    const downloadOption = element.querySelector('[data-type="CSV for Excel (Europe)"]');

    assert.ok(downloadOption);
    assert.include(downloadOption.getAttribute('href'), '.csv');
    assert.include(downloadOption.getAttribute('href'), 'format');
    assert.include(downloadOption.getAttribute('href'), 'delimiter');
  });

  describe('when hide_csv_for_excel_download feature flag is true', () => {
    beforeEach(() => {
      FeatureFlags.useTestFixture({
        hide_csv_for_excel_download: true
      });
    });

    it('does not render "CSV for Excel" option', () => {
      const element = renderComponent(ExportFlannel, getProps());
      assert.isNotOk(element.querySelector('[data-type="CSV for Excel"]'));
    });

    it('does not render "CSV for Excel Europe" Option', () => {
      const element = renderComponent(ExportFlannel, getProps());
      assert.isNotOk(element.querySelector('[data-type="CSV for Excel (Europe)"]'));
    });

  });

  it('uses an overrideLink value if it is set', () => {
    const link = 'http://somelink';
    const element = renderComponent(ExportFlannel, getProps({
      view: _.extend({}, mockView, { metadata: { overrideLink: link } })
    }));

    assert.include(element.href, link);
  });

  it('uses a blob download if the view is blobby', () => {
    const element = renderComponent(ExportFlannel, getProps({
      view: _.extend({}, mockView, { isBlobby: true })
    }));

    assert.match(element.href, /files/);
  });

});
