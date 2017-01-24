import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { closeExternalResourceContainer } from '../actions/modal';
import { updateField } from '../actions/externalResource';
import BackButton from './BackButton';
import ExternalResourceForm from './ExternalResourceForm';
import { ExternalViewCard } from 'socrata-components';

export class ExternalResourceContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isImageInvalid: false
    };

    _.bindAll(this, ['onChange', 'renderPreview']);
  }

  // Key is one of 'title', 'description', 'url', or 'previewImage'
  onChange(key, event) {
    if (key === 'previewImage') {
      // Upload image
      const file = event.target.files[0];
      const isFileImage = file && /\.(jpe?g|png|gif)$/i.test(file.name);

      this.setState({
        isImageInvalid: !isFileImage
      });

      if (!isFileImage) {
        return;
      }

      const fileReader = new FileReader();

      fileReader.addEventListener('load', () => {
        this.props.dispatchUpdateField(key, fileReader.result);
      }, false);

      if (file) {
        fileReader.readAsDataURL(file);
      }
    } else {
      this.props.dispatchUpdateField(key, event.target.value);
    }
  }

  renderPreview() {
    const { description, previewImage, title } = this.props;

    const cardProps = {
      description: _.isEmpty(description) ? null : description,
      imageUrl: _.isEmpty(previewImage) ? null : previewImage,
      name: _.isEmpty(title) ? null : title
    };

    return <ExternalViewCard {...cardProps} />;
  }

  render() {
    return (
      <div className="modal-content external-resource-container">

        <BackButton onClick={this.props.dispatchCloseExternalResourceContainer} />

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
            title={this.props.title}
            description={this.props.description}
            url={this.props.url}
            previewImage={this.props.previewImage}
            onChange={this.onChange}
            isImageInvalid={this.state.isImageInvalid} />

          <div className="external-resource-preview">
            {this.renderPreview()}
          </div>
        </div>
      </div>
    );
  }
}

ExternalResourceContainer.propTypes = {
  dispatchCloseExternalResourceContainer: PropTypes.func.isRequired,
  dispatchUpdateField: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  previewImage: PropTypes.string.isRequired
};

ExternalResourceContainer.defaultProps = {
  dispatchCloseExternalResourceContainer: _.noop,
  dispatchUpdateField: _.noop,
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
    },
    dispatchUpdateField: function(field, value) {
      dispatch(updateField(field, value));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ExternalResourceContainer);
