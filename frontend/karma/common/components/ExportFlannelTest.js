import _ from 'lodash';
import sinon from 'sinon';
import { assert } from 'chai';
import mockView from '../../datasetLandingPage/data/mockView';
import mockVif from '../../visualizationCanvas/data/mockVif';
import mockViewVizCan from '../../visualizationCanvas/data/mockView';
import ExportFlannel from 'components/ExportFlannel';
import { FeatureFlags } from 'common/feature_flags';

import { shallow } from 'enzyme';

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

  describe.only('filtered download behavior', () => {
    const propsBase = getProps({
      view: mockViewVizCan,
      vifs: [mockVif]
    });

    it('does not show a filtering toggle when filtered export is disabled', () => {
      const props = getProps({
        exportFilteredData: false,
        idFromView: true
      });
      const component = shallow(<ExportFlannel {...props} />);
      const form = component.find('#export-flannel-export-form');
      assert.equal(form.length, 0);
    });

    it('toggles filtered and unfiltered downloads when filtered export is enabled', () => {
      const props = Object.assign(propsBase, {
        exportFilteredData: true,
        idFromView: false
      });
      const component = shallow(<ExportFlannel {...props} />);
      const form = component.find('#export-flannel-export-form');
      assert.equal(form.length, 1);
      assert.equal(component.state('exportSetting'), 'all');
      const radioButtonFiltered = component.find('#export-flannel-export-setting-filtered');
      radioButtonFiltered.simulate('change');
      assert.equal(component.state('exportSetting'), 'filtered');
    });
  });

});
