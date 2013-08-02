;(function($)
{

// util to choose the opposite direction of current.
var invert = function(side)
{
  if (side == 'top')
    return 'bottom';
  else if (side == 'right')
    return 'left';
  else if (side == 'bottom')
    return 'top';
  else if (side == 'left')
    return 'right';
}

// util to determine the centerpoint of an edge of an element.
var centroid = function($elem, edge)
{
  var position = $elem.offset();
  var width = $elem.outerWidth();
  var height = $elem.outerHeight();

  if (edge == 'top')
    return { x: position.left + (width / 2), y: position.top };
  else if (edge == 'right')
    return { x: position.left + width, y: position.top + (height / 2) };
  else if (edge == 'bottom')
    return { x: position.left + (width / 2), y: position.top + height };
  else if (edge == 'left')
    return { x: position.left, y: position.top + (height / 2) };
};

// check if an element could possibly scroll.
var scrollable = function($elem)
{
  return $elem.css('overflow') == 'scroll' || $elem.css('overflow') == 'auto' || $elem.css('overflow-x') == 'scroll' || $elem.css('overflow-x') == 'auto' || $elem.css('overflow-y') == 'scroll' || $elem.css('overflow-y') == 'auto';
};

// the main hook; called whenever something may have changed.
var adjust = function($elem, $bubble, options)
{
  // assume we'll be shown.
  $bubble.show();

  for (var i = 0; i < options.prefer.length; i++)
  {
    // reset styling after each try.
    $bubble.removeClass('top right bottom left');

    // try directions in order of preference.
    if (tryDirection(options.prefer[i], $elem, $bubble, options, false) === true)
      return;
  }

  // assumption failed; hide.
  $bubble.hide();
};

// the workhorse; called with a direction to attempt to position the bubble on
// the element in that direction.
var tryDirection = function(direction, $elem, $bubble, options, force)
{
// first determine our fixation point:
  // start with the naive answer.
  var fixation = centroid($elem, invert(direction));

  // check our offsets and and adjust the fixation if necessary. also track
  // boundedness.
  var withinBounds = true;
  var checkParent = function($target)
  {
    if (!$target || $target.length === 0)
      return;
    if (!scrollable($target))
      return;

    var parentOffset = $target.offset();
    var left = position.left;
    var top = position.top;

    if (left > fixation.x)
    {
      withinBounds = false;
      fixation.x = centroid($parent, 'left').x;
    }
    if (left + $target.outerWidth() < left)
    {
      withinBounds = false;
      fixation.x = centroid($parent, 'right').x;
    }
    if (top > fixation.y)
    {
      withinBounds = false;
      fixation.y = centroid($parent, 'top').y;
    }
    if (top + $target.outerHeight() < fixation.y)
    {
      withinBounds = false;
      fixation.x = centroid($parent, 'bottom').y;
    }

    checkParent($target.parent());
  }
  //checkParent($elem.parent());

  // actually, we could also render against the edge of the visible part of
  // the elem.
  if ((withinBounds === false) && (options.pin !== true))
    return false;

  // add class for measurement w/ styling.
  $bubble.addClass(direction);

  // we know where we should be fixated. now let's see where we should be
  // placed.
  var $tip = $bubble.find('.awesometip');
  var tipWidth = $tip.outerWidth();
  var tipHeight = $tip.outerHeight() / 2; // TODO: breaks w/ left/right

  var bubbleWidth = $bubble.outerWidth();
  var bubbleHeight = $bubble.outerHeight();

  var $window = $(window);
  var $body = $('body');
  var screenTop = $body.scrollTop();
  var screenBottom = screenTop + $window.height();
  var screenLeft = $body.scrollLeft();
  var screenRight = screenLeft + $window.width();

  // see if we violate bounds.
  if ((direction == 'top') && (fixation.y - bubbleHeight < screenTop))
    return false;
  if ((direction == 'bottom') && (fixation.y + bubbleHeight > screenBottom))
    return false;

  // see if we need to shift sideways.
  var shift = { x: 0, y: 0 };

  if (fixation.x + (bubbleWidth / 2) > screenRight)
    shift.x = screenRight - (fixation.x + (bubbleWidth / 2));
  if (fixation.x - (bubbleWidth / 2) < screenLeft)
    shift.x = screenLeft - (fixation.x - (bubbleWidth / 2));

  // reset our tip position.
  $tip.css('top', null);
  $tip.css('right', null);
  $tip.css('bottom', null);
  $tip.css('left', null);

  // position our bubble and tip.
  if (direction == 'top')
  {
    $bubble.css('top', fixation.y - bubbleHeight - tipHeight + shift.y);
    $bubble.css('left', fixation.x - (bubbleWidth / 2) + shift.x);

    $tip.css('bottom', -tipHeight * 2);
    $tip.css('left', (bubbleWidth / 2) - (tipWidth / 2) - shift.x);
  }
  if (direction == 'bottom')
  {
    $bubble.css('top', fixation.y + $elem.outerHeight() + tipHeight + shift.y);
    $bubble.css('left', fixation.x - (bubbleWidth / 2) + shift.x);

    $tip.css('top', -tipHeight * 2);
    $tip.css('left', (bubbleWidth / 2) - (tipWidth / 2) - shift.x);
  }

  // victory!
  return true;
};

$.fn.awesomebubble = function(options)
{
  options = $.extend(true, {}, $.fn.awesomebubble.defaults, options);

  return this.each(function()
  {
    var $this = $(this);
    var self = this;

    // make our bubble, drop in the contents, and drop it all on the body.
    var $bubble = $('<div class="awesomebubble"><div class="awesometip"></div></div>');
    $bubble.append(options.content);
    $bubble.appendTo('body')

    // drop in hooks for repositioning when things change.
    boundAdjust = function() { adjust($this, $bubble, options); };
    //$(window).resize(boundAdjust);
    $this.parents().andSelf().on('scroll sort stop drag', /*boundAdjust*/ function() { remove(); });

    // hook to remove self and events.
    var removed = false;
    var remove = function()
    {
      if (removed === true)
        return;
      removed = true;

      //$this.parents().andSelf().off('scroll sort stop drag', boundAdjust);
      $bubble.remove();
    }

    // hook to remove ourself if the content is going away.
    options.content.on('destroying', function() { remove(); });

    // remove if clicked outside.
    $('body').on('click', function(event)
    {
      var $target = $(event.target);
      if ($target.get(0) === self)
        return;

      var $parents = $target.parents();
      for (var i = 0; i < $parents.length; i++)
        if (($parents[i] == $bubble.get(0)) || ($parents[i] == self))
          return;

      remove();
    });

    // immediately adjust.
    boundAdjust();
  });

};

$.fn.awesomebubble.defaults = {
  pin: false,
  prefer: [ 'bottom', 'top' ]
};

})(jQuery);

