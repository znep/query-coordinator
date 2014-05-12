;(function($) {

var cleanFragment = function(fragment)
{
    // for now merely reduce everything down to paragraphs.
    // maybe someday try to extract lists, basic formatting.
    var $result = $(fragment.childNodes);

    // flatten out all inline things
    $result.find('*').each(function()
    {
        var $this = $(this);
        if ($this.is(':not(div, p, li, tr, th)'))
        {
            $this.replaceWith($this.contents());
        }
    });

    // flatten all block things into subsequent paragraphs
    var $paragraphs = $('<div/>');
    var $last = null;
    var lastWasText = false;

    var recurse = function($elem)
    {
        $elem.contents().each(function()
        {
            if (this.nodeType == 3) // 3 is a text node
            {
                var text = $.htmlEscape($(this).text());
                if (lastWasText)
                {
                    $last.append(text);
                }
                else
                {
                    $last = $('<p>' + text + '</p>');
                    $paragraphs.append($last);
                }
                lastWasText = true;
            }
            else
            {
                lastWasText = false;
                recurse($(this));
            }
        });
    };
    recurse($result);

    // if we only have one paragraph, don't paste as its own line
    if ($paragraphs.children().length === 1)
    {
        $paragraphs.replaceWith($paragraphs.contents());
    }

    // get the document fragment this $() represents
    if ($paragraphs.contents().length > 0)
    {
        return $paragraphs.contents().unwrap().get(0).parentNode;
    }
    else
    {
        // in case something unsuitable is pasted
        return fragment;
    }
};

// the following is repurposed from http://stackoverflow.com/questions/2176861/javascript-get-clipboard-data-on-paste-event-cross-browser
var extractContent = function(node)
{
    var frag = document.createDocumentFragment(), child;
    while (child = node.firstChild)
    {
        frag.appendChild(child);
    }
    return frag;
}

var handlePaste = function(div, event)
{
    // fix the height
    var $div = $(div);
    $div.css('height', $div.height() + 'px');

    // find and save the closest scrolled thing
    var $parents = $div.parents();
    var $scrolled = null;
    var scrollAmount = 0;
    $parents.each(function()
    {
        var $this = $(this);
        if ($this.scrollTop() && ($this.scrollTop() > 0))
        {
            $scrolled = $this;
            scrollAmount = $this.scrollTop();
            return false;
        }
    });

    // Store selection
    var savedSel = rangy.saveSelection();

    // Remove and store the editable content
    var frag = extractContent(div);

    // Schedule the post-paste processing
    window.setTimeout(function()
    {
        // Get pasted content
        var pastedFrag = extractContent(div);
        var cleanedFragment = cleanFragment(pastedFrag);

        // Restore original DOM
        div.appendChild(frag);

        // Restore previous selection
        var sel = rangy.getSelection();
        rangy.restoreSelection(savedSel);

        // Delete previous selection
        sel.deleteFromDocument();
        var lastNode = pastedFrag.lastChild;

        // Insert pasted content
        if (sel.rangeCount)
        {
            var range = sel.getRangeAt(0);
            range.insertNode(cleanedFragment);

            // Move selection to after the pasted content
            range.collapseAfter(lastNode);
            rangy.getSelection().setSingleRange(range);
        }

        // unfix the height
        $div.css('height', 'auto');

        // rescroll
        if ($scrolled)
        {
            $scrolled.scrollTop(scrollAmount);
        }
    }, 1);
};


// and this is reformatted from http://stackoverflow.com/questions/3997659/replace-selected-text-in-contenteditable-div
var replaceSelectedText = function(replacementText)
{
    var sel, range;
    if (window.getSelection)
    {
        sel = window.getSelection();
        if (sel.rangeCount)
        {
            range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(replacementText));
        }
    }
    else if (document.selection && document.selection.createRange)
    {
        range = document.selection.createRange();
        range.text = replacementText;
    }
};

// and here is a hallo plugin to wrap it all
$.widget('IKS.halloplainpaster', {
    _init: function()
    {
        // handle proper pastes
        this.element.on('paste', function(event)
        {
            handlePaste(this, event);
        });

        // fallback-handle keyboard pastes
        this.element.on('keypress', function(event)
        {
            if ((String.fromCharCode(event.charCode) == 'v') && (event.ctrlKey === true))
            {
                var selection = rangy.saveSelection();

                var $textarea = $('textarea');
                $textarea.appendTo('body')
                         .css('position', 'absolute')
                         .css('left', '-10000px');
                document.designMode = false;

                $textarea.focus();

                window.setTimeout(function()
                {
                    document.designMode = 'on';
                    rangy.restoreSelection(selection);
                    replaceSelectedText($textarea.text());
                    $textarea.remove();
                }, 1);
            }
        });
    }
});

})(jQuery);

