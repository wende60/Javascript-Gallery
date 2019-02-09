
    var KGDE = window.KGDE || {};

    KGDE.imageViewer = {
        c: {
            classOverlay: 'kgdeImageViewerOverlay',
            classList: 'kgdeImageViewerWrapper',
            classImage: 'kgdeImageViewer',
            classButtonBack: 'kgdeImageViewerGoBack',
            classButtonNext: 'kgdeImageViewerGoNext',
            classButtonClose: 'kgdeImageViewerClose',
            classVisible: 'kgdeImageViewerActive',
            classToolsVisible: 'kgdeImageViewerShowTools',
            classAnim: 'kgdeImageViewerAnim',
            classesFormat: {
                portrait: 'kgdeImageViewerPortrait',
                landscape: 'kgdeImageViewerLandscape',
            },
            overlay: null,
            imageWrapper: null,
            buttonBack: null,
            buttonNext: null,
            itemWidth: 0,
            itemPositions: [],
            currentPosition: 1,
            transitionRun: null,
            resizeRun: null,
            sources: [],
            index: 0,
            isInitialized: false,
            isToolsVisible: false,
            slide: {
                moveLeft: 0,
                initialLeft: 0,
                startX: 0,
                startY: 0,
                distX: 0,
                distY: 0,
                currX: 0,
                currY: 0,
                startTime: 0,
                dragging: false,
                animate: false
            }
        },

        init() {
            this.overlay = document.createElement('div');
            this.overlay.classList.add(this.c.classOverlay);

            this.list = document.createElement('div');
            this.list.classList.add(this.c.classList);

            for (let i = 0; i < 3; i += 1) {
                let imageWrapper = document.createElement('div');
                imageWrapper.classList.add(this.c.classImage);
                this.list.appendChild(imageWrapper);
            }

            const closeString = document.createTextNode('x');
            this.buttonClose = document.createElement('div');
            this.buttonClose.classList.add(this.c.classButtonClose);
            this.buttonClose.appendChild(closeString);

            this.buttonBack = document.createElement('div');
            this.buttonBack.classList.add(this.c.classButtonBack);

            this.buttonNext = document.createElement('div');
            this.buttonNext.classList.add(this.c.classButtonNext);

            this.overlay.appendChild(this.list);
            this.overlay.appendChild(this.buttonClose);
            this.overlay.appendChild(this.buttonBack);
            this.overlay.appendChild(this.buttonNext);

            document.body.appendChild(this.overlay);

            this.addEvents();
        },

        addEvents() {
            switch (KGDE.utils.getDeviceType()) {
                case 'TOUCH':
                    this.list.addEventListener('touchstart', this, false);
                    this.list.addEventListener('touchmove', this, false);
                    this.list.addEventListener('touchend', this, false);
                    break;
                case 'POINTER':
                    this.list.addEventListener('pointerdown', this, false);
                    this.list.addEventListener('pointermove', this, false);
                    this.list.addEventListener('pointerup', this, false);
                    this.list.addEventListener('pointerleave', this, false);
                    this.list.addEventListener('dragstart', this, false);
                    break;
                default:
                    this.list.addEventListener('mousedown', this, false);
                    this.list.addEventListener('mousemove', this, false);
                    this.list.addEventListener('mouseup', this, false);
                    this.list.addEventListener('dragstart', this, false);
                    document.addEventListener('mousemove', this, false);
            }

            this.list.addEventListener('transitionend', this, false);
            this.buttonClose.addEventListener('click', this, false);
            this.buttonBack.addEventListener('click', this, false);
            this.buttonNext.addEventListener('click', this, false);
            window.addEventListener('resize', this, false);
        },

        setSizes() {
            this.c.itemWidth = this.list.offsetWidth;
            this.c.itemPositions = [this.c.itemWidth * -1, 0, this.c.itemWidth];
        },

        openViewer(props) {
            if (!this.c.isInitialized) {
                this.init();
                this.c.isInitialized = true;
            }

            this.c.sources = props.list;
            this.c.index = parseInt(props.index);
            this.c.sync = props.sync;

            this.showImage();
            this.overlay.classList.add(this.c.classVisible);

            // sizes available only if display not none
            this.setSizes();
        },

        showImage() {
            this.addImageToWrapper(1, this.c.index);

            // load next images with delay
            setTimeout(() => {
                this.loadNextImage();
            }, 1000);
        },

        loadNextImage() {
            for (let i = -1; i < 2; i += 1) {
                if (i === 0) {
                    continue
                }
                let wrapperIndex = i + 1;
                let imageIndex = this.getImageIndex(i);
                this.addImageToWrapper(wrapperIndex, imageIndex);
            }
        },

        addImageToWrapper(wrapperIndex, imageIndex) {
            const imageWrapper = this.list.getElementsByClassName(this.c.classImage)[wrapperIndex];
            const image = document.createElement('img');
            image.src = this.c.sources[imageIndex];
            imageWrapper.innerHTML = '';
            imageWrapper.appendChild(image);
            image.addEventListener('load', this, false);
        },

        hideImage() {
            this.overlay.classList.remove(this.c.classVisible);

            const imageWrappers = this.list.getElementsByClassName(this.c.classImage);
            const max = imageWrappers.length;
            for (let i = 0; i < max; i += 1) {
                imageWrappers[i].innerHTML = '';
            };
        },

        checkImage(e) {
            const image = e.currentTarget;
            const format = image.height > image.width ? 'portrait' : 'landscape';
            image.classList.add(this.c.classesFormat[format]);
        },

        dragstart(e) {
            if (this.c.slide.animate) {
                return true;
            }

            const touch = e.touches?
                e.touches[0] : (e.changedTouches? e.changedTouches[0] : false);

            // get touch x if available or mouse x
            this.c.slide.startX = touch? touch.pageX : e.clientX;
            this.c.slide.startY = touch? touch.pageY : e.clientY;
            this.c.slide.startTime = new Date().getTime();

            this.c.slide.initalLeft = this.c.slide.moveLeft;
            this.c.slide.dragging = true;

            return false;
        },

        drag(e) {
            if (!this.c.slide.dragging) {
                return true;
            }

            if (e.currentTarget !== this.list) {
                this.dragend(e);
                return true;
            }

            const touch = e.touches?
                e.touches[0] : (e.changedTouches? e.changedTouches[0] : false);

            // get touch x/y if available or mouse x/y
            this.c.slide.currX = touch? touch.pageX : e.clientX;
            this.c.slide.currY = touch? touch.pageY : e.clientY;

            // calculate x/y distance since start
            this.c.slide.distX = this.c.slide.currX - this.c.slide.startX;
            this.c.slide.distY = this.c.slide.currY - this.c.slide.startY;

            /*
            // vertical move detected... do nothing
            if(Math.abs(this.c.slide.distY) > Math.abs(this.c.slide.distX)) {
                return true;
            }
            */

            // horizontal move detected, continue with sliding
            e.preventDefault();
            e.stopPropagation();

            this.c.slide.moveLeft = this.c.slide.distX + this.c.slide.initalLeft;
            this.list.style.transform = 'translate(' + this.c.slide.moveLeft + 'px, 0)';
            return false;
        },

        dragend(e) {
            if (!this.c.slide.dragging) {
                return true;
            }
            // get duration between down and up
            const duration =  new Date().getTime() - this.c.slide.startTime;

            // detect click by short duration and missing move
            if (duration < 300 && Math.abs(this.c.slide.distX) < 5 && Math.abs(this.c.slide.distY) < 5) {
                // console.info(duration, this.c.slide.distX, this.c.slide.distY)
                this.toggleToolDisplay();
                this.reset();
                return true;
            }

            const direction = (this.c.slide.distX < 0) ? -1 : 1;
            const isMove = Math.abs(this.c.slide.distX) > this.c.itemWidth / 5;

            if (isMove) {
                const newPosition = this.c.currentPosition + direction;
                this.c.currentPosition = (newPosition > -1 && newPosition < this.c.itemPositions.length) ?
                    newPosition : this.c.currentPosition;
            }

            this.animDragend();
            this.reset();
            return true;
        },

        animDragend() {
            this.c.slide.animate = true;
            this.c.slide.moveLeft = this.c.itemPositions[this.c.currentPosition];
            this.list.classList.add(this.c.classAnim);
            this.list.style.transform = 'translate(' + this.c.slide.moveLeft + 'px, 0)';

            this.c.transitionRun = setTimeout(() => {
                if (this.c.slide.animate) {
                    this.updateList();
                }
            }, 500);
        },

        updateList() {
            if (this.list.classList.contains(this.c.classAnim)) {
                this.list.classList.remove(this.c.classAnim);
            }

            if (this.c.currentPosition === 1) {
                this.c.slide.animate = false;
                return true;
            }

            const imageWrappers = this.list.getElementsByClassName(this.c.classImage);
            this.list.removeChild(imageWrappers[this.c.currentPosition]);

            const indexShift = this.c.currentPosition === 2 ? -1 : 1;
            this.c.index = this.getImageIndex(indexShift);
            const addIndex = this.getImageIndex(indexShift);

            const image = document.createElement('img');
            image.src = this.c.sources[addIndex];
            image.addEventListener('load', this, false);

            const newWrapper = document.createElement('div');
            newWrapper.classList.add(this.c.classImage);
            newWrapper.appendChild(image);

            if (this.c.currentPosition === 2) {
                this.list.insertBefore(newWrapper, imageWrappers[0]);
            } else {
                this.list.appendChild(newWrapper);
            }

            this.c.currentPosition = 1;
            this.c.slide.moveLeft = 0;
            this.list.style.transform = 'translate(' + this.c.slide.moveLeft + 'px, 0)';
            this.c.slide.animate = false;

            return true;
        },

        getImageIndex(indexShift) {
            const newIndex = (this.c.index + indexShift < 0) ?
                this.c.sources.length -1 :
                    (this.c.index + indexShift >= this.c.sources.length) ?
                        0 : this.c.index + indexShift;
            return newIndex;
        },

        handleClose() {
            this.c.sync(this.c.index);
            this.hideImage();
        },

        goBack(index) {
            this.c.currentPosition = 0;
            this.animDragend();
        },

        goNext(index) {
            this.c.currentPosition = 2;
            this.animDragend();
        },

        toggleToolDisplay() {
            this.c.isToolsVisible = !this.c.isToolsVisible;
            if (this.c.isToolsVisible) {
                this.overlay.classList.add(this.c.classToolsVisible);
            } else if (this.overlay.classList.contains(this.c.classToolsVisible)) {
                this.overlay.classList.remove(this.c.classToolsVisible);
            }
        },

        reset() {
            this.c.slide.dragging = false;
            this.c.slide.startX = false;
            this.c.slide.startY = false;
            this.c.slide.currX = 0;
            this.c.slide.currY = 0;
            this.c.slide.distX = 0;
            this.c.slide.distY = 0;
        },

        avoidGhostDragging(e) {
            e.preventDefault();
            return false;
        },

        clickHandler(e) {
            e.stopPropagation();
            e.preventDefault();

            switch (e.currentTarget) {
                case this.buttonBack:
                    this.goBack();
                    break;
                case this.buttonNext:
                    this.goNext();
                    break;
                case this.buttonClose:
                    this.handleClose();
                    break;
            }
            return true;
        },

        resizeHandler: function() {
            clearTimeout(this.c.resizeRun);
            this.c.resizeRun = setTimeout(() => {
                this.setSizes();
            }, 200);
        },

        handleEvent(e) {
            // we do not need a rightclick
            if(e.button > 0 || e.ctrlKey) {
                return true;
            }

            // set touch flag to avoid double events on mobile devices
            switch(e.type) {
                case 'click':
                    return this.clickHandler(e);
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
                case 'transitionend':
                    return this.updateList(e);
                case 'resize':
                    return this.resizeHandler(e);
                case 'load':
                    this.checkImage(e);
                case 'dragstart':
                    e.preventDefault();
                    return false;
            }
        }
    }