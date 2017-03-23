module.exports = function(I18n) {
  return function saveStatusTextMapping(status) {
    switch (status) {
      case 'saving':
        return I18n.saveButton.saving;
      case 'saved':
        return I18n.saveButton.saved;
      case 'failed':
        return I18n.saveButton.failed;
      default:
        return I18n.saveButton.save;
    }
  };
};
