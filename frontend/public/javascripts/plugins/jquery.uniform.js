/*

TO DO: Test in all browsers, clean up theme file, prepare documentation, minisite?

Uniform v1.5
Copyright © 2009 Josh Pyles / Pixelmatrix Design LLC
http://pixelmatrixdesign.com

Requires jQuery 1.3 or newer

Much thanks to Thomas Reynolds and Buck Wilson for their help and advice on this

Also, thanks to David Kaneda and Eugene Bond for their contributions to the plugin

License:
MIT License - http://www.opensource.org/licenses/mit-license.php

Usage:

$(function(){
    $("select, :radio, :checkbox").uniform();
});

You can customize the classes that Uniform uses:

$("select, :radio, :checkbox").uniform({
  selectClass: 'mySelectClass',
  radioClass: 'myRadioClass',
  checkboxClass: 'myCheckboxClass',
  checkedClass: 'myCheckedClass',
  focusClass: 'myFocusClass'
});

Enjoy!

*/

// clint.tseng@socrata.com 13/05/10:
//    adding .uniform class to uniform elems
//    attaching hover events to associated labels

// clint.tseng@socrata.com 19/05/10:
// set width of select to match that of its target

// clint.tseng@socrata.com 19/05/10:
// setting filename not working with multiple file inputs

// clint.tseng@socrata.com 19/05/10:
// setting filename not happening if form input was preserved

// jeff.scherpelz@socrata.com 21/10/10:
// add another div in select to do dynamic sizing, since jq1.4.3 broke getting the
// styled width of a hidden element

// clint.tseng@socrata.com 03/01/11
// forbid double-uniforming

// clint.tseng@socrata.com 04/27/11
// rewrite dom manip for massive perf gain
//  note: wrap is slow.

