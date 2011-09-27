/**
 * Component drag logic.
 */
(function($) {
    $.cf.ComponentDrag = function($target, event) {
        // Are we adding a new component or dragging an existing one?
        var isNew;

        // Metadata for the component we're dragging for creates
        var type;

        // Metadata for the component we're dragging for moves
        var child;

        // Source information if this is a move (vs "add")
        var oldContainer;
        var oldPosition;

        // The component we're moving
        var $moving;

        // Offset of top-left corner of moving component from pointer position
        var adjustX;
        var adjustY;

        // The placeholder we use to indicate where a drag will land
        var placeholder = new $.component.Placeholder();

        // The current container taking receipt of the drop
        var container;

        // The position in the container at which we drop
        var position;

        // A wrapping container used to temporarily support drop into perpendicular orientation
        var temporaryWrapper;

        // The child node we wrapped
        var wrapped;

        // Position the drag element
        function setPosition(event) {
            $moving.css('left', event.pageX + adjustX)
                .css('top', event.pageY + adjustY);
        }

        // Test whether a container is a component wrapper (that is, a simple container that is not the root)
        function isWrapper(container) {
            return container
                && (container.typeName == 'Container' || container.typeName == 'HorizontalContainer')
                && container.parent;
        }

        // Identify the container for a mouse event and execute a function on the container
        function findContainer(event) {
            // If the element is in edit chrome, ignore it
            var $top = $('.socrata-cf-top');
            if ($top.length && event.pageY < $top.offset().top + $top[0].offsetHeight)
                return false;
            var $side = $('.socrata-cf-side');
            if ($side.length && event.pageX >= $side.offset().left)
                return false;

            var closestContainer;
            var closestContainerDistance = 1e9;

            // Find all containers in the page that support drag/drop.  We will use this for hit-testing.  Reverse sort so
            // that during hit detection we encounter children before parents
            var $containers = $('.socrata-container').closest('.socrata-component').filter(function() {
                if ($(this).closest('.socrata-cf-drag-shell').length)
                    return false;
                return this._comp && this._comp.drag !== false;
            });
            Array.prototype.reverse.apply($containers);

            // Scan containers to find the one that contains the event.  Also detect the container closest to the
            // mouse in case no containers hit
            for (var i = 0; i < $containers.length; i++) {
                var dom = $containers[i];
                var tl = $(dom).offset();
                var w = dom.offsetWidth;
                var h = dom.offsetHeight;

                if (event.pageX < tl.left)
                    var xdist = tl.left - event.pageX;
                else if (event.pageX > tl.left + w)
                    xdist = event.pageX - tl.left - w;
                else
                    xdist = 0;

                if (event.pageY < tl.top)
                    var ydist = tl.top - event.pageY;
                else if (event.pageY > tl.top + h)
                    ydist = event.pageY - tl.top - h;
                else
                    ydist = 0;

                // This is a hit
                if (!xdist && !ydist)
                   return dom._comp;

                // Determine distance and record the container if closer than the previous container
                var dist = Math.sqrt(xdist * xdist + ydist * ydist);
                if (dist < closestContainerDistance) {
                    closestContainer = dom._comp;
                    closestContainerDistance = dist;
                }
            }

            return closestContainer;
        }

        // Identify the child within the container that we will drop relative to and the orientation of the drop
        function findTarget(event, container) {
            // Find the target sibling
            var sibbounds;
            var child = container.last;
            var prevSibbounds;
            while (child) {
                prevSibbounds = sibbounds;

                var sibw = child.dom.offsetWidth;
                var sibh = child.dom.offsetHeight;
                sibbounds = $(child.dom).offset();

                sibbounds.right = sibbounds.left + sibw;
                sibbounds.bottom = sibbounds.top + sibh;
                if (container.horizontal) {
                    if (event.pageX > sibbounds.left)
                        break;
                } else if (event.pageY > sibbounds.top)
                    break;

                child = child.prev;
            }

            if (child == placeholder) {
                child = child.next;
                sibbounds = prevSibbounds;
            }

            if (!child)
                return {};

            // Retrieve configuration for primary and secondary axis (depending on container layout)
            var axisX = {
                horizontal: true,
                at: event.pageX,
                from: 'left',
                to: 'right'
            };
            var axisY = {
                horizontal: false,
                at: event.pageY,
                from: 'top',
                to: 'bottom'
            };
            if (container.horizontal)
                var primary = axisX, secondary = axisY;
            else
                primary = axisY, secondary = axisX;

            // Find orientation.  Secondary axis triggers if pointer is within 10% of child edge; primary axis
            // otherwise
            var secondaryAxisLength = sibbounds[secondary.to] - sibbounds[secondary.from];
            var secondaryDropWidth = secondaryAxisLength / 10;
            if (sibbounds[secondary.from] + secondaryDropWidth > secondary.at) {
                var axis = secondary;
                var orientation = secondary.from;
            } else if (sibbounds[secondary.to] - secondaryDropWidth < secondary.at) {
                axis = secondary;
                orientation = secondary.to;
            } else {
                axis = primary;
                var primaryAxisLength = sibbounds[primary.to] - sibbounds[primary.from];
                var primaryAxisMidpoint = sibbounds[primary.from] + primaryAxisLength / 2;
                if (primary.at < primaryAxisMidpoint)
                    orientation = primary.from;
                else
                    orientation = primary.to;
            }

            return {
                horizontal: axis.horizontal,
                perpendicular: axis == secondary,
                child: child,
                orientation: orientation
            };
        }

        // Handle mouse movement
        function onMouseMove(event) {
            setPosition(event);
            
            container = findContainer(event);
            if (!container) {
                placeholder.remove();
                return;
            }

            var target = findTarget(event, container);
            if (target) {
                // If orientation is perpendicular to the target container's orientation, we need to wrap the child's
                // container -- unless the container is already a temporary wrapper, in which case we can simply unwrap
                if (target.perpendicular && target.child) {
                    if (container == temporaryWrapper) {
                        // Reverting to original orientation within temporary wrapper -- lose the wrapper
                        placeholder.remove();
                        container = temporaryWrapper.parent;
                        $.component.Container.unwrap(target.child);
                        temporaryWrapper = undefined;
                    } else {
                        // If we have an existing temporary wrapper, it is no longer needed so record for unwrapping
                        if (temporaryWrapper)
                            var unwrap = temporaryWrapper;

                        // Unwrap if it will give us a proper drop destination container; otherwise create a new
                        // temporary wrapper
                        if (isWrapper(container)
                            && container.parent.horizontal == target.horizontal
                            && container.count() <= (container == placeholder.parent ? 2 : 1)
                        )
                            // Ignore uneeded container -- grandparent has correct orientation
                            container = container.parent;
                        else {
                            // Create a new temporary wrapper
                            temporaryWrapper = $.component.Container.wrap(wrapped = target.child, { type: target.horizontal ? 'HorizontalContainer' : 'Container' });
                            container = temporaryWrapper;
                        }
                    }
                }

                if (target.orientation == 'right' || target.orientation == 'bottom') {
                    position = target.child.next;
                    if (position == placeholder)
                        position = placeholder.next;
                } else
                    position = target.child;
            }

            // At this point if a temporary wrapper is still in effect but it is not the target container, record
            // for removal
            if (temporaryWrapper && container != temporaryWrapper) {
                unwrap = temporaryWrapper;
                temporaryWrapper = undefined;
            }

            // Move the placeholder
            container.add(placeholder, position);

            // Remove any unused temporary wrapper
            if (unwrap)
                $.component.Container.unwrap(unwrap.first);
        }

        // Perform actual move after "drop" animation
        function afterDropAnimation() {
            $moving.remove();
            placeholder.remove();

            try {
                $.cf.edit.beginTransaction();

                // If we added a temporary wrapper, add operations to recreate current state
                if (temporaryWrapper)
                    $.cf.edit.executed('wrap', {
                        containerTemplate: {
                            id: temporaryWrapper.id,
                            type: temporaryWrapper.type
                        },
                        child: wrapped
                    });

                // Perform the actual add or move
                if (isNew)
                    $.cf.edit.execute('add', {
                        container: container,
                        position: position,
                        type: type
                    });
                else if (container)
                    $.cf.edit.execute('move', {
                        newContainer: container,
                        newPosition: position,
                        oldContainer: oldContainer,
                        oldPosition: oldPosition,
                        child: child
                    });
                else
                    $.cf.edit.execute('remove', {
                        component: child,
                        container: oldContainer,
                        position: oldPosition
                    });

                // If the old container was a wrapper that is no longer needed, remove it to keep our structure clean
                if (isWrapper(oldContainer) && oldContainer.first == oldContainer.last)
                    if (oldContainer.first)
                        // Unwrap
                        $.cf.edit.execute('unwrap', {
                            childID: oldContainer.first.id,
                            containerTemplate: {
                                id: oldContainer.id,
                                type: oldContainer.type
                            }
                        });
                    else
                        // Hmm, this was an empty container.  Shouldn't have happened.  Just remove it
                        $.cf.edit.execute('remove', {
                           node: oldContainer
                        });

                $.cf.edit.commit();
            } finally {
                // This call is ignored if we commit successfully
                $.cf.edit.rollback();
            }
        }

        // Handle mouse button release
        function onMouseUp(event) {
            // Simply abort the drag if nothing actually changes
            if (isNew ? !container : container == oldContainer && position == oldPosition) {
                abortDrag();
                return;
            }

            var width = $moving[0].offsetWidth;
            var height = $moving[0].offsetHeight;

            if (container)
                var to = $.extend($(placeholder.dom).offset(), {
                    width: placeholder.dom.offsetWidth,
                    height: placeholder.dom.offsetHeight,
                    opacity: .2
                });
            else
                to = {
                    opacity: 0
                }

            $moving
                .width(width)
                .height(height)
                .addClass('socrata-cf-adding')
                .animate(to, 200, 'linear',
                    function() {
                        // Defer final add because otherwise if this code crashes (which frequently it does during
                        // component development) jQuery never terminates its animation timer, net result being a
                        // highly annoying infinite loop of errors
                        setTimeout(afterDropAnimation, 1);
                    }
                );

            terminateDrag();
        }

        // Disable clicks
        function onMouseClick(event) {
            event.preventDefault();
        }

        // Stop drag and revert dragged item to its home position
        function abortDrag() {
            if (isNew) {
                placeholder.remove();
                $moving.animate($target.offset(), 200, 'linear', function() {
                    $moving.remove();
                });
            } else {
                oldContainer.add(placeholder, oldPosition);
                $moving.animate($(placeholder.dom).offset, 200, 'linear', function() {
                    $moving.remove();
                    placeholder.remove();
                    oldContainer.add(child, oldPosition);
                });
            }
            if (temporaryWrapper)
                $.component.Container.unwrap(wrapped);
            terminateDrag();
        }

        // Unbind drag events
        function terminateDrag() {
            $(document.body)
                .unbind('mousemove', onMouseMove)
                .unbind('mouseup', onMouseUp)
                .unbind('click', onMouseClick);
        }

        // Setup
        function setup() {
            // Determine what we're interacting with
            var match = /(icon|component)-(\S+)/.exec($target.attr('class'));
            if (!match)
                return false;
            type = $.component[match[2]];
            if (!type)
                return false;
            isNew = match[1] == "icon";

            // Compute the offset for positioning the element relative to the mouse
            var offset = $target.offset();
            adjustX = offset.left - event.pageX;
            adjustY = offset.top - event.pageY;

            return true;
        }
        if (!setup())
            return;

        // Initiate the drag
        if (isNew) {
            // Dragging from icon.  Create a copy to move around the screen
            $moving = $('<div class="socrata-cf-drag-icon icon-' + type.typeName + '">' + $target.html() + '</div>');
        } else {
            // Drag existing component.  Create a shell into which we will put the rendered component
            $moving = $('<div class="socrata-cf-drag-shell"></div>');
            $moving.css({ width: $target[0].offsetWidth, height: $target[0].offsetHeight });

            // Record the child's position
            child = $target[0]._comp;
            oldContainer = child.parent;
            oldPosition = child.next;

            // Replace the child with the placeholder
            placeholder.weight = child.weight;
            child.remove();
            oldContainer.add(placeholder, oldPosition);

            // Stick the child into the moving container
            $moving.append($target);
        }

        setPosition(event);
        $(document.body).append($moving);
        $(document.body).mousemove(onMouseMove).mouseup(onMouseUp).click(onMouseClick);

        $.cf.edit.focus(false);
    }
})(jQuery);
