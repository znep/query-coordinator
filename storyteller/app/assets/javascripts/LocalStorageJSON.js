// Generic interface for working with JSON dictionaries in LocalStorage.

export default function LocalStorageJSON(name) {
  const getDictionary = () => JSON.parse(localStorage.getItem(name)) || {};
  const setDictionary = (dictionary) => localStorage.setItem(name, JSON.stringify(dictionary));

  this.get = (key) => getDictionary()[key];

  this.set = (key, value) => {
    const dictionary = getDictionary();
    dictionary[key] = value;
    setDictionary(dictionary);
  };
}
