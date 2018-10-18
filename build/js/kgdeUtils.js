'use strict';var KGDE=window.KGDE||{};KGDE.utils={c:{smallDeviceMax:500},/**
         * detect small viewport to load lowSrc images
         * @author      kgde@wendenburg.de
         * @return      {boolean}
         */detectSmallDevice:function c(){var a=Math.max(document.documentElement.clientWidth,window.innerWidth||0),b=Math.max(document.documentElement.clientHeight,window.innerHeight||0);return!!(a<this.c.smallDeviceMax||b<this.c.smallDeviceMax)},/**
         * check if container contains containee
         * @author  joachim.wendenburg@sixt.com
         *
         * @params  {object} container as DOM reference
         * @param   {object} containee as DOM reference
         * @return  {boolean}
         */isInside:function c(a,b){return'undefined'!=typeof a&&(window.Node&&Node.prototype&&!Node.prototype.contains&&(Node.prototype.contains=function(a){return!!(16&this.compareDocumentPosition(a))}),a.contains(b))},getDeviceType:function a(){return'ontouchstart'in window?'TOUCH':window.PointerEvent?'POINTER':'DEFAULT'}};