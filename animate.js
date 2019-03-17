var mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
smoothStep = (x) => 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
class animation {
    constructor(updateFunction, duration, smooth = true) {
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
                updateFunction((smooth) ? smoothStep(me.frame) : me.frame);
                if (me.frame == 1)
                    return 0;
                else
                    return (me.toOpen) ? 1 : 0;
            });
            me.toOpen = true;
            nudgeCallbacks();
        };
        this.close = function() {
            animateTimeouts.push(function() {
                me.frame -= duration;
                if (me.frame <= 0) {
                    me.frame = 0;
                    clearInterval(me.interval);
                }
                updateFunction((smoothStep) ? smoothStep(me.frame) : me.frame);
                if (me.frame == 0)
                    return 0;
                else
                    return (me.toOpen) ? 0 : 1;
            });
            me.toOpen = false;
            nudgeCallbacks();
        };
        this.switch = function () {
            if (me.toOpen)
                me.close();
            else
                me.open();
        };
    }
}