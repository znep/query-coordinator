import _ from 'lodash';
import { HomePane } from 'components/HomePane';

describe('HomePane', () => {
  const defaultProps = {
    toggleMetadataModal: _.noop,
    toggleDataModal: _.noop
  };

  it('renders an element', () => {
    const element = renderPureComponent(HomePane(defaultProps));
    expect(element).to.exist;
  });

  describe('handling clicks', () => {
    let dataStub;
    let metadataStub;
    let element;

    beforeEach(() => {
      dataStub = sinon.stub();
      metadataStub = sinon.stub();

      element = renderPureComponent(HomePane({
        ...defaultProps,
        onClickManageData: dataStub,
        onClickManageMetadata: metadataStub
      }));
    });

    it('invokes onClickManageMetadata when Manage Metadata is clicked', () => {
      TestUtils.Simulate.click(element.querySelector('#manage-metadata'));
      expect(metadataStub.called).to.eq(true);
    });

    it('does not invoke onClickManageData when Manage Metadata is clicked', () => {
      TestUtils.Simulate.click(element.querySelector('#manage-metadata'));
      expect(dataStub.called).to.eq(false);
    });

    it('invokes onClickManageData when Manage Data is clicked', () => {
      TestUtils.Simulate.click(element.querySelector('#manage-data'));
      expect(dataStub.called).to.eq(true);
    });

    it('does not invokes onClickManageMetadata when Manage Data is clicked', () => {
      TestUtils.Simulate.click(element.querySelector('#manage-data'));
      expect(metadataStub.called).to.eq(false);
    });
  });

});
