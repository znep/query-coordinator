import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { closeExternalResourceContainer } from '../actions/modal';
import BackButton from './BackButton';
import ExternalResourceForm from './ExternalResourceForm';
import { ExternalViewCard } from 'socrata-components';

export class ExternalResourceContainer extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, ['onChange', 'renderPreview']);

    // TODO: populate these (componentDidMount? or props?) if values already exist.
    this.state = {
      title: '',
      description: '',
      url: '',
      previewImage: '',
      hasSaveError: false,
      isImageInvalid: false
    };
  }

  // Key is one of 'title', 'description', 'url', or 'previewImage'
  onChange(key, event) {
    if (key === 'previewImage') {
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
        this.setState({ [key]: fileReader.result });
      }, false);

      if (file) {
        fileReader.readAsDataURL(file);
      }
    } else {
      this.setState({ [key]: event.target.value });
    }
  }

  renderPreview() {
    const { description, previewImage, title } = this.state;

    const cardProps = {
      description: _.isEmpty(description) ? null : description,
      imageUrl: _.isEmpty(previewImage) ? null : previewImage,
      name: _.isEmpty(title) ? null : title
    };

    return <ExternalViewCard {...cardProps} />;
  }

  render() {
    const saveError = this.state.hasSaveError ?
      <div className="alert error">{/* TODO: localization */}
        Sorry, there was an error saving your data. Please try again.
      </div> :
      null;

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
          <div className="external-resource-contents">
            <ExternalResourceForm
              title={this.state.title}
              description={this.state.description}
              url={this.state.url}
              previewImage={this.state.previewImage}
              onChange={this.onChange}
              isImageInvalid={this.state.isImageInvalid} />

            <div className="external-resource-preview">
              {this.renderPreview()}
            </div>
          </div>

          {saveError}
        </div>
      </div>
    );
  }
}

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

function mapStateToProps() {
  return {};
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchCloseExternalResourceContainer: function() {
      dispatch(closeExternalResourceContainer());
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ExternalResourceContainer);