(function($) {
    $.uniform = {
        options: {
            selectClass:   'selector',
            radioClass: 'radio',
            checkboxClass: 'checker',
            fileClass: 'uploader',
            filenameClass: 'filename',
            fileBtnClass: 'action',
            globalClass: 'uniform',
            fileDefaultText: 'No file selected',
            fileBtnText: 'Choose File',
            checkedClass: 'checked',
            focusClass: 'focus',
            disabledClass: 'disabled',
            activeClass: 'active',
            hoverClass: 'hover',
            useID: true,
            idPrefix: 'uniform',
            resetSelector: false
        },
        elements: []
    };

    if($.browser.msie && $.browser.version < 7){
        $.selectOpacity = false;
    }else{
        $.selectOpacity = true;
    }

    $.fn.uniform = function(options) {

        options = $.extend($.uniform.options, options);

        var el = this;
        //code for specifying a reset button
        if(options.resetSelector != false){
            $(options.resetSelector).mouseup(function(){
                function resetThis(){
                    $.uniform.update(el);
                }
                setTimeout(resetThis, 10);
            });
        }

        function doSelect(elem){

            var divTag = '<div><div class="container"><div><span></span></div></div></div>';

            elem.css('opacity', 0);

            elem.after(divTag);
            divTag = elem.next();
            divTag.append(elem);

            var spanTag = divTag.find('span');

            // assign class and id
            divTag.addClass(options.selectClass).addClass(options.globalClass);
            if(options.useID){
                divTag.attr("id", options.idPrefix+"-"+elem.attr("id"));
            }

            // get selection
            var $selected = elem.find(':selected:first');
            if ($selected.length === 0)
            { $selected = elem.find('option:first'); }
            spanTag.text($selected.text());

            elem.change(function() {
                spanTag.text(elem.find(":selected").text());
            })
            .focus(function() {
                divTag.addClass(options.focusClass);
            })
            .blur(function() {
                divTag.removeClass(options.focusClass);
            })
            .bind('mousedown.uniform touchbegin.uniform', function() {
                divTag.addClass(options.activeClass);
            })
            .bind('mouseup.uniform touchend.uniform', function() {
                divTag.removeClass(options.activeClass);
            })
            .bind('click.uniform', function() {
                divTag.removeClass(options.activeClass);
            })
            .hover(function() {
                divTag.addClass(options.hoverClass);
            }, function() {
                divTag.removeClass(options.hoverClass);
            })
            .keypress(function(){
              spanTag.text(elem.find(":selected").text());
            });

            //handle disabled state
            if($(elem).attr("disabled")){
                //box is checked by default, check our box
                divTag.addClass(options.disabledClass);
            }

            storeElement(elem);

        };

        function doCheckbox(elem){

            var divTag = '<div><span></span></div>';

            //wrap with the proper elements
            elem.after(divTag);
            divTag = elem.next();
            var spanTag = divTag.children();
            spanTag.append(elem);

            // assign class and id
            if(options.useID){
                divTag.attr("id", options.idPrefix+"-"+elem.attr("id"));
            }
            divTag.addClass(options.checkboxClass).addClass(options.globalClass);

            //hide normal input and add focus classes
            $(elem)
            .css("opacity", 0)
            .focus(function(){

                divTag.addClass(options.focusClass);
            })
            .blur(function(){

                divTag.removeClass(options.focusClass);
            })
            .click(function(){

                if(!$(elem).attr("checked")){
                    //box was just unchecked, uncheck span
                    spanTag.removeClass(options.checkedClass);
                }else{
                    //box was just checked, check span.
                    spanTag.addClass(options.checkedClass);
                }
            })
            .mousedown(function() {
                divTag.addClass(options.activeClass);
            })
            .mouseup(function() {
                divTag.removeClass(options.activeClass);
            })
            .hover(function() {
                divTag.addClass(options.hoverClass);
            }, function() {
                divTag.removeClass(options.hoverClass);
            });

            //handle defaults
            if($(elem).attr("checked")){
                //box is checked by default, check our box
                spanTag.addClass(options.checkedClass);
            }

            //handle disabled state
            if($(elem).attr("disabled")){
                //box is checked by default, check our box
                divTag.addClass(options.disabledClass);
            }

            //cxlt: bind label hover
            attachLabelHover($(elem), divTag);

            storeElement(elem);

        };

        function doRadio(elem){

            var divTag = '<div><span></span></div>';

            //wrap with the proper elements
            elem.after(divTag);
            divTag = elem.next();
            var spanTag = divTag.children();
            spanTag.append(elem);

            //assign class and id
            if(options.useID){
                divTag.attr("id", options.idPrefix+"-"+elem.attr("id"));
            }
            divTag.addClass(options.radioClass).addClass(options.globalClass);

            //hide normal input and add focus classes
            $(elem)
            .css("opacity", 0)
            .focus(function(){
                divTag.addClass(options.focusClass);
            })
            .blur(function(){
                divTag.removeClass(options.focusClass);
            })
            .click(function(){
                if(!$(elem).attr("checked")){
                    //box was just unchecked, uncheck span
                    spanTag.removeClass(options.checkedClass);
                }else{
                    //box was just checked, check span
                    $("."+options.radioClass + " span."+options.checkedClass + ":has([name='" + $(elem).attr('name') + "'])").removeClass(options.checkedClass);
                    spanTag.addClass(options.checkedClass);
                }
            })
            .mousedown(function() {
              if(!$(elem).is(":disabled")){
                divTag.addClass(options.activeClass);
              }
            })
            .mouseup(function() {
                divTag.removeClass(options.activeClass);
            })
            .hover(function() {
                divTag.addClass(options.hoverClass);
            }, function() {
                divTag.removeClass(options.hoverClass);
            });

            //handle defaults
            if($(elem).attr("checked")){
                //box is checked by default, check span
                spanTag.addClass(options.checkedClass);
            }
            //handle disabled state
            if($(elem).attr("disabled")){
                //box is checked by default, check our box
                divTag.addClass(options.disabledClass);
            }

            //cxlt: bind label hovers
            attachLabelHover($(elem), divTag);

            storeElement(elem);

        };

        function doFile(elem){
        // clint.tseng@socrata.com 19/05/10:
        // setting filename not working with multiple file inputs
          var $el = $(elem);

            var divTag = $('<div />'),
                filenameTag = $('<span>' +
                    $.htmlEscape(options.fileDefaultText) + '</span>'),
                btnTag = $('<span>' +
                    $.htmlEscape(options.fileBtnText) + '</span>');

            divTag.addClass(options.fileClass).addClass(options.globalClass);
            filenameTag.addClass(options.filenameClass);
            btnTag.addClass(options.fileBtnClass);

            if(options.useID){
                divTag.attr("id", options.idPrefix+"-"+$el.attr("id"));
            }

            //wrap with the proper elements
            $el.wrap(divTag);
            $el.after(btnTag);
            $el.after(filenameTag);

            //redefine variables
            divTag = $el.closest("div");
            filenameTag = $el.siblings("."+options.filenameClass);
            btnTag = $el.siblings("."+options.fileBtnClass);

            //set the size
            if(!$el.attr("size")){
                var divWidth = divTag.width();
                //$el.css("width", divWidth);
                $el.attr("size", divWidth/10);
            }

          // clint.tseng@socrata.com 19/05/10:
          // setting filename not happening if form input was
          // preserved
          var setFilename = function()
          {
              var filename = $el.val();

              if (filename === '')
              {
                  filename = options.fileDefaultText;
              }
              else
              {
                  filename = filename.split(/[\/\\]+/);
                  filename = filename[(filename.length-1)];
                  filenameTag.text(filename);
              }
          }
          setFilename();

          //actions
          $el
            .css("opacity", 0)
            .focus(function(){
                divTag.addClass(options.focusClass);
            })
            .blur(function(){
                divTag.removeClass(options.focusClass);
            })
            .mousedown(function() {
              if(!$(elem).is(":disabled")){
                divTag.addClass(options.activeClass);
              }
            })
            .mouseup(function() {
                divTag.removeClass(options.activeClass);
            })
            .hover(function() {
                divTag.addClass(options.hoverClass);
            }, function() {
                divTag.removeClass(options.hoverClass);
            });

          // clint.tseng@socrata.com 20/05/10:
          // IE7 not updating file input as expected
          if ($.browser.msie)
          {
              // IE suspends timeout fires until after the file select
              // chrome is dismissed
              $el.click(function() {
                  setTimeout(setFilename, 0);
              });
          }
          else
          {
              $el.change(setFilename);
          }

          //handle defaults
          if($el.attr("disabled")){
                //box is checked by default, check our box
                divTag.addClass(options.disabledClass);
            }

            storeElement(elem);

        }

        function storeElement(elem){
          //store this element in our global array
          elem = $(elem).get();
          if(elem.length > 1){
            $.each(elem, function(i, val){
              $.uniform.elements.push(val);
            });
          }else{
            $.uniform.elements.push(elem);
          }
        }

        $.uniform.update = function(elem){
          if(elem == undefined){
            elem = $($.uniform.elements);
          }
          //sanitize input
          elem = $(elem);

          elem.each(function(){
            //do to each item in the selector
            //function to reset all classes
            var $e = $(this);
            if ($e.parents('body').length < 1) { return; }

            var spanTag;
            var divTag;
            if($e.is("select")){
                //element is a select
                spanTag = $e.siblings('div').find('span');
                divTag = $e.parent("div");

                divTag.removeClass(options.hoverClass+" "+options.focusClass+" "+options.activeClass);

                //reset current selected text
                spanTag.html($.htmlEscape($e.find(":selected").text()));

                if($e.is(":disabled")){
                    divTag.addClass(options.disabledClass);
                }else{
                  divTag.removeClass(options.disabledClass);
                }

            }else if($e.is(":checkbox")){
                //element is a checkbox
                spanTag = $e.closest("span");
                divTag = $e.closest("div");

                  divTag.removeClass(options.hoverClass+" "+options.focusClass+" "+options.activeClass);
                  spanTag.removeClass(options.checkedClass);

                if($e.is(":checked")){
                    spanTag.addClass(options.checkedClass);
                }
                if($e.is(":disabled")){
                    divTag.addClass(options.disabledClass);
                }else{
                    divTag.removeClass(options.disabledClass);
                }

            }else if($e.is(":radio")){
                //element is a radio
                spanTag = $e.closest("span");
                divTag = $e.closest("div");

                divTag.removeClass(options.hoverClass+" "+options.focusClass+" "+options.activeClass);
                spanTag.removeClass(options.checkedClass);

                if($e.is(":checked")){
                    spanTag.addClass(options.checkedClass);
                }

                if($e.is(":disabled")){
                    divTag.addClass(options.disabledClass);
                }else{
                    divTag.removeClass(options.disabledClass);
                }
            }else if($e.is(":file")){
              divTag = $e.parent("div");
              var filenameTag = $e.siblings(options.filenameClass);
              var btnTag = $e.siblings(options.fileBtnClass);

              divTag.removeClass(options.hoverClass+" "+options.focusClass+" "+options.activeClass);

              filenameTag.text($e.val());

              if($e.is(":disabled")){
                    divTag.addClass(options.disabledClass);
                }else{
                    divTag.removeClass(options.disabledClass);
                }
            }
          });
        };

        function attachLabelHover($e, divTag)
        {
            // cxlt: yeah, it really should be hover, but they're styled the same.
            // cxlt2: go up one level; assume the label is on the same nest as the orig input
            var id = $e.attr('id');
            if (!$.isBlank(id))
            {
                divTag.parent().delegate('label[for="' + id + '"]', 'mouseover', function()
                {
                    divTag.addClass('focus');
                });
                divTag.parent().delegate('label[for="' + id + '"]', 'mouseout', function()
                {
                    divTag.removeClass('focus');
                });
            }
        };

        return this.each(function() {
            if($.selectOpacity){
                var elem = $(this);

                if (elem.data('jquery.uniformed') === true)
                { return; }

                if(elem.is("select")){
                    //element is a select
                    if(elem.attr("multiple") != true){
                      //element is not a multi-select
                      doSelect(elem);
                    }
                }else if(elem.is(":checkbox")){
                    //element is a checkbox
                    doCheckbox(elem);
                }else if(elem.is(":radio")){
                    //element is a radio
                    doRadio(elem);
                }else if(elem.is(":file")){
                  //element is a file upload
                  doFile(elem);
                }

                elem.data('jquery.uniformed', true);
            }
        });
    };
})(jQuery);
