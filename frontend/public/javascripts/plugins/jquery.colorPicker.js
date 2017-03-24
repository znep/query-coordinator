/**
 * Really Simple Color Picker in jQuery
 * 
 * Copyright (c) 2008 Lakshan Perera (www.laktek.com)
 * Licensed under the MIT (MIT-LICENSE.txt)  licenses.
 * 
 * Changes by jeff.scherpelz@socrata.com
 * - Use passed in control directly, instead of creating new div
 * - Generalized getting/setting color back to control
 * - Added var t oall functions to prevent global scoping
 * - Changed text input box to listen on keyup
 * - Changed default colors
 * - Support color blocks
 * - Added classes for hover, selected items
 * - preventDefault on click
 * - Change to a href for selectors
 * - Make color picker auto-flip away from edges
 */

(function($)
{
  $.fn.colorPicker = function()
  {
    if(this.length > 0) buildSelector();
    return this.each(function(i) { buildPicker(this)}); 
  };

  var selectorOwner;
  var selectorShowing = false;

  var buildPicker = function(element)
  {
    //bind click event to color picker
    $(element).bind("click", toggleSelector);
  };

  var buildSelector = function()
  {
      var selector = ['<div id="color_selector">'];

      //add color pallete
      $.each($.fn.colorPicker.defaultColors, function(j)
      {
          selector.push('<div class="color_block clearfix">');
          $.each(this, function(i)
          {
              selector.push('<a href="#" class="color_swatch" style="background-color:#', this, ';">',
                  '<span class="inner">&nbsp;</span>',
                  '</a>');
          });
          selector.push('</div>');
     });

     //add HEX value field
     selector.push('<div id="color_custom">',
             '<label for="color_value">Hex</label>',
             '<input type="text" size="8" id="color_value"/>',
             '</div>');

     selector.push('</div>');

     var $selector = $(selector.join(''));

     $selector.find('input#color_value').bind("keyup", function(event){
      if(event.keyCode == 13) {changeColor($(this).val());}
      if(event.keyCode == 27) {toggleSelector()}
     });

     $selector.delegate('.color_swatch', 'click', function(e)
          { e.preventDefault(); changeColor($(this).css("background-color")) })
     .delegate('.color_swatch', 'mouseover', function(e)
          {
              $(this).addClass('hover');
              $selector.find("input#color_value").val(toHex($(this).css("background-color")));
          })
     .delegate('.color_swatch', 'mouseout', function(e)
          {
              $(this).removeClass('hover');
              $selector.find("input#color_value").val(toHex($(selectorOwner).data('colorpicker-color')));
          });
     $("body").append($selector);
     $selector.hide();
  };

  var checkMouse = function(event)
  {
    //check the click was on selector itself or on selectorOwner
    var selector = "div#color_selector";
    var selectorParent = $(event.target).parents(selector).length;
    if(event.target == $(selector)[0] || event.target == selectorOwner || selectorParent > 0) return

    hideSelector(); 
  };

  var hideSelector = function()
  {
    var selector = $("div#color_selector");

    $(document).unbind("mousedown", checkMouse);
    selector.hide();
    selectorShowing = false
  };

  var showSelector = function()
  {
    var selector = $("div#color_selector");

    var $so = $(selectorOwner);
    var top = $so.offset().top + $so.outerHeight();
    var left = $so.offset().left;
    if (top + selector.outerHeight() > $(window).height() - 30)
    { top -= $so.outerHeight() + selector.outerHeight(); }
    if (left + selector.outerWidth() > $(window).width() - 30)
    { left -= selector.outerWidth() - $so.outerWidth(); }
    selector.css({ top: top, left: left });

    hexColor = toHex($(selectorOwner).data('colorpicker-color'));
    $("input#color_value").val(hexColor);
    $('.color_swatch').removeClass('selected').each(function(i, s)
    { if (toHex($(s).css('background-color')) == hexColor)
        { $(s).addClass('selected'); } });
    selector.show();

    //bind close event handler
    $(document).bind("mousedown", checkMouse);
    selectorShowing = true;
   };

  var toggleSelector = function(event)
  {
    event.preventDefault();
    selectorOwner = this;
    selectorShowing ? hideSelector() : showSelector();
  };

  var changeColor = function(value)
  {
      if (selectedValue = toHex(value))
      {
          $(selectorOwner).data('colorpicker-color', selectedValue);
          $(selectorOwner).trigger('color_change', [selectedValue]);

          //close the selector
          hideSelector();
      }
  };

  //converts RGB string to HEX - inspired by http://code.google.com/p/jquery-color-utils
  var toHex = function(color)
  {
    //valid HEX code is entered
    if(color.match(/[0-9a-fA-F]{3}$/) || color.match(/[0-9a-fA-F]{6}$/)){
      color = (color.charAt(0) == "#") ? color : ("#" + color);
    }
    //rgb color value is entered (by selecting a swatch)
    else if(color.match(/^rgb\(([0-9]|[1-9][0-9]|[1][0-9]{2}|[2][0-4][0-9]|[2][5][0-5]),[ ]{0,1}([0-9]|[1-9][0-9]|[1][0-9]{2}|[2][0-4][0-9]|[2][5][0-5]),[ ]{0,1}([0-9]|[1-9][0-9]|[1][0-9]{2}|[2][0-4][0-9]|[2][5][0-5])\)$/)){
      var c = ([parseInt(RegExp.$1),parseInt(RegExp.$2),parseInt(RegExp.$3)]);

      var pad = function(str){
            if(str.length < 2){
              for(var i = 0,len = 2 - str.length ; i<len ; i++){
                str = '0'+str;
              }
            }
            return str;
      }

      if(c.length == 3){
        var r = pad(c[0].toString(16)),g = pad(c[1].toString(16)),b= pad(c[2].toString(16));
        color = '#' + r + g + b;
      }
    }
    else color = false;

    return color;
  };


  //public methods
  $.fn.colorPicker.addColors = function(colorArray)
  {
      $.fn.colorPicker.defaultColors =
          $.fn.colorPicker.defaultColors.concat(colorArray);
  };

  $.fn.colorPicker.defaultColors =
  [
  ['000000', '333333', '666666', '999999', 'cccccc', 'eeeeee', 'f3f3f3', 'ffffff'],
  ['ff0000', 'ff9900', 'ffff00', '00ff00', '00ffff', '0000ff', '9900ff', 'ff00ff'],
  ['f4cccc', 'fce5cd', 'fff2cc', 'd9ead3', 'd0e0e3', 'cfe2f3', 'd9d2e9', 'ead1dc',
    'ea9999', 'f9cb9c', 'ffe599', 'b6d7a8', 'a2c4c9', '9fc5e8', 'b4a7d6', 'd5a6bd',
    'e06666', 'f6b26b', 'ffd966', '93c47d', '76a5af', '6fa8dc', '8e7cc3', 'c27ba0',
    'cc0000', 'e69138', 'f1c232', '6aa84f', '45818e', '3d85c6', '674ea7', 'a64d79',
    '990000', 'b45f06', 'bf9000', '38761d', '134f5c', '0b5394', '351c75', '741b47',
    '660000', '783f04', '7f6000', '274e13', '0c343d', '073763', '20124d', '4c1130']
  ];

})(jQuery);


