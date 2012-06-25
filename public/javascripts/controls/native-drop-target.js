;(function() {

$.Control.extend('nativeDropTarget', {
    _init: function()
    {
        var dObj = this;
        this._super.apply(dObj, arguments);

        if (!$.isBlank(dObj.settings.contentEditable))
        { dObj._isContentEditable = dObj.settings.contentEditable; }
        else
        {
            var ceAttr = dObj.$dom().attr('contentEditable');
            dObj._isContentEditable = ceAttr === true || ceAttr == 'true';
        }

        var $ceParent = $(dObj.settings.contentEditableParent ||
            dObj.$dom().parent().closest('[contentEditable=true]'));
        if ($ceParent.length > 0)
        {
            dObj._inContentEditable = true;
            dObj._$ceParent = $ceParent;
        }

        dObj.enable();
    },

    enable: function()
    {
        var dObj = this;
        dObj.$dom().attr('dropzone', 'all string:text/plain string:text/html');
        dObj.$dom().on('drop.nativeDropTarget', function(e)
            {
                if (dObj._isContentEditable)
                { dObj.dropContentEditable(e); }
                else
                { dObj.dropStandard(e); }
            })
            .on('dragover.nativeDropTarget', function(e) { dObj.dragOver(e); })
            .on('dragenter.nativeDropTarget', function(e) { dObj.dragEnter(e); });
    },

    disable: function()
    {
        this.$dom().attr('dropzone', 'none');
        this.$dom().off('.nativeDropTarget');
    },

    dropStandard: function(e)
    {
        var dObj = this;
        e.preventDefault();

        var t = e.originalEvent.dataTransfer.getData('Text');
        var didReplace = false;
        var cpDropTag = $.nativeDraggable.copyDropTag;
        if (t.startsWith('move:'))
        {
            var $repItem = dObj.settings.findReplacement(t.slice(5));
            if (!$.isBlank($repItem) && $repItem.length > 0)
            {
                dObj.$dom().replaceWith($repItem);
                didReplace = true;
            }
        }
        else if (t.startsWith(cpDropTag.begin))
        {
            if (dObj.settings.copyReplace(t.slice(cpDropTag.begin.length,
                    t.length - cpDropTag.end.length)))
            { didReplace = true; }
        }

        if (didReplace)
        {
            if (_.isFunction(dObj.settings.replacedCallback))
            { dObj.settings.replacedCallback(); }
            dObj._$ceParent.trigger('content-changed');
        }
    },

    dropContentEditable: function(e)
    {
        var dObj = this;
        _.defer(function()
        {
            // Only handles a copy from nativeDraggable
            if ($.browser.msie)
            {
                dObj.$dom().trigger('content-changed');
                findNewDropped(dObj);
            }
            else
            {
                dObj.$dom().find('[data-droppedcopy]').quickEach(function()
                { dObj.addNewDropped(this.attr('data-droppedcopy'), this) });
            }
        });
    },

    dragEnter: function(e)
    {
        if (this._isContentEditable)
        { this.$dom().attr('contentEditable', true); }
    },

    dragOver: function(e)
    {
        if (!this._isContentEditable)
        {
            e.preventDefault();
            // Chrome requires copy
            e.originalEvent.dataTransfer.dropEffect = 'copy';
        }
    },

    // Common things to do to hook up a newly-added item
    addNewDropped: function(dropId, $replaceNode)
    {
        var $newItem = this.settings.newItemDrop(dropId);
        if (!$.isBlank($newItem))
        { $replaceNode.replaceWith($newItem); }
        this.$dom().trigger('content-changed');
    }

}, {
    contentEditable: null,
    contentEditableParent: null,
    newItemDrop: function(dropId) { return null; },
    replacedCallback: function() {}
});

// Special IE hack to find the text that was dropped in and replace it with a real item
var findNewDropped = function(dObj, $curNode)
{
    $curNode = $curNode || dObj.$dom();
    var cpTag = $.nativeDraggable.copyDropTag;
    if ($curNode.text().indexOf(cpTag.begin) > -1)
    {
        $curNode.contents().quickEach(function()
        {
            var t = this[0];
            var tbi, tei;
            if (t.nodeType == 3 &&
                (tbi = t.nodeValue.indexOf(cpTag.begin)) > -1 &&
                (tei = t.nodeValue.indexOf(cpTag.end)) > tbi + cpTag.begin.length)
            {
                var newDropId = t.splitText(tbi);
                newDropId.splitText(tei - tbi + cpTag.end.length);
                dObj.addNewDropped(newDropId.nodeValue.slice(cpTag.begin.length,
                    newDropId.nodeValue.length - cpTag.end.length), $(newDropId));
            }
            else if (t.nodeType == 1)
            { findNewDropped(dObj, this); }
        });
    }
};

})(jQuery);
