(function($)
{
    $.blistEditor.stars = function(options, dom)
    {
        this.settings = $.extend({}, $.blistEditor.stars.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    var renderStars = function(editObj)
    {
        editObj.$editor().find('.star').removeClass('star-on')
            .slice(0, editObj.curValue).addClass('star-on');
    };

    var starHover = function(editObj, event)
    {
        editObj.$editor().addClass('hover').find('.star').removeClass('star-on');
        $(event.currentTarget).prevAll('.star').andSelf().addClass('star-on');
    };

    var starOut = function(editObj, event)
    {
        editObj.$editor().removeClass('hover');
        renderStars(editObj);
    };

    var starClick = function(editObj, event)
    {
        editObj.curValue = editObj.$editor().removeClass('hover')
            .find('.star').index($(event.currentTarget)) + 1;
    };

    var starKeyDown = function(editObj, event)
    {
        if (event.keyCode == 32)
        {
            // Don't let grid catch a space!
            event.stopPropagation();
            if (event.shiftKey) { editObj.curValue--; }
            else { editObj.curValue++; }
            if (editObj.curValue > editObj.range()) { editObj.curValue = 0; }
            if (editObj.curValue < 0) { editObj.curValue = editObj.range(); }
            renderStars(editObj);
        }
        else if (event.keyCode >= 48 && event.keyCode <= 57)
        {
            // Handle just numbers
            var num = event.keyCode - 48;
            if (num <= editObj.range())
            {
                editObj.curValue = num;
                renderStars(editObj);
            }
        }
    };

    $.extend($.blistEditor.stars, $.blistEditor.extend(
    {
        prototype:
        {
            $editor: function()
            {
                if (!this._$editor)
                {
                    var align = this.column.alignment ?
                        ' align-' + this.column.alignment : '';
                    var edHtml = '<div class="blist-table-editor blist-td ' +
                        'type-' + this.column.type + align + '">' +
                        '<input />';
                    for (var i = 0; i < this.range(); i++)
                    {
                        edHtml += '<div class="star' +
                            (i < this.originalValue ? ' star-on' : '') +
                            '"></div>';
                    }
                    edHtml += '</div>';
                    this._$editor = $(edHtml);
                }
                return this._$editor;
            },

            editorInserted: function()
            {
                var editObj = this;
                editObj.curValue = editObj.originalValue;
                editObj.$dom()
                    .click(function() { editObj.focus(); })
                        .find('.star')
                        .mousedown(function(e) { e.stopPropagation(); })
                        .mouseup(function(e) { e.stopPropagation(); })
                        .mouseenter(function(e) { starHover(editObj, e); })
                        .mouseleave(function(e) { starOut(editObj, e); })
                        .click(function(e) { starClick(editObj, e); })
                    .end()
                        .find(':input')
                        .keypress(function(e)
                            { if (e.keyCode == 32) { e.stopPropagation(); } })
                        .keydown(function(e) { starKeyDown(editObj, e); });
            },

            range: function()
            {
                if (this._range === undefined)
                {
                    this._range = parseFloat(this.column.range);
                    if (this._range <= 0 || isNaN(this._range)) { this._range = 5; }
                }
                return this._range;
            },

            currentValue: function()
            {
                return this.curValue === 0 ? null : this.curValue;
            },

            focus: function()
            {
                this.$dom().find(':input').focus();
            }
        }
    }));

})(jQuery);
