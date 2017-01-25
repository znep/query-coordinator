import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { closeExternalResourceContainer } from '../actions/modal';
import BackButton from './BackButton';
import ExternalResourceForm from './ExternalResourceForm';
import { ExternalViewCard } from 'socrata-components';

export const ExternalResourceContainer = (props) => {
  const { title, description, url, previewImage } = props;

  const previewCardProps = {
    name: _.isEmpty(title.value) ? null : title.value,
    description: _.isEmpty(description.value) ? null : description.value,
    imageUrl: _.isEmpty(previewImage.value) ? null : previewImage.value,
    linkProps: {
      'aria-label': 'Preview' // TODO: localization
    }
  };

  return (
    <div className="modal-content external-resource-container">

      <BackButton onClick={props.dispatchCloseExternalResourceContainer} />

      <div className="description">
        <p>{/* TODO: localization */}
          <strong>Create a link to an external resource for this category.</strong>
          <br />
          For example, this could be a visualization on the web, a blog post,
          or a link to another part of your site.
        </p>
      </div>

      <div className="external-resource-contents">
        <ExternalResourceForm
          title={title}
          description={description}
          url={url}
          previewImage={previewImage} />

        <div className="external-resource-preview">
          <ExternalViewCard {...previewCardProps} />
        </div>
      </div>
    </div>
  );
};

ExternalResourceContainer.propTypes = {
  dispatchCloseExternalResourceContainer: PropTypes.func.isRequired,
  title: PropTypes.object.isRequired,
  description: PropTypes.object.isRequired,
  url: PropTypes.object.isRequired,
  previewImage: PropTypes.object.isRequired
};

ExternalResourceContainer.defaultProps = {
  dispatchCloseExternalResourceContainer: _.noop,
  title: {
    value: '',
    invalid: true
  },
  description: {
    value: ''
  },
  url: {
    value: '',
    invalid: true
  },
  previewImage: {
    value: ''
  }
};

function mapStateToProps(state) {
  return {
    title: _.get(state, 'externalResource.title'),
    description: _.get(state, 'externalResource.description'),
    url: _.get(state, 'externalResource.url'),
    previewImage: _.get(state, 'externalResource.previewImage')
  };
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchCloseExternalResourceContainer: function() {
      dispatch(closeExternalResourceContainer());
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ExternalResourceContainer);
