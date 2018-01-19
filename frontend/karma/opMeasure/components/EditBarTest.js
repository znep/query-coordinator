import { shallow } from 'enzyme';
import React from 'react';
import { assert } from 'chai';
import sinon from 'sinon';

import { Button, ToastNotification, EditBar as SocrataComponentsEditBar } from 'common/components';

import { EditBar } from 'opMeasure/components/EditBar';

describe('EditBar', () => {
  const getProps = (props) => {
    return {
      coreView: { name: 'Test Measure' },
      ...props
    };
  };

  it('renders', () => {
    const element = shallow(<EditBar {...getProps()} />);
    assert.ok(element);
  });

  it('behaves like a standard edit bar', () => {
    const element = shallow(<EditBar {...getProps()} />);
    const standardElement = element.find(SocrataComponentsEditBar);
    assert.isTrue(standardElement.exists());
    assert.equal(standardElement.dive().find('.page-name').text(), 'Test Measure');
  });

  describe('save toast notification', () => {
    it('should display the error notification if saveError and showSaveToastMessage are set', () => {
      const element = shallow(<EditBar saveError showSaveToastMessage />);
      const notification = element.find(ToastNotification);
      assert.isTrue(notification.prop('showNotification'));
      assert.equal(notification.prop('type'), 'error');
      assert.match(notification.html(), /Something went wrong/);
    });

    it('should display the success notification if only showSaveToastMessage is set', () => {
      const element = shallow(<EditBar showSaveToastMessage />);
      const notification = element.find(ToastNotification);
      assert.isTrue(notification.prop('showNotification'));
      assert.equal(notification.prop('type'), 'success');
      assert.match(notification.html(), /Your changes were saved/);
    });

    it('should not display any notification if showSaveToastMessage is not set', () => {
      assert.isFalse(
        shallow(<EditBar saveError />).find(ToastNotification).prop('showNotification')
      );

      assert.isFalse(
        shallow(<EditBar />).find(ToastNotification).prop('showNotification')
      );
    });
  });

  describe('save button', () => {
    it('should be disabled if there are no changes', () => {
      const element = shallow(<EditBar />);
      const saveButton = element.find('Button.btn-save');
      assert.isTrue(saveButton.prop('disabled'));
    });

    it('should enabled if there are changes', () => {
      const element = shallow(<EditBar isDirty />);
      const saveButton = element.find('Button.btn-save');
      assert.isFalse(saveButton.prop('disabled'));
    });

    it('should call onClickSave on click', () => {
      const onClickSave = sinon.spy();
      const element = shallow(<EditBar isDirty onClickSave={onClickSave} />);
      const saveButton = element.find('Button.btn-save');
      saveButton.prop('onClick')();
      sinon.assert.calledOnce(onClickSave);
    });

    it('should disable the spinner if saving=false', () => {
      const element = shallow(<EditBar />);
      const saveButton = element.find('Button.btn-save');
      assert.isFalse(saveButton.prop('busy'));
    });

    it('should enable the spinner if saving=true', () => {
      const element = shallow(<EditBar saving />);
      const saveButton = element.find('Button.btn-save');
      assert.isTrue(saveButton.prop('busy'));
    });
  });

  describe('preview button', () => {
    let props;
    let element;

    const getPreviewButton = (element) => element.find('.btn-preview');

    beforeEach(() => {
      props = { onClickPreview: sinon.spy() };
      element = shallow(<EditBar {...getProps(props)} />);
    });

    it('renders', () => {
      assert.isTrue(getPreviewButton(element).exists());
    });

    it('invokes onClickPreview on click', () => {
      getPreviewButton(element).simulate('click');
      sinon.assert.calledOnce(props.onClickPreview);
    });
  });

  describe('edit button', () => {
    it('should call onClickEdit on click', () => {
      const onClickEdit = sinon.spy();
      const element = shallow(<EditBar isDirty onClickEdit={onClickEdit} />);
      const editButton = element.find('Button.btn-edit');
      editButton.prop('onClick')();
      sinon.assert.calledOnce(onClickEdit);
    });

    it('should disable the spinner if editBusy=false', () => {
      const element = shallow(<EditBar />);
      const editButton = element.find('Button.btn-edit');
      assert.isFalse(editButton.prop('busy'));
    });

    it('should enable the spinner if editBusy=true', () => {
      const element = shallow(<EditBar editBusy />);
      const editButton = element.find('Button.btn-edit');
      assert.isTrue(editButton.prop('busy'));
    });
  });
});
