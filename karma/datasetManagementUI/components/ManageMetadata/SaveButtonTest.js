import {
  statusSaved,
  statusDirty,
  statusDirtyImmutable,
  statusUpdating,
  statusUpdatingImmutable
} from 'lib/database/statuses';
import SaveButton from 'components/ManageMetadata/SaveButton';

describe('components/ManageMetadata/SaveButton', () => {

  const defaultProps = {
    onSave: _.noop,
    view: {
      __status__: statusSaved
    },
    outputSchema: {
      __status__: statusSaved
    },
    outputColumns: [
      {
        __status__: statusSaved
      }
    ]
  };

  it('is disabled when nothing is dirty', () => {
    const element = renderPureComponent(SaveButton(defaultProps));
    expect(element.disabled).to.be.true;
  });

  it('is enabled when the view is dirty', () => {
    const element = renderPureComponent(SaveButton({
      ...defaultProps,
      view: {
        ...defaultProps.view,
        __status__: statusDirty({})
      }
    }));
    expect(element.disabled).to.be.false;
  });

  it('is enabled when a column is dirty', () => {
    const element = renderPureComponent(SaveButton({
      ...defaultProps,
      outputColumns: [
        {
          ...defaultProps.outputColumns[0],
          __status__: statusDirtyImmutable({})
        }
      ]
    }));
    expect(element.disabled).to.be.false;
  });

  it('is enabled when view and column are dirty', () => {
    const element = renderPureComponent(SaveButton({
      ...defaultProps,
      view: {
        ...defaultProps.view,
        __status__: statusDirty({})
      },
      outputColumns: [
        {
          ...defaultProps.outputColumns[0],
          __status__: statusDirtyImmutable({})
        }
      ]
    }));
    expect(element.disabled).to.be.false;
  });

  it('renders a spinner when view is updating', () => {
    const element = renderPureComponent(SaveButton({
      ...defaultProps,
      view: {
        ...defaultProps.view,
        __status__: statusUpdating({})
      }
    }));
    expect(element.disabled).to.be.true;
    expect(element.querySelector('.spinner-default')).to.not.be.null;
  });

  it('renders a spinner when columns are updating', () => {
    const element = renderPureComponent(SaveButton({
      ...defaultProps,
      outputColumns: [
        {
          ...defaultProps.outputColumns[0],
          __status__: statusUpdatingImmutable()
        }
      ]
    }));
    expect(element.disabled).to.be.true;
    expect(element.querySelector('.spinner-default')).to.not.be.null;
  });

  it('renders a spinner when view and columns are updating', () => {
    const element = renderPureComponent(SaveButton({
      ...defaultProps,
      view: {
        ...defaultProps.view,
        __status__: statusUpdating({})
      },
      outputColumns: [
        {
          ...defaultProps.outputColumns[0],
          __status__: statusUpdatingImmutable()
        }
      ]
    }));
    expect(element.disabled).to.be.true;
    expect(element.querySelector('.spinner-default')).to.not.be.null;
  });

});
