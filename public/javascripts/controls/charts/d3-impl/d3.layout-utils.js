var d3ns = blist.namespace.fetch('blist.d3');

d3ns.slottedCircleLayout = function($)
{
    // SlottedCircleLayout is a layout engine for arranging a series of rectangles
    // around the outside edge of a circle, within a bounding area. The layout area
    // is divided into slots of slotHeight. Data is then placed into the closest
    // available slot based on datumDesiredPosition.
    // slotHeight : Height of one slot, ergo the height of all data.
    //              This layout assumes all data take the same height.
    // limitRadius: Radius of the circle to place things around.
    // center     : Center point of circle. Expects .x and .y properties.
    // layoutSize : Size of the layout. The circle is assumed to sit exactly
    //              in the middle. This will need to be changed once pie zoom
    //              is enabled.
    // datumWidth : Function, taking a datum. Returns a float representing
    //              the width of a specific datum.
    // datumDesiredPosition : Function, taking a datum. Returns an [x,y] pair
    //              array indicating the desired position of the datum.
    var constructor = function(slotHeight, limitRadius, center, layoutSize, datumWidth, datumDesiredPosition)
    {
        this.slotHeight = slotHeight;
        this.limitRadius = limitRadius;
        this.center = center;
        this.layoutSize = layoutSize;
        this.datumWidth = datumWidth;
        this.datumDesiredPosition = datumDesiredPosition;

        // Multiply by 2 because we have slots on either side of the circle.
        this.slotCount = Math.floor(2 * layoutSize.height / slotHeight);

        this.slotRegistry = [];

        this._computeSlotLimits();
    };

    // Compute the layout for the given data.
    // Data is for expected in clockwise order! Again, each datum MUST show up
    // clockwise from the previous datum, no matter what datumDesiredPosition says!
    // Nothing fundamental prevents us from changing this, but it would complicate
    // the code in ways that do not serve our current uses of the code.
    // Objects in the array are augmented with a .slottedCircleLayout property,
    // of the following form:
    // {
    //    size: the size provided by datumWidth.
    //    x: final x-coordinate relative to 0,0
    //    y: final y-coordinate relative to 0,0
    //    width: final width
    //    height: height of layout slot (should all be the same).
    // }
    constructor.prototype.data = function(dataArray)
    {
        if (!dataArray)
        {
            return this.data;
        }
        else
        {
            _.each(dataArray, this._insertDatum, this);
        }
    };

    // Inserts one datum into the layout. Expects data in clockwise order,
    // starting from top-rightmost.
    constructor.prototype._insertDatum = function(datum)
    {
        var cl = datum.slottedCircleLayout = {};

        var size = this.datumWidth(datum);
        cl.size = size;

        if (size == 0)
        {
            return;
        }

        // First, compute where this element wants to be.
        var desiredSlot = this._computeDesiredLayoutSlot(datum);
        cl.desiredSlot = desiredSlot;

        // Now try to get a free slot, shoving things around if need be.
        var actualSlot = this._getUnoccupiedSlot(desiredSlot);

        if (actualSlot !== null)
        {
            this._placeDatumIntoSlot(datum, actualSlot);
            cl.overflow = false;
        }
        else
        {
            //TODO do something special here?
            cl.overflow = true;
        }
    };

    // Place a datum into a given slot. Will throw if there's something
    // already there.
    constructor.prototype._placeDatumIntoSlot = function(datum, slot)
    {
        this._updateDatumPosition(datum, slot);
        this._setSlotDataForIndex(datum, slot);
    };

    constructor.prototype._computeSlot = function(x,y)
    {
        var leftSlot = Math.floor(y / this.slotHeight);

        if (x >= 0)
        {
            return -leftSlot - 1;
        }
        else
        {
            return leftSlot;
        }
    };

    // Assuming no other data is in the layout, where would this datum want to
    // go?
    constructor.prototype._computeDesiredLayoutSlot = function(datum)
    {
        var desiredPosition = this.datumDesiredPosition(datum);
        return this._computeSlot(desiredPosition[0], this.center.y + desiredPosition[1]);
    };

    // Get an unoccupied slot at or before startSlotIndex. It's worth repeating
    // that everything in this layout assumes you're going clockwise monotonically!
    // Will shove things out of the way if there isn't room available. However,
    // absolute ordering will always be preserved.
    constructor.prototype._getUnoccupiedSlot = function(startSlotIndex)
    {
        if (!this._slotOccupied(startSlotIndex))
        {
            // Short circuit, we already have our favorite spot!
            return startSlotIndex;
        }
        else
        {
            // We gotta be mean and shove slots around... Try going up first,
            // then fill downwards.
            var freeSlot = this._moveSlotsUp(startSlotIndex);
            if (freeSlot !== null) { return freeSlot; }
            return this._moveSlotsDown(startSlotIndex);
        }
    };

    // Look down and move things towards higher indexes to try to get some room
    // at slot index startSlotIndex.
    constructor.prototype._moveSlotsDown = function(startSlotIndex)
    {
        if (startSlotIndex >= 0)
        {
            // LHS
            var slotIndex = startSlotIndex;
            for (var slotIndex = startSlotIndex; slotIndex < this.slotCount / 2; slotIndex++)
            {
                if (!this._slotOccupied(slotIndex))
                {
                    // Okay, there's at least one slot available. We gotta
                    // figure out what to move down.

                    // Going backward, find the first slot we can't go above.
                    var firstWeCanGoAbove = null;
                    for (var i=slotIndex-1; i>startSlotIndex; i--)
                    {
                        var occupied = this._slotOccupied(i);
                        if (!occupied || !this._canGoAbove(i, startSlotIndex))
                        {
                            firstWeCanGoAbove = i+1;
                            break;
                        }
                    }

                    for (i=slotIndex; i>firstWeCanGoAbove; i--)
                    {
                        var datumToMove = this._getSlotDataForIndex(i-1);
                        this._setSlotDataForIndex(undefined, i-1);
                        this._placeDatumIntoSlot(datumToMove, i);
                    }
                    return firstWeCanGoAbove;
                }
            }
        }
        else
        {
            // RHS

            // If we're on the right side, easy. Just go down until we find something
            // available or we hit the bottom. TODO: Do similar things and call
            // makeRoomAt.
            var slotIndex = startSlotIndex;

            while(this._slotOccupied(slotIndex))
            {
                slotIndex --;
                if (slotIndex <= this.lastRHSSlotAllowed)
                {
                    // We ran out of slots... bail for now, we may want to
                    // implement n-layer slotting.
                    return null;
                }
            }
            return slotIndex;

        }
        return null;
    };

    // Look up and move things towards higher indexes to try to get some room
    // at <= slot index startSlotIndex.
    constructor.prototype._moveSlotsUp = function(startSlotIndex)
    {
        //$.assert(startSlotIndex >= 0, "Don't support room-making on RHS");

        if (startSlotIndex >= 0)
        {
            // LHS
            var slotIndex = 0;

            // Find the first thing we can go above.
            var firstEligibleSlot = null;
            var foundOccupied = false;
            for(slotIndex = 0; slotIndex <= startSlotIndex; slotIndex++)
            {
                var occupied = this._slotOccupied(slotIndex);
                foundOccupied |= occupied;
                if (occupied && this._canGoAbove(slotIndex, startSlotIndex))
                {
                    firstEligibleSlot = slotIndex;
                    break;
                }
            }

            $.assert(foundOccupied, 'Should always be an occupied slot with this method');

            if (firstEligibleSlot !== null && firstEligibleSlot >= 1)
            {
                var firstSlotWeNeedToMoveUp = firstEligibleSlot - 1;
                // Bingo, got something. Means we can possibly move
                // things up to fit us in. Try to find an empty slot above us.
                for(slotIndex = firstSlotWeNeedToMoveUp; slotIndex >= 0; slotIndex--)
                {
                    if (!this._slotOccupied(slotIndex))
                    {
                        // We can!
                        // Shove things up.
                        var firstEmptySlot = slotIndex;
                        for (var i=firstEmptySlot; i<firstSlotWeNeedToMoveUp; i++)
                        {
                            var datumToMove = this._getSlotDataForIndex(i+1);
                            this._setSlotDataForIndex(undefined, i+1);
                            this._placeDatumIntoSlot(datumToMove, i);
                        }
                        return firstSlotWeNeedToMoveUp;
                    }
                }
            }
        }
        else
        {
            //RHS
            // Simpler than LHS, as we don't have the possibility of us already
            // having placed data where we want to go.

            // Just convert everything to LHS indexes, then fix when necessary.
            // Prevents my brain meat from melting.
            var toggleCanonical = function(idx)
            {
                return (startSlotIndex >= 0) ? idx : -idx - 1;
            };
            var canonicalStartIndex = toggleCanonical(startSlotIndex);

            // So basically, we want to see if we can shove things upwards so our
            // desired spot becomes free.

            // Is there an empty slot above us we can push things into?
            var firstEmptySlotAbove = null;
            for(var slotIndex = canonicalStartIndex; slotIndex>=toggleCanonical(this.firstRHSSlotAllowed); slotIndex--)
            {
                if (!this._slotOccupied(toggleCanonical(slotIndex)))
                {
                    firstEmptySlotAbove = slotIndex;
                    break;
                }
            }

            if (firstEmptySlotAbove !== null)
            {
                // Move everything into that slot.
                for(var i = firstEmptySlotAbove; i<canonicalStartIndex; i++)
                {
                    var datumToMove = this._getSlotDataForIndex(toggleCanonical(i+1));
                    this._setSlotDataForIndex(undefined, toggleCanonical(i+1));
                    this._placeDatumIntoSlot(datumToMove, toggleCanonical(i));
                }
                return startSlotIndex;
            }
        }

        return null;
    };

    constructor.prototype._computeSlotLimits = function()
    {
        // On the RHS, we don't allow more than one thing at the very
        // bottom. Otherwise, if someone draws lines to the data's desired
        // location, the lines will cross (looks bad).

        var slotAtBottomEdge = this._computeSlot(1,
            Math.min(this.center.y + this.layoutSize.height/2,
                     this.center.y + this.limitRadius + this.slotHeight));

        var slotAtTopEdge = this._computeSlot(1,
            Math.max(0,
                     this.center.y - this.limitRadius - this.slotHeight));

        //TODO constrain this into real bounding rect...
        this.lastRHSSlotAllowed = slotAtBottomEdge;
        this.firstRHSSlotAllowed = slotAtTopEdge;
    };

    // Can the given datum wanting to go into checkSlotIndex be displayed the
    // datum already at baseSlotIndex?
    constructor.prototype._canGoAbove = function(baseSlotIndex, checkSlotIndex)
    {
        var baseDatumIndex = this._getSlotDataForIndex(baseSlotIndex).slottedCircleLayout.desiredSlot;

        return checkSlotIndex <= baseDatumIndex;

    };

    // Calculate where this item should go within the given slot, and
    // update public information with this info.
    constructor.prototype._updateDatumPosition = function(datum, layoutSlotIndex)
    {
        var cl = datum.slottedCircleLayout;
        var layoutSlot = this._getUnconstrainedLayoutSlot(layoutSlotIndex);
        this._constrainSlotAgainstCircle(layoutSlot);
        this._calculateLayoutSlotWidthForContent(layoutSlot, cl.size);

        //TODO reserve space for line.
        cl.x = layoutSlot.x;
        cl.y = layoutSlot.y;
        cl.width = layoutSlot.width;
        cl.height = this.slotHeight;
    };

    // Shrinks a layout slot around the given content width, making sure the
    // anchor stays where it should.
    constructor.prototype._calculateLayoutSlotWidthForContent = function(layoutSlot, contentWidth)
    {
        if (!layoutSlot.onRightSide)
        {
            layoutSlot.x = (layoutSlot.width + layoutSlot.x) - contentWidth;
        }
        layoutSlot.width = contentWidth;
    };

    // Simply returns layout dimensions for a given slot, assuming a circle of zero
    // radius (basically just care about the line splitting the layout left-right
    // at center.x).
    constructor.prototype._getUnconstrainedLayoutSlot = function(slotIndex)
    {
        var x, width;
        var onRightSide = slotIndex < 0;
        if (onRightSide)
        {
            width = this.layoutSize.width - this.center.x;
            x = this.center.x;
        }
        else
        {
            width = this.center.x;
            x = 0;
        }

        var y = this._slotY(slotIndex);

        return { x: x, y: y, width: width, onRightSide: onRightSide};
    };


    // Given a layout slot (x, y, width, height), chop out the area that is
    // occupied by the center circle.
    constructor.prototype._constrainSlotAgainstCircle = function(layoutSlot)
    {
        var hitTestLineY = layoutSlot.y + this.slotHeight / 2; // Y midpoint of slot.

        // Distance of hit test line from center along Y.
        var dY = Math.abs(hitTestLineY - this.center.y);

        var r = this.limitRadius;

        if (dY > this.limitRadius)
        {
            // Don't even hit the circle. We cool.
        }
        else
        {
            // Hit or graze the circle.

            // Calculate the distance
            var widthOfCircleAtHitTestLine = Math.sqrt(r*r - dY*dY);
            $.assert(widthOfCircleAtHitTestLine <= r, 'Math error');// s/Math/Idiot Programmer/

            var realAvailableWidth = Math.max(0, layoutSlot.width - widthOfCircleAtHitTestLine);
            $.assert(widthOfCircleAtHitTestLine >= 0, 'Math error'); // More idiot programmers.

            if (layoutSlot.onRightSide)
            {
                layoutSlot.x = widthOfCircleAtHitTestLine + this.center.x;
            }
            else
            {
                layoutSlot.x = 0;
            }

            layoutSlot.width = realAvailableWidth;
        }
    };

    constructor.prototype._slotOccupied = function(slotIndex)
    {
        return this._getSlotDataForIndex(slotIndex) !== undefined;
    };

    constructor.prototype._setSlotDataForIndex = function(setTo, slotIndex)
    {
        var regIndex = this._slotIndexToRegistryIndex(slotIndex);
        $.assert(setTo === undefined ||this.slotRegistry[regIndex] === undefined, 'Expected empty layout slot');
        this.slotRegistry[regIndex] = setTo;
    }

    constructor.prototype._getSlotDataForIndex = function(slotIndex)
    {
        return this.slotRegistry[this._slotIndexToRegistryIndex(slotIndex)];
    }

    // IMPORTANT NOTE ABOUT INDEXES!
    // Positive indexes go along left side of circle. Negative indexes go along
    // the right side!
    constructor.prototype._slotY = function(slotIndex)
    {
        // Compute where our slot is going to be on Y (looking at middle of slot).
        var slotsFromTop = slotIndex >= 0 ? slotIndex : -slotIndex - 1; // Remember, -1 is topmost slot on right.
        return slotsFromTop * this.slotHeight + this.slotHeight/2;
    };

    constructor.prototype._slotIndexToRegistryIndex = function(slotIndex)
    {
        return slotIndex + this.slotCount/2 + (slotIndex >= 0 ? 0 : -1);
    };

    constructor.prototype._debugPrintStatus = function(showEmpty)
    {
        console.log("RHS:");
        for (var i=0; i<this.slotCount/2; i++)
        {
            var realIdx = -i - 1;
            var data = this._getSlotDataForIndex(realIdx);
            var val = data ? data.data.getName() + ' ('+data.data.getValueText()+')': '[empty]';
            if (data || showEmpty)
            {
                console.log(i + ' ('+realIdx+'): ' + val);
            }
        }
        console.log("LHS:");
        for (var i=0; i<this.slotCount/2; i++)
        {
            var data = this._getSlotDataForIndex(i);
            var val = data ? data.data.getName() + ' ('+data.data.getValueText()+')': '[empty]';
            if (data || showEmpty)
            {
                console.log(i + ': ' + val);
            }
        }
    };

    return constructor;

}(jQuery);
