
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

        /**
         * check if container contains containee
         * @author  joachim.wendenburg@sixt.com
         *
         * @params  {object} container as DOM reference
         * @param   {object} containee as DOM reference
         * @return  {boolean}
         */
        isInside: function (container, containee) {
            if (typeof container === "undefined") return false;
            if (window.Node && Node.prototype && !Node.prototype.contains) {
                Node.prototype.contains = function (arg) {
                    return !!(this.compareDocumentPosition(arg) & 16);
                };
            }
            return container.contains(containee);
        },

        getDeviceType: function() {
            return 'ontouchstart' in window ?
                'TOUCH' : (window.PointerEvent ? 'POINTER' : 'DEFAULT');
        }
    };

