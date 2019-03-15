class animation {
    constructor(updateFunction, duration, smoothStep = true) {
        this.frame = 0;
        this.interval = null;
        this.toOpen = false;
        let me = this;
        duration = 1 / (duration * 100);

        this.open = function() {
            clearInterval(me.interval);
            me.interval = setInterval(function() {
                me.frame += duration;
                if (me.frame >= 1) {
                    me.frame = 1;
                    clearInterval(me.interval);
                }
                updateFunction((smoothStep) ? 6 * me.frame ** 5 - 15 * me.frame ** 4 + 10 * me.frame ** 3 : me.frame);
            }, 10);
            me.toOpen = true;
        };
        this.close = function() {
            clearInterval(me.interval);
            me.interval = setInterval(function() {
                me.frame -= duration;
                if (me.frame <= 0) {
                    me.frame = 0;
                    clearInterval(me.interval);
                }
                updateFunction((smoothStep) ? 6 * me.frame ** 5 - 15 * me.frame ** 4 + 10 * me.frame ** 3 : me.frame);
            }, 10);
            me.toOpen = false;
        };
        this.switch = function () {
            if (me.toOpen)
                me.close();
            else
                me.open();
        };
    }
}
