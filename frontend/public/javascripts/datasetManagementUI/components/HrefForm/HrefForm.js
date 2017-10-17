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

function makeUniqueURLKey(filename) {
  // get basename
  const extension = getExtension(filename);
  const postfix = extension ? `-${extension}` : '';
  return `${uuid()}${postfix}`;
}

const URLField = ({ handleChangeUrl, value }) => (
  <div>
    <label>URL</label>
    <TextInput value={value} handleChange={e => handleChangeUrl(e.target.value)} />
    <label>File Type</label>
    <TextInput />
  </div>
);

const DatsetFieldset = ({ href, onAddURL, handleChangeUrl }) => (
  <Fieldset title="External Dataset 1">
    <div>
      <label>Dataset Name</label>
      <TextInput />
    </div>
    <div>
      <label>Dataset Description</label>
      <TextArea />
    </div>
    <div>
      {_.map(href.urls, (val, key) => <URLField value={val} handleChangeUrl={handleChangeUrl(key)} />)}
      <button onClick={onAddURL}>Add URL</button>
    </div>
    <div>
      <label>Data Dictionary URL</label>
      <TextInput />
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

    _.bindAll(this, ['handleAddDataset', 'handleAddURL', 'handleChangeUrl']);
  }

  componentWillMount() {
    this.setState({
      hrefs: [...this.state.hrefs, this.initializeHref()]
    });
  }

  initializeHref() {
    const href = {
      id: this.state.currentId,
      data_dictionary: '',
      data_dictionary_type: '',
      title: '',
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
    this.setState({
      hrefs: [...this.state.hrefs, this.initializeHref()]
    });
  }

  handleAddURL(id, url = 'dog.txt') {
    const href = this.state.hrefs.find(h => h.id === id);

    const urlKey = makeUniqueURLKey(url);

    const newHref = {
      ...href,
      urls: {
        ...href.urls,
        [urlKey]: ''
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
              onAddURL={url => this.handleAddURL(href.id, url)} />
          ))}
        </form>
        <button onClick={this.handleAddDataset}>Add Dataset</button>
      </section>
    );
  }
}

export default HrefForm;
