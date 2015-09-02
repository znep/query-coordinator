window.socrata.storyteller.FileUploaderMocker = {

  mock: function() {
    var FileUploader = function() {}
    FileUploader.prototype = {
      upload: function(file) {
        return '';
      },
      destroy: function() {
        return 'destroy';
      }
    };
    window.socrata.storyteller.FileUploader = FileUploader;
  },

  unmock: function() {
    delete window.socrata.storyteller['FileUploader'];
  }

};
