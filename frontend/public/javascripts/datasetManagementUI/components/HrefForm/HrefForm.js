import React, { Component } from 'react';
import _ from 'lodash';
import uuid from 'uuid';
import Fieldset from 'components/Fieldset/Fieldset';
import TextInput from 'components/TextInput/TextInput';
import TextArea from 'components/TextArea/TextArea';

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
function getBasename(url) {
  return url.split(/[\\/]/).pop();
}

function getExtension(filename = '') {
  // check that we have an arg and that it is a string
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  // find the index of the last '.' in the string
  const pos = filename.lastIndexOf('.');

  // if there was no '.' (lastIndexOf returned -1) or it was at the start of the
  // filename string (e.g. .htaccess)
  if (pos < 1) {
    return '';
  }

  return filename.slice(pos + 1);
}

// function makeUniqueURLKey(url) {
//   const filename = getBasename(url);
//   const extension = getExtension(filename);
//   const postfix = extension ? `-${extension}` : '';
//   return `${uuid()}${postfix}`;
// }

class URLField extends Component {
  constructor() {
    super();
    this.state = {
      extension: ''
    };

    this.handleExtensionChange = this.handleExtensionChange.bind(this);
  }

  componentWillMount() {
    this.setState({
      extension: getExtension(getBasename(this.props.value))
    });
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.setState({
        extension: getExtension(getBasename(nextProps.value))
      });
    }
  }

  handleExtensionChange(e) {
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
          handleChange={e => handleChangeUrl(e.target.value)}
          label="URL"
          inErrorState={false} />
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

const DatsetFieldset = ({ href, handleAddURL, handleChangeUrl, handleChangeHref }) => (
  <Fieldset title={href.title}>
    <div>
      <label>Dataset Name</label>
      <TextInput value={href.title} handleChange={e => handleChangeHref(href.id, 'title', e.target.value)} />
    </div>
    <div>
      <label>Dataset Description</label>
      <TextArea
        value={href.description}
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
        handleChange={e => handleChangeHref(href.id, 'data_dictionary', e.target.value)} />
    </div>
  </Fieldset>
);

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
    const datasetNum = this.state.hrefs.length + 1;
    this.setState({
      hrefs: [...this.state.hrefs, this.initializeHref(datasetNum)]
    });
  }

  handleAddURL(id, url) {
    const href = this.state.hrefs.find(h => h.id === id);

    // const urlKey = makeUniqueURLKey(url);

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
