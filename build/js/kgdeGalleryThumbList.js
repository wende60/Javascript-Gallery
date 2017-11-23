'use strict';

var KGDE = window.KGDE || {};

KGDE.thumbListGallery = {
    c: {
        items: [],
        classWrapper: 'kgdeGalleryWrapper',

        /* thumblist classes */
        classThumbList: 'kgdeGalleryThumbList',
        classUlAnimate: 'sliderAnimation',
        classThumb: 'kgdeGalleryThumb',
        classSelectedLi: 'kgdeGallerySelected',

        /* buttons */
        classGoBack: 'kgdeGalleryGoBack',
        classGoNext: 'kgdeGalleryGoNext',

        /* view classes */
        classImages: 'kgdeGalleryImages',
        classImage: 'kgdeGalleryImage',
        classDescription: 'kgdeGalleryDescription',
        currItem: null,
        isInterrupted: false,
        clickDetected: false,
        resizeRun: null,
        transitionRun: null,
        loadViewImageRun: null,
        isSmallDevice: false,
        callbackFunc: null,
        loadHeight: 300 // height to detect if image is complete
    },

    init: function init(props) {
        var _this = this;

        this.c.isSmallDevice = KGDE.utils ? KGDE.utils.detectSmallDevice() : false;
        this.c.callbackFunc = props.callbackFunc || null;

        var wrapperCollection = document.getElementsByClassName(this.c.classWrapper);
        var wrappers = Array.prototype.slice.call(wrapperCollection);
        wrappers.forEach(function (wrapper, index) {
            var thumbList = wrapper.getElementsByClassName(_this.c.classThumbList)[0] || false;
            if (!thumbList) {
                return;
            }

            wrapper.dataset.galleryIndex = index;
            thumbList.dataset.listIndex = index;
            _this.addList(wrapper, thumbList, index);
            _this.addView(wrapper, index);
            _this.getSizes(index);
            _this.initNavi(index);

            _this.displayViewImage(_this.c.items[index]);
        });

        window.addEventListener('resize', this, false);
    },
    addList: function addList(wrapper, thumbList, index) {
        var ul = thumbList.getElementsByTagName('ul')[0] || false;
        if (!ul) {
            return;
        }

        var liCollection = ul.getElementsByTagName('li');
        var lis = Array.prototype.slice.call(liCollection);
        this.c.items[index] = {
            index: index,
            wrapper: wrapper,
            thumbList: thumbList,
            ul: ul,
            lis: lis,
            loadImage: null,
            views: [],
            fulls: [],
            infos: [],
            sources: [],
            currentImageIndex: 0,
            pastImageIndex: 0
        };

        this.prepareUl(ul, index);
        this.prepareLis(lis, index);
    },
    addView: function addView(wrapper, index) {
        var images = wrapper.getElementsByClassName(this.c.classImages)[0] || false;
        var description = wrapper.getElementsByClassName(this.c.classDescription)[0] || false;
        this.c.items[index]['images'] = images;
        this.c.items[index]['description'] = description;
    },
    getSizes: function getSizes(index) {
        var item = this.c.items[index];
        var thumbListWidth = item.thumbList.offsetWidth;
        var liPositions = this.getLiPositions(item.lis);
        var liWidths = this.getLiWidths(item.lis);
        var ulWidth = this.getUlWidth(liWidths);
        var liWidth = liWidths[0];
        var itemsVisible = Math.round(thumbListWidth / liWidth);
        var liAvailablePositions = liPositions.slice(0, liPositions.length + 1 - itemsVisible);

        this.c.items[index]['thumbListWidth'] = thumbListWidth;
        this.c.items[index]['ulWidth'] = ulWidth;
        this.c.items[index]['liWidth'] = liWidth;
        this.c.items[index]['itemsVisible'] = itemsVisible;
        this.c.items[index]['liPositions'] = liPositions;
        this.c.items[index]['liAvailablePositions'] = liAvailablePositions;
    },
    prepareUl: function prepareUl(ul, index) {
        ul.dataset.listIndex = index;
        this.prepareUlSlideData(index);
        this.setUlEvents(ul);
    },
    setUlEvents: function setUlEvents(ul) {
        switch (KGDE.utils.getDeviceType()) {
            case 'TOUCH':
                ul.addEventListener('touchstart', this, false);
                ul.addEventListener('touchmove', this, false);
                ul.addEventListener('touchend', this, false);
                break;
            case 'POINTER':
                ul.addEventListener('pointerdown', this, false);
                ul.addEventListener('pointermove', this, false);
                ul.addEventListener('pointerup', this, false);
                ul.addEventListener('pointerleave', this, false);
            default:
                ul.addEventListener('mousedown', this, false);
                ul.addEventListener('mousemove', this, false);
                ul.addEventListener('mouseup', this, false);
                ul.addEventListener('dragstart', this, false);
                document.addEventListener('mousemove', this, false);
        }
    },
    prepareUlSlideData: function prepareUlSlideData(index) {
        this.c.items[index]['slide'] = {
            moveLeft: 0,
            initialLeft: 0,
            startX: 0,
            startY: 0,
            distX: 0,
            distY: 0,
            currX: 0,
            currY: 0,
            moveCnt: 0,
            speed: 0,
            startTime: 0
        };
    },
    prepareLis: function prepareLis(lis, listIndex) {
        var _this2 = this;

        lis.forEach(function (li, index) {
            li.dataset.listIndex = listIndex;
            li.dataset.imageIndex = index;
            _this2.setLiEvent(li);
            _this2.prepareThumb(li, listIndex);
        });
    },
    setLiEvent: function setLiEvent(li) {
        li.addEventListener('click', this, false);
    },
    prepareThumb: function prepareThumb(li, index) {
        var thumb = li.getElementsByClassName(this.c.classThumb)[0] || false;
        if (!thumb) {
            return;
        }

        var item = this.c.items[index];
        var thumbImage = thumb.dataset.srcThumb || '';
        var viewImage = thumb.dataset.srcView || '';
        var fullImage = thumb.dataset.srcFull || '';
        var imageInfo = thumb.innerHTML.replace(/(\<\/?)link/g, '$1a');

        item.views.push(viewImage);
        item.fulls.push(fullImage);
        item.infos.push(imageInfo);

        thumb.addEventListener('click', function (e) {
            e.preventDefault();
            return false;
        }, false);
        thumb.style.backgroundImage = 'url(' + thumbImage + ')';
    },
    getLiPositions: function getLiPositions(lis) {
        return lis.map(function (li) {
            return li.offsetLeft;
        });
    },
    getLiWidths: function getLiWidths(lis) {
        return lis.map(function (li) {
            return li.offsetWidth;
        });
    },
    getUlWidth: function getUlWidth(liWidths) {
        return liWidths.reduce(function (addedValues, currentValue) {
            return addedValues + currentValue;
        }, 0);
    },
    dragstart: function dragstart(e) {
        var el = e.currentTarget;
        var item = this.c.items[el.dataset.listIndex] || false;

        if (!item) {
            return false;
        }

        var slide = item.slide;
        var touch = e.touches ? e.touches[0] : e.changedTouches ? e.changedTouches[0] : false;

        // get touch x if available or mouse x
        slide.startX = touch ? touch.pageX : e.clientX;
        slide.startY = touch ? touch.pageY : e.clientY;

        // check if dragend animation was interrupted
        this.setCurrentMoveLeft(item);

        slide.startTime = new Date().getTime();
        slide.initalLeft = slide.moveLeft;
        this.c.currItem = item;
        this.c.clickDetected = false;
        return false;
    },
    drag: function drag(e) {
        // nothing to do
        if (!this.c.currItem) {
            return true;
        }

        var ul = this.c.currItem.ul;
        if (e.currentTarget !== ul) {
            // move left ul, init dragend
            this.dragend(e);
            return true;
        }

        var slide = this.c.currItem.slide;
        var touch = e.touches ? e.touches[0] : e.changedTouches ? e.changedTouches[0] : false;

        // get touch x/y if available or mouse x/y
        slide.currX = touch ? touch.pageX : e.clientX;
        slide.currY = touch ? touch.pageY : e.clientY;

        // calculate x/y distance since start
        slide.distX = slide.currX - slide.startX;
        slide.distY = slide.currY - slide.startY;

        // vertical move detected... do nothing
        if (Math.abs(slide.distY) > Math.abs(slide.distX)) {
            return true;
        }

        // horizontal move detected, continue with sliding
        e.preventDefault();
        e.stopPropagation();

        slide.moveLeft = slide.distX + slide.initalLeft;
        ul.style.transform = 'translate(' + slide.moveLeft + 'px, 0)';
        slide.moveCnt += 1;
        slide.speed = Math.round(slide.distX / slide.moveCnt);
        return false;
    },
    dragend: function dragend(e) {
        // nothing to do
        if (!this.c.currItem) {
            return true;
        }

        var ul = this.c.currItem.ul;
        var slide = this.c.currItem.slide;

        // get duration between down and up
        var duration = new Date().getTime() - slide.startTime;

        // detect click by short duration and missing move
        if (duration < 300 && Math.abs(slide.distX) < 5 && Math.abs(slide.distY) < 5 && !this.c.isInterrupted) {
            this.c.clickDetected = true;
            this.reset();
            return true;
        }

        // move end detected, calculate final xpos
        slide.moveLeft = this.getEndpos(this.c.currItem, duration);
        this.animDragend(this.c.currItem);
        this.reset();

        e.preventDefault();
        return true;
    },
    getEndpos: function getEndpos(item, duration) {
        var slide = item.slide;
        var direction = slide.speed > 0 ? 'toStart' : 'toEnd';
        var magneticMove = direction === 'toEnd' ? item.liWidth / 1.5 : item.liWidth / 2.5;

        var speedTime = Math.abs(slide.speed / duration) * 10;
        var shiftLeft = Math.round(speedTime) * item.liWidth * (direction === 'toEnd' ? 1 : -1);
        var moveLeft = Math.abs(slide.moveLeft) + magneticMove + shiftLeft;

        var magneticLeft = item.liAvailablePositions.filter(function (position) {
            return moveLeft > position;
        }).pop() || 0;

        return magneticLeft * -1;
    },
    animDragend: function animDragend(item) {
        var _this3 = this;

        item.ul.classList.add(this.c.classUlAnimate);
        item.ul.style.transform = 'translate(' + item.slide.moveLeft + 'px, 0)';

        // as you can't trust transitionend...
        clearTimeout(this.c.transitionRun);
        this.c.transitionRun = setTimeout(function () {
            if (item.ul.classList.contains(_this3.c.classUlAnimate)) {
                item.ul.classList.remove(_this3.c.classUlAnimate);
            }
        }, 500);
    },
    setCurrentMoveLeft: function setCurrentMoveLeft(item) {
        /**
         * seems that the animation was not finished
         * get current position from WebKitCSSMatrix
         * set as moveLeft to continue from there...
         *
         */
        if (item.ul.classList.contains(this.c.classUlAnimate)) {

            var style = window.getComputedStyle(item.ul);
            var matrix = new WebKitCSSMatrix(style.webkitTransform);

            item.ul.classList.remove(this.c.classUlAnimate);
            item.slide.moveLeft = matrix.m41;
            item.ul.style.transform = 'translate(' + item.slide.moveLeft + 'px, 0)';
            this.c.isInterrupted = true;
        }
    },
    reset: function reset() {
        // nothing to do
        if (!this.c.currItem) {
            return true;
        }

        var slide = this.c.currItem.slide;
        slide.startX = false;
        slide.startY = false;
        slide.currX = 0;
        slide.currY = 0;
        slide.distX = 0;
        slide.distY = 0;
        slide.moveCnt = 0;
        slide.speed = 0;
        slide.startTime = 0;

        this.c.currItem = false;
        this.c.isInterrupted = false;
    },
    initNavi: function initNavi(index) {
        var _this4 = this;

        var item = this.c.items[index];
        var thumbList = item.thumbList;
        var goBack = thumbList.getElementsByClassName(this.c.classGoBack);
        var goNext = thumbList.getElementsByClassName(this.c.classGoNext);

        if (!goBack.length || !goNext.length) {
            return;
        }

        goBack[0].addEventListener('click', function () {
            _this4.goBack(index);
        }, false);
        goNext[0].addEventListener('click', function () {
            _this4.goNext(index);
        }, false);
    },
    goBack: function goBack(index) {
        var item = this.c.items[index];
        var currentPositionIndex = this.getCurrentOffsetIndex(item);
        var nextPositionIndex = currentPositionIndex > 0 ? currentPositionIndex - 1 : 0;
        item.slide.moveLeft = item.liAvailablePositions[nextPositionIndex] * -1;
        this.animDragend(item);
    },
    goNext: function goNext(index) {
        var item = this.c.items[index];
        var currentPositionIndex = this.getCurrentOffsetIndex(item);
        var nextPositionIndex = currentPositionIndex < item.liAvailablePositions.length - 1 ? currentPositionIndex + 1 : currentPositionIndex;

        item.slide.moveLeft = item.liAvailablePositions[nextPositionIndex] * -1;
        this.animDragend(item);
    },
    getCurrentOffsetIndex: function getCurrentOffsetIndex(item) {
        var moveLeft = item.slide.moveLeft;
        var foundIndex = 0;
        item.liAvailablePositions.forEach(function (position, index) {
            if (position === Math.abs(moveLeft)) {
                foundIndex = index;
                return;
            }
        });
        return foundIndex;
    },
    avoidGhostDragging: function avoidGhostDragging(e) {
        e.preventDefault();
        return false;
    },
    liClick: function liClick(e) {
        if (!this.c.clickDetected) {
            return false;
        }

        var li = e.currentTarget;
        this.prepareViewDisplay(li);
    },
    prepareViewDisplay: function prepareViewDisplay(li) {
        var _this5 = this;

        var item = this.c.items[li.dataset.listIndex];
        var thumb = li.getElementsByClassName(this.c.classThumb)[0] || false;

        if (!thumb) {
            return;
        }

        clearInterval(this.c.loadViewImageRun);

        item.pastImageIndex = item.currentImageIndex;
        item.currentImageIndex = li.dataset.imageIndex;
        item.loadImage = new Image();
        item.loadImage.src = item.views[item.currentImageIndex];

        var cnt = 0;
        this.c.loadViewImageRun = setInterval(function () {
            _this5.loadViewImage(item, cnt++);
        }, 100);
    },
    loadViewImage: function loadViewImage(item, cnt) {
        // check if new image is complete
        var imageHeight = item.loadImage.height > this.c.loadHeight;
        if (imageHeight || cnt > 40) {
            clearInterval(this.c.loadViewImageRun);

            if (imageHeight) {
                this.displayViewImage(item);
            } else {
                item.currentImageIndex = item.pastImageIndex;
            }
            item.loadImage = null;
        }
    },
    displayViewImage: function displayViewImage(item) {
        var _this6 = this;

        if (!item.images || !item.description) {
            return;
        }

        var index = item.currentImageIndex;
        var curentImages = item.images.getElementsByClassName(this.c.classImage);
        if (curentImages.length > 1) {
            curentImages[0].remove();
        }

        var imageWrapper = document.createElement('div');
        imageWrapper.classList.add(this.c.classImage);

        var image = document.createElement('img');
        image.src = item.views[index];

        imageWrapper.appendChild(image);
        item.images.appendChild(imageWrapper);
        item.description.innerHTML = item.infos[index];
        this.setSelectedThumb(item);

        if (this.c.callbackFunc) {
            image.addEventListener('click', function () {
                var params = {
                    index: index,
                    list: _this6.c.isSmallDevice ? item.views : item.fulls,
                    sync: _this6.callback2Sync(item.index)
                };
                _this6.c.callbackFunc(params);
            }, false);
        }
    },
    callback2Sync: function callback2Sync(listIndex) {
        var _this7 = this;

        return function (imageIndex) {
            _this7.syncWithViewer(listIndex, imageIndex);
        };
    },
    syncWithViewer: function syncWithViewer(listIndex, imageIndex) {
        var item = this.c.items[listIndex];

        item.pastImageIndex = item.currentImageIndex;
        item.currentImageIndex = imageIndex;

        this.displayViewImage(item);
        this.moveSelectedInSight(item);
    },
    setSelectedThumb: function setSelectedThumb(item) {
        var pastLi = item.lis[item.pastImageIndex];
        var currentLi = item.lis[item.currentImageIndex];
        if (pastLi.classList.contains(this.c.classSelectedLi)) {
            pastLi.classList.remove(this.c.classSelectedLi);
        }
        currentLi.classList.add(this.c.classSelectedLi);
    },
    moveSelectedInSight: function moveSelectedInSight(item) {
        item.slide.moveLeft = item.currentImageIndex < item.liAvailablePositions.length ? item.liAvailablePositions[item.currentImageIndex] * -1 : item.liAvailablePositions[item.liAvailablePositions.length - 1] * -1;
        this.animDragend(item);
    },


    resizeHandler: function resizeHandler() {
        var _this8 = this;

        clearTimeout(this.c.resizeRun);
        this.c.resizeRun = setTimeout(function () {
            var max = _this8.c.items.length;
            for (var i = 0; i < max; i += 1) {
                _this8.getSizes(i);
                _this8.moveSelectedInSight(_this8.c.items[i]);
            }
        }, 200);
    },

    handleEvent: function handleEvent(e) {
        // we do not need a rightclick
        if (e.button > 0 || e.ctrlKey) {
            return true;
        }

        // set touch flag to avoid double events on mobile devices
        switch (e.type) {
            case 'click':
                return this.liClick(e);
            case 'pointerdown':
            case 'touchstart':
                return this.dragstart(e);
            case 'pointermove':
            case 'touchmove':
                return this.drag(e);
            case 'pointerup':
            case 'pointerleave':
            case 'touchend':
                return this.dragend(e);
            case 'mousedown':
                return this.dragstart(e);
            case 'mousemove':
                return this.drag(e);
            case 'mouseup':
                return this.dragend(e);
            case 'dragstart':
                return this.avoidGhostDragging(e);
            case 'resize':
                return this.resizeHandler(e);
        }

        return false;
    }
};