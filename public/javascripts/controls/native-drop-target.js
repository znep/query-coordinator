;(function() {

    var exclusiveDropTarget;

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

    enable: function(isSoft)
    {
        var dObj = this;
        dObj.$dom().attr('dropzone', 'all string:text/plain string:text/html');
        if (!isSoft)
        {
            dObj._enabled = true;
            dObj.$dom().on('drop.nativeDropTarget', function(e)
                {
                    if (dObj._isContentEditable)
                    { dObj.dropContentEditable(e); }
                    else
                    { dObj.dropStandard(e); }
                })
                .on('dragover.nativeDropTarget', function(e) { dObj.dragOver(e); })
                .on('dragenter.nativeDropTarget', function(e) { dObj.dragEnter(e); })
                .on('dragleave.nativeDropTarget', function(e) { dObj.dragLeave(e); });
            if (_.isFunction(dObj.settings.acceptCheck) && !$.isBlank($.nativeDraggable))
            {
                $.nativeDraggable.bind('drag_start', function($item)
                {
                    if (dObj.settings.acceptCheck($item))
                    { dObj.enable(true); }
                    else
                    { dObj.disable(true); }
                }, dObj);
            }
        }
    },

    disable: function(isSoft)
    {
        this.$dom().attr('dropzone', 'none');
        if (!isSoft)
        {
            this.$dom().off('.nativeDropTarget');
            if (!$.isBlank($.nativeDraggable)) { $.nativeDraggable.unbind(null, null, this); }
            this._enabled = false;
        }
    },

    canAcceptDrop: function()
    {
        return this.$dom().attr('dropzone') != 'none';
    },

    dropStandard: function(e)
    {
        var dObj = this;
        if (!dObj._active || !dObj.canAcceptDrop()) { return; }

        e.preventDefault();

        var di = getDropInfo(e);
        var didReplace = false;
        if (di.type == 'move')
        {
            var $repItem = dObj.settings.findReplacement(di.id);
            if (!$.isBlank($repItem) && $repItem.length > 0)
            {
                dObj.$dom().replaceWith($repItem);
                didReplace = true;
            }
        }
        else if (di.type == 'copy')
        {
            if (dObj.settings.copyReplace(di.id))
            { didReplace = true; }
        }

        if (didReplace)
        {
            if (_.isFunction(dObj.settings.replacedCallback))
            { dObj.settings.replacedCallback(); }
            dObj._$ceParent.trigger('content-changed');
        }

        dObj._deactivate();
        dObj.settings.dropCallback(di.id, di.type);
    },

    dropContentEditable: function(e)
    {
        var dObj = this;
        if (!dObj.canAcceptDrop()) { return; }

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
        dObj._deactivate();
    },

    dragEnter: function(e)
    {
        if (!this.canAcceptDrop()) { return; }

        e.stopPropagation();

        if (this._isContentEditable)
        { this.$dom().attr('contentEditable', true); }
    },

    dragOver: function(e)
    {
        if (!this.canAcceptDrop()) { return; }

        e.stopPropagation();

        if (this.settings.dragOverCallback(getDragPos(this, e), getDropInfo(e)) === false)
        {
            this._deactivate();
            return;
        }

        if (!this._isContentEditable)
        {
            e.preventDefault();
            // Chrome requires copy
            e.originalEvent.dataTransfer.dropEffect = 'copy';
        }

        this._activate();
    },

    dragLeave: function(e)
    {
        var dObj = this;
        if (!dObj.canAcceptDrop()) { return; }
        e.stopPropagation();
        if ($.isBlank(dObj._leaveDebounce))
        {
            dObj._leaveDebounce = setTimeout(function()
                    {
                        delete dObj._leaveDebounce;
                        dObj._deactivate();
                    }, 100);
        }
    },

    // Common things to do to hook up a newly-added item
    addNewDropped: function(dropId, $replaceNode)
    {
        var $newItem = this.settings.newItemDrop(dropId);
        if (!$.isBlank($newItem))
        { $replaceNode.replaceWith($newItem); }
        this.$dom().trigger('content-changed');
    },

    _activate: function()
    {
        if (!$.isBlank(this._leaveDebounce))
        {
            clearTimeout(this._leaveDebounce);
            delete this._leaveDebounce;
        }

        if (this._active) { return; }

        this._active = true;
        this.$dom().addClass(this.settings.activeClass);

        if (!$.isBlank(exclusiveDropTarget))
        { exclusiveDropTarget._deactivate(); }
        exclusiveDropTarget = this;
    },

    _deactivate: function()
    {
        if (!this._active) { return; }

        this._active = false;
        this.$dom().removeClass(this.settings.activeClass);
        if (exclusiveDropTarget == this)
        { exclusiveDropTarget = null; }

        this.settings.dragLeaveCallback();
    }

}, {
    acceptCheck: null,
    activeClass: 'dropActive',
    contentEditable: null,
    contentEditableParent: null,
    copyReplace: function(dropId) { return null; },
    dropCallback: function(dropId, dropType) {},
    dragOverCallback: function(pos, dropInfo) {},
    dragLeaveCallback: function() {},
    findReplacement: function(dropId) { return null; },
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

var getDragPos = function(dObj, e)
{
    // Run through jQuery translate to get correct positions
    e = $.event.mouseHooks.filter(e, e.originalEvent);
    return {x: e.pageX, y: e.pageY};
};

var getDropInfo = function(e)
{
    var t = e.originalEvent.dataTransfer.getData('Text');
    var type;
    var cpDropTag = $.nativeDraggable.copyDropTag;
    if (t.startsWith('move:'))
    {
        type = 'move';
        t = t.slice(5);
    }
    else if (t.startsWith(cpDropTag.begin))
    {
        type = 'copy';
        t = t.slice(cpDropTag.begin.length, t.length - cpDropTag.end.length);
    }
    return { id: t, type: type };
};

})(jQuery);
