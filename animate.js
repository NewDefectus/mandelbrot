class animation {
    constructor(updateFunction, duration, smoothStep = true) {
        this.frame = 0;
        this.toOpen = false;
        let me = this;
        duration = 1 / (duration * 100);

        this.open = function () {
            animateTimeouts.push(function() {
                me.frame += duration;
                if (me.frame >= 1) {
                    me.frame = 1;
                    clearInterval(me.interval);
                }
                updateFunction((smoothStep) ? 6 * me.frame ** 5 - 15 * me.frame ** 4 + 10 * me.frame ** 3 : me.frame);
                if (me.frame == 1)
                    return 0;
                else
                    return (me.toOpen) ? 1 : 0;
            });
            me.toOpen = true;
            //if (drawTimeouts.length == 0 && animateTimeouts.length == 0)
            runCallbacks();
        };
        this.close = function() {
            animateTimeouts.push(function() {
                me.frame -= duration;
                if (me.frame <= 0) {
                    me.frame = 0;
                    clearInterval(me.interval);
                }
                updateFunction((smoothStep) ? 6 * me.frame ** 5 - 15 * me.frame ** 4 + 10 * me.frame ** 3 : me.frame);
                if (me.frame == 0)
                    return 0;
                else
                    return (me.toOpen) ? 0 : 1;
            });
            me.toOpen = false;
            //if (drawTimeouts.length == 0 && animateTimeouts.length == 0)
            runCallbacks();
        };
        this.switch = function () {
            if (me.toOpen)
                me.close();
            else
                me.open();
        };
    }
}
