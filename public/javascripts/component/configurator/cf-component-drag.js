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

        // The component we're moving
        var $moving;

        // Offset of top-left corner of moving component from pointer position
        var adjustX;
        var adjustY;

        // All potential drop targets in the page, in reverse order
        var $containers;

        // The placeholder we use to indicate where a drag will land
        var placeholder;

        // The current container taking receipt of the drop
        var container;

        // The position in the container at which we drop
        var position;

        // Position the drag element
        function setPosition(event) {
            $moving.css('left', event.pageX + adjustX)
                .css('top', event.pageY + adjustY);
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
            while (child) {
                if (child != placeholder) {
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
                }
                
                child = child.prev;
            }

            if (!child)
                return {};

            // Retrieve configuration for primary and secondary axis (depending on container layout)
            var axisX = {
                at: event.pageX,
                from: 'left',
                to: 'right'
            };
            var axisY = {
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
            if (sibbounds[secondary.from] + secondaryDropWidth > secondary.at)
                var orientation = secondary.from;
            else if (sibbounds[secondary.to] - secondaryDropWidth < secondary.at)
                orientation = secondary.to;
            else {
                var primaryAxisLength = sibbounds[primary.to] - sibbounds[primary.from];
                var primaryAxisMidpoint = sibbounds[primary.from] + primaryAxisLength / 2;
                if (primary.at < primaryAxisMidpoint)
                    orientation = primary.from;
                else
                    orientation = primary.to;
            }

            return {
                child: child,
                orientation: orientation
            };
        }

        // Handle mouse movement
        function onMouseMove(event) {
            setPosition(event);
            
            container = findContainer(event);
            if (!container) {
                if (placeholder)
                    placeholder.remove();
                return;
            }

            if (!placeholder)
                placeholder = new $.component.Placeholder();

            var target = findTarget(event, container);
            if (target) {
                if (target.orientation == 'right' || target.orientation == 'bottom') {
                    position = target.child.next;
                    if (position == placeholder)
                        position = placeholder.next;
                } else
                    position = target.child;
            }

            container.add(placeholder, position);
        }

        // Perform actual move after "drop" animation
        function afterAddAnimation() {
            $moving.remove();
            placeholder.remove();
            if (isNew)
                $.cf.edit.execute('add', {
                    container: container,
                    position: position,
                    type: type
                });
            else
                $.cf.edit.execute('move', {
                    container: container,
                    position: position,
                    child: child
                });
        }

        // Handle mouse button release
        function onMouseUp(event) {
            if (!container) {
                abortDrag();
                return;
            }

            var to = $.extend($(placeholder.dom).offset(), {
                width: placeholder.dom.offsetWidth,
                height: placeholder.dom.offsetHeight,
                opacity: .2
            });

            $moving.width($moving[0].offsetWidth).height($moving[0].offsetHeight)
                .addClass('socrata-cf-adding').animate(to, 'fast', 'linear',
                    function() {
                        // Defer final add because otherwise if this code crashes (which frequently it does during
                        // component development) jQuery never terminates its animation timer, net result being a
                        // highly annoying infinite loop of errors
                        setTimeout(afterAddAnimation, 1);
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
            if (placeholder)
                placeholder.remove();
            $moving.animate($target.offset(), 200, 'linear', function() {
                $moving.remove();
            });
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

        // Find all containers in the page that support drag/drop.  We will use this for hit-testing.  Reverse sort so
        // that during hit detection we encounter children before parents
        $containers = $('.socrata-container').closest('.socrata-component').filter(function() {
            return this._comp && this._comp.drag !== false;
        });
        Array.prototype.reverse.apply($containers);

        // Initiate the drag
        if (isNew) {
            // Dragging from icon.  Create a copy to move around the screen
            $moving = $('<div class="socrata-cf-drag-icon">' + $target.html() + '</div>');
        } else {
            // TODO - drag existing component
        }
        setPosition(event);
        $(document.body).append($moving);
        $(document.body).mousemove(onMouseMove).mouseup(onMouseUp).click(onMouseClick);
    }
})(jQuery);
