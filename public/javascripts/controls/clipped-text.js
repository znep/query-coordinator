blist.namespace.fetch('blist.widget.clippedText');

/* This function takes an element with text, and will clip the
 * text to fit, using an ellipse on the end if it is clipped.
 * The element passed must be within a parent who has a display of block, have
 * fixed height, have auto width (i.e., a containing width
 * equivalent to the current width), and the title is the full
 * content (or if there is no title, it will be set to the full text)
 */
blist.widget.clippedText.clipElement = function($elem) {
  // First see if there is a title; if so, restore it to the full text
  if ($elem.attr('title') !== '') {
    $elem.text($elem.attr('title'));
  }

  var origHeight = $elem.parent().height();
  var origDisplay = $elem.css('display');
  $elem.css('display', 'inline');
  if ($elem.height() > origHeight) {
    $elem.attr('title', $elem.text());
    while ($elem.height() > origHeight) {
      $elem.text($elem.text().slice(0, -1));
    }
    $elem.text($elem.text().slice(0, -3) + '...');
  }
  $elem.css('display', origDisplay);
};
