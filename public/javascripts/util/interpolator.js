function Interpolator(updateIntervalMs) {
    this.events = []; // Array<(timestamp, rowsDone)> max length 3.
    this.updateIntervalMs = updateIntervalMs;
    this.listeners = [];
    this.stopped = false;

    this.intervalId = setInterval(function() {
        var now = new Date();
        var then = new Date(now.getTime() - 1000);

        var last = this.events[0];
        var current = this.events[1];
        var next = this.events[2];

        if (last && current && next) {
            var diffTime = current[0] - last[0];
            var diffRows = current[1] - last[1];
            var rate = diffRows / diffTime;
            var newRows = current[1] + rate * (now - current[0]); // the actual interpolation
            var rowsImported = Math.min(Math.round(newRows), next[1]);

            for (var i = 0; i < this.listeners.length; i++) {
                this.listeners[i](rowsImported);
            }
        } else if (!last && !current && !next) {
            this.events = [[then, 0], [now, 0], [now, 0]];
        }
    }.bind(this), this.updateIntervalMs);
}

Interpolator.prototype.addEvent = function(number) {
    var now = new Date();

    // Rotate the array. (Let this.events[0] fall off the end.)
    // Loads some defaults to show to the user.
    var older = this.events[1];
    var newer = this.events[2];

    if (newer[1] == 0) {
        newer[1] = number / 1000;
    }

    var last = [newer[0], older[1]];
    var current = [now, newer[1]];
    var next = [now, number];

    this.events = [last, current, next];
};

Interpolator.prototype.addListener = function(thunk) {
    this.listeners.push(thunk);
};

Interpolator.prototype.stop = function() {
    clearInterval(this.intervalId);
};
