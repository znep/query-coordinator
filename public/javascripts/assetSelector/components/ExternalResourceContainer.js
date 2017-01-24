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
    name: _.isEmpty(title) ? null : title,
    description: _.isEmpty(description) ? null : description,
    imageUrl: _.isEmpty(previewImage) ? null : previewImage
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
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  previewImage: PropTypes.string.isRequired
};

ExternalResourceContainer.defaultProps = {
  dispatchCloseExternalResourceContainer: _.noop,
  title: '',
  description: '',
  url: '',
  previewImage: ''
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
