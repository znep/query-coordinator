/*
 * jQuery Table Search plugin 1.0
 * Released: Feb 05, 2009
 * 
 * Copyright (c) 2008 Seetha Ramaiah Mangamuri
 * Email: M8R-tk5fe51@mailinator.com
 *
 * Revisions for blist by: pete.stuart@blist.com
 * March, 2009
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
    $.fn.searchable = function(options){
        var opts = $.extend({}, $.fn.searchable.defaults, options);
        
        return this.each(function(){
            var targetTable = this;
            
            $(opts.searchFormSelector).submit(function(event){
                event.preventDefault();
                
                var keyword = new RegExp($(opts.searchInputSelector).val(), "i");
                $(opts.searchRowSelector, targetTable).each(function(){
                    var $tr = $(this);
                    $('td', $tr).filter(function(){
                        return keyword.test($(this).html());
                    }).length ? $tr.removeClass("filteredOut") : $tr.addClass("filteredOut");
                });
                opts.searchCompleteCallback();
            });
        });
    };
    
    $.fn.searchable.defaults = {
        searchFormSelector: "form.blistsFind",
        searchInputSelector: "form.blistsFind input.textPrompt",
        searchRowSelector: "tr.item",
        searchCompleteCallback: function(){}
    }
})(jQuery);
