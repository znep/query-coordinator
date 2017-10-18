/* eslint-disable react/no-multi-comp */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import uuid from 'uuid';
import Fieldset from 'components/Fieldset/Fieldset';
import TextInput from 'components/TextInput/TextInput';
import TextArea from 'components/TextArea/TextArea';
import { getBasename, getExtension } from 'lib/util';

// TextInput.propTypes = {
//   name: PropTypes.string.isRequired,
//   value: PropTypes.string,
//   label: PropTypes.string,
//   placeholder: PropTypes.string,
//   isRequired: PropTypes.bool,
//   inErrorState: PropTypes.bool.isRequired,
//   handleChange: PropTypes.func,
//   handleBlur: PropTypes.func,
//   handleFocus: PropTypes.func
// };

// TextArea.propTypes = {
//   name: PropTypes.string.isRequired,
//   value: PropTypes.string,
//   label: PropTypes.string,
//   placeholder: PropTypes.string,
//   isRequired: PropTypes.bool.isRequired,
//   inErrorState: PropTypes.bool.isRequired,
//   handleChange: PropTypes.func.isRequired,
//   handleBlur: PropTypes.func.isRequired,
//   handleFocus: PropTypes.func.isRequired
// };

// {"data_dictionary" : $URL, "data_dictionary_type" : STRING, "title" : STRING, "description" : STRING, "urls" : MAP<STRING, URL>}

class URLField extends Component {
  constructor() {
    super();
    this.state = {
      extension: ''
    };

    this.handleExtensionChange = this.handleExtensionChange.bind(this);
  }

  componentWillMount() {
    // If we have a url saved on the server, then we need to extract the extension
    // on mount IOT populate the file type field below
    this.setState({
      extension: getExtension(getBasename(this.props.value))
    });
  }

  componentWillReceiveProps(nextProps) {
    // If the user changes the value of the url field, update the extension. If
    // we didn't do this, the file type and url fields would get out of sync
    if (nextProps.value !== this.props.value) {
      this.setState({
        extension: getExtension(getBasename(nextProps.value))
      });
    }
  }

  handleExtensionChange(e) {
    // allows the user to override the calculated extension
    this.setState({
      extension: e.target.value
    });
  }

  render() {
    const { handleChangeUrl, value } = this.props;

    return (
      <div>
        <label>URL</label>
        <TextInput
          value={value}
          label="URL"
          inErrorState={false}
          handleChange={e => handleChangeUrl(e.target.value)} />
        <label>File Type</label>
        <TextInput
          value={this.state.extension}
          label="File Type"
          inErrorState={false}
          handleChange={this.handleExtensionChange} />
      </div>
    );
  }
}

URLField.propTypes = {
  value: PropTypes.string,
  handleChangeUrl: PropTypes.func.isRequired
};

const DatsetFieldset = ({ href, handleAddURL, handleChangeUrl, handleChangeHref }) => (
  <Fieldset title={href.title}>
    <div>
      <label>Dataset Name</label>
      <TextInput
        value={href.title}
        label="Dataset Name"
        inErrorState={false}
        handleChange={e => handleChangeHref(href.id, 'title', e.target.value)} />
    </div>
    <div>
      <label>Dataset Description</label>
      <TextArea
        value={href.description}
        label="Dataset Description"
        inErrorState={false}
        handleChange={e => handleChangeHref(href.id, 'description', e.target.value)} />
    </div>
    <div>
      {_.map(href.urls, (val, key) => <URLField value={val} handleChangeUrl={handleChangeUrl(key)} />)}
      <button onClick={handleAddURL}>Add URL</button>
    </div>
    <div>
      <label>Data Dictionary URL</label>
      <TextInput
        value={href.data_dictionary}
        label="Data Dictionary URL"
        inErrorState={false}
        handleChange={e => handleChangeHref(href.id, 'data_dictionary', e.target.value)} />
    </div>
  </Fieldset>
);

DatsetFieldset.propTypes = {
  href: PropTypes.shape({
    id: PropTypes.number.isRequired,
    data_dictionary: PropTypes.string,
    data_dictionary_type: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    urls: PropTypes.object.isRequired
  }),
  handleAddURL: PropTypes.func.isRequired,
  handleChangeUrl: PropTypes.func.isRequired,
  handleChangeHref: PropTypes.func.isRequired
};

class HrefForm extends Component {
  constructor() {
    super();
    this.state = {
      hrefs: [],
      currentId: 1
    };

    _.bindAll(this, ['handleAddDataset', 'handleAddURL', 'handleChangeUrl', 'handleChangeHref']);
  }

  componentWillMount() {
    const datasetNum = this.state.hrefs.length + 1;

    this.setState({
      hrefs: [...this.state.hrefs, this.initializeHref(datasetNum)]
    });
  }

  initializeHref(datasetNum) {
    const href = {
      id: this.state.currentId,
      data_dictionary: '',
      data_dictionary_type: '',
      title: `External Dataset ${datasetNum}`,
      description: '',
      urls: {
        [uuid()]: ''
      }
    };

    this.setState({
      currentId: this.state.currentId + 1
    });

    return href;
  }

  handleAddDataset() {
    // hanlder for the button that adds a new dataset fieldset
    const datasetNum = this.state.hrefs.length + 1;
    this.setState({
      hrefs: [...this.state.hrefs, this.initializeHref(datasetNum)]
    });
  }

  handleAddURL(id) {
    // handler for the button that creates a new url field in the form
    const href = this.state.hrefs.find(h => h.id === id);

    const newHref = {
      ...href,
      urls: {
        ...href.urls,
        [uuid()]: ''
      }
    };

    const newHrefs = [...this.state.hrefs.filter(h => h.id !== id), newHref];

    this.setState({
      hrefs: _.orderBy(newHrefs, 'id')
    });
  }

  handleChangeUrl(id) {
    // Since urls are nested objects, they need to be udpated a little differently
    // that the other href attributes, hence this dedicated method
    return urlId => newValue => {
      const href = this.state.hrefs.find(h => h.id === id);

      const newUrls = {
        ...href.urls,
        [urlId]: newValue
      };

      const newHref = {
        ...href,
        urls: newUrls
      };

      const newHrefs = [...this.state.hrefs.filter(h => h.id !== id), newHref];

      this.setState({
        hrefs: _.orderBy(newHrefs, 'id')
      });
    };
  }

  handleChangeHref(id, fieldname, newValue) {
    // generic handler for all href attributes except for url
    const href = this.state.hrefs.find(h => h.id === id);

    const newHref = {
      ...href,
      [fieldname]: newValue
    };

    const newHrefs = [...this.state.hrefs.filter(h => h.id !== id), newHref];

    this.setState({
      hrefs: _.orderBy(newHrefs, 'id')
    });
  }

  render() {
    return (
      <section>
        <h3>Link to an External Dataset</h3>
        <span>What even is an external dataset?</span>
        <form onSubmit={e => e.preventDefault()}>
          <h4>Add External Datasets</h4>
          {this.state.hrefs.map(href => (
            <DatsetFieldset
              href={href}
              handleChangeUrl={this.handleChangeUrl(href.id)}
              handleChangeHref={this.handleChangeHref}
              handleAddURL={url => this.handleAddURL(href.id, url)} />
          ))}
        </form>
        <button onClick={this.handleAddDataset}>Add Dataset</button>
      </section>
    );
  }
}

export default HrefForm;
