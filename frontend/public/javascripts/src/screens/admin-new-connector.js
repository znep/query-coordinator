$(function() {
  $('#federation_source').change(function() {
    var esriArcgis = this.options[this.selectedIndex].value === 'esri_arcgis';

    $('.new-connector-form .esri-arcgis')[esriArcgis ? 'show' : 'hide']().attr('disabled', !esriArcgis);
    $('.new-connector-form .data-json')[esriArcgis ? 'hide' : 'show']().attr('disabled', esriArcgis)
  });
});
