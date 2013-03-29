/*
 * jQuery Form Example Plugin 1.4.3
 * Populate form inputs with example text that disappears on focus.
 *
 * e.g.
 *  $('input#name').example('Bob Smith');
 *  $('input[@title]').example(function() {
 *    return $(this).attr('title');
 *  });
 *  $('textarea#message').example('Type your message here', {
 *    className: 'example_text'
 *  });
 *
 * Copyright (c) Paul Mucur (http://mucur.name), 2007-2008.
 * Dual-licensed under the BSD (BSD-LICENSE.txt) and GPL (GPL-LICENSE.txt)
 * licenses.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 */
(function($) {

  $.fn.example = function(text, args) {

    /* Only calculate once whether a callback has been used. */
    var isCallback = $.isFunction(text);

    /* Merge the arguments and given example text into one options object. */
    var options = $.extend({}, args, {example: text});

    return this.each(function() {

      /* Reduce method calls by saving the current jQuery object. */
      var $this = $(this);

      /* Merge the plugin defaults with the given options and, if present,
       * any metadata.
       */
      if ($.metadata) {
        var o = $.extend({}, $.fn.example.defaults, $this.metadata(), options);
      } else {
        var o = $.extend({}, $.fn.example.defaults, options);
      }

      /* The following event handlers only need to be bound once
       * per class name. In order to do this, an array of used
       * class names is stored and checked on each use of the plugin.
       * If the class name is in the array then this whole section
       * is skipped. If not, the events are bound and the class name
       * added to the array.
       *
       * As of 1.3.2, the class names are stored as keys in the
       * array, rather than as elements. This removes the need for
       * $.inArray().
       */
      if (!$.fn.example.boundClassNames[o.className]) {

        /* Because Gecko-based browsers cache form values
         * but ignore all other attributes such as class, all example
         * values must be cleared on page unload to prevent them from
         * being saved.
         */
        $(window).unload(function() {
          $('.' + o.className).val('');
        });

        /* Clear fields that are still examples before any form is submitted
         * otherwise those examples will be sent along as well.
         *
         * Prior to 1.3, this would only be bound to forms that were
         * parents of example fields but this meant that a page with
         * multiple forms would not work correctly.
         */
        $('form').submit(function() {

          /* Clear only the fields inside this particular form. */
          $(this).find('.' + o.className).val('');
        });

        /* Add the class name to the array. */
        $.fn.example.boundClassNames[o.className] = true;
      }

      /* Several browsers will cache form values even if they are cleared
       * on unload, so this will clear any value that matches the example
       * text and hasn't been specified in the value attribute.
       *
       * If a callback is used, it is not possible or safe to predict
       * what the example text is going to be so all non-default values
       * are cleared. This means that caching is effectively disabled for
       * that field.
       *
       * Many thanks to Klaus Hartl for helping resolve this issue.
       */
      // jeff.scherpelz@socrata.com - 16 Jun 2011
      // Patch this for jQuery 1.6 per https://github.com/mudge/jquery_example/issues/4
      if (!$this.attr('value') && (isCallback || $this.val() == o.example))
        $this.val('');

      /*
       * clint.tseng@socrata.com - 25 may 2011
       * activeElement will straight up exception in IE9 if called too early.
       * In these cases, just assume the element doesn't have focus anyway.
       * The focus event will fire after this in these cases.
       */
       var activeElement = null;
       try
       {
           activeElement = document.activeElement;
       }
       catch(e) {}

      /* Initially place the example text in the field if it is empty
       * and doesn't have focus yet.
       */
      if ($this.val() == '' && this != activeElement) {
        $this.addClass(o.className);

        /* The text argument can now be a function; if this is the case,
         * call it, passing the current element as `this`.
         */
        $this.val(isCallback ? o.example.call(this) : o.example);
      }

      /* Make the example text disappear when someone focuses.
       *
       * To determine whether the value of the field is an example or not,
       * check for the example class name only; comparing the actual value
       * seems wasteful and can stop people from using example values as real
       * input.
       */
      $this.focus(function() {

        /* jQuery 1.1 has no hasClass(), so is() must be used instead. */
        if ($(this).is('.' + o.className)) {
          $(this).val('');
          $(this).removeClass(o.className);
        }
      });

      /* Detect a change event to the field and remove the example class. */
      $this.change(function() {
        if ($(this).is('.' + o.className)) {
          $(this).removeClass(o.className);
        }
      });

      /* Make the example text reappear if the input is blank on blurring. */
      $this.blur(function() {
        // clint.tseng@socrata.com - 29 mar 2013 (fuck, it's been 2 years?)
        // also update the text if we blur and we have text but we're .prompt
        // so that we can just .blur() on the element to update it remotely.
        //
        // this only ever adds prompt, so i don't think this can do anything
        // it didn't do before besides the above.
        if ($(this).val() == '' || $(this).is('.' + o.className)) {
          $(this).addClass(o.className);

          /* Re-evaluate the callback function every time the user
           * blurs the field without entering anything. While this
           * is not as efficient as caching the value, it allows for
           * more dynamic applications of the plugin.
           */
          $(this).val(isCallback ? o.example.call(this) : o.example);
        }
      });
    });
  };

  /* Users can override the defaults for the plugin like so:
   *
   *   $.fn.example.defaults.className = 'not_example';
   */
  $.fn.example.defaults = {
    className: 'example'
  };

  /* All the class names used are stored as keys in the following array. */
  $.fn.example.boundClassNames = [];

})(jQuery);
