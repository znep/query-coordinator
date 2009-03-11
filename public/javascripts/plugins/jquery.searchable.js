/*
 * jQuery Table Search plugin 1.0
 * Released: Feb 05, 2009
 * 
 * Copyright (c) 2008 Seetha Ramaiah Mangamuri
 * Email: M8R-tk5fe51@mailinator.com
 * 
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * @license http://www.opensource.org/licenses/mit-license.php
 * @license http://www.gnu.org/licenses/gpl.html
 * @project jquery.numberInput
 */

(function($){
    $.fn.searchable = function(){
        return this.each(function(){
            var targetTable = this;
            $('<input/>').insertBefore(targetTable).before('Search:').keyup(function(event){
                event.preventDefault();
                var c = event.keyCode;
                // Check for conditions to trigger auto-search
                if ( (c == 8) || (c == 46) || (c == 109 || c == 189) || (c >= 65 && c <= 90) || (c >= 48 && c <= 57) ) {
                    var keyword = new RegExp($(this).val(), "i");
                    $('tbody tr', targetTable).each(function(){
                        var $tr = $(this);
                        $('td', $tr).filter(function(){
                            return keyword.test($(this).html());
                        }).length ? $tr.show() : $tr.hide();
                    });
                }
            });
        });
    };
})(jQuery);