
    var KGDE = window.KGDE || {};

    KGDE.utils = {

        c: {
            smallDeviceMax: 500
        },

        /**
         * detect small viewport to load lowSrc images
         * @author      kgde@wendenburg.de
         * @return      {boolean}
         */
        detectSmallDevice: function() {
            const wd = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
            const ht = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
            return (
                wd < this.c.smallDeviceMax ||
                ht < this.c.smallDeviceMax
            ) ? true : false;
        },
    };

