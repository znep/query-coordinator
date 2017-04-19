$(function() {
  $('#federation_source').change(function() {
    var selection = this.options[this.selectedIndex].value;

    // vary the placeholder text by connector type
    var placeholderText = selection === 'data_json' ? '<domain>/data.json' : '<domain>/ArcGIS/rest';
    document.getElementById('source_url').setAttribute('placeholder', placeholderText);

    // include/exclude the displayName option by connector type
    var displayNameDisplay = selection === 'data_json' ? 'block' : 'none';
    document.getElementById('display_name_option').style.display = displayNameDisplay;
  });
});
