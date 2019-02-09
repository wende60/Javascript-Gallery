
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

        init(props) {
            this.c.isSmallDevice = KGDE.utils ? KGDE.utils.detectSmallDevice() : false;
            this.c.callbackFunc = props.callbackFunc || null;

            const wrapperCollection = document.getElementsByClassName(this.c.classWrapper);
            const wrappers = Array.prototype.slice.call(wrapperCollection);
            wrappers.forEach((wrapper, index) => {
                const thumbList = wrapper.getElementsByClassName(this.c.classThumbList)[0] || false;
                if (!thumbList) {
                    return;
                }

                wrapper.dataset.galleryIndex = index;
                thumbList.dataset.listIndex = index;
                this.addList(wrapper, thumbList, index);
                this.addView(wrapper, index);
                this.getSizes(index);
                this.initNavi(index);

                this.displayViewImage(this.c.items[index]);
            });

            window.addEventListener('resize', this, false);
        },

        addList(wrapper, thumbList, index) {
            const ul = thumbList.getElementsByTagName('ul')[0] || false;
            if (!ul) {
                return;
            }

            const liCollection = ul.getElementsByTagName('li');
            const lis = Array.prototype.slice.call(liCollection);
            this.c.items[index] = {
                index,
                wrapper,
                thumbList,
                ul,
                lis,
                loadImage: null,
                views: [],
                fulls: [],
                infos: [],
                sources: [],
                currentImageIndex: 0,
                pastImageIndex: 0
            }

            this.prepareUl(ul, index);
            this.prepareLis(lis, index);
        },

        addView(wrapper, index) {
            const images = wrapper.getElementsByClassName(this.c.classImages)[0] || false;
            const description = wrapper.getElementsByClassName(this.c.classDescription)[0] || false;
            this.c.items[index]['images'] = images;
            this.c.items[index]['description'] = description;
        },

        getSizes(index) {
            const item =this.c.items[index];
            const thumbListWidth = item.thumbList.offsetWidth;
            const liPositions = this.getLiPositions(item.lis);
            const liWidths = this.getLiWidths(item.lis);
            const ulWidth = this.getUlWidth(liWidths);
            const liWidth = liWidths[0];
            const itemsVisible = Math.round(thumbListWidth / liWidth);
            const liAvailablePositions = liPositions.slice(0, liPositions.length + 1 - itemsVisible);

            this.c.items[index]['thumbListWidth'] = thumbListWidth;
            this.c.items[index]['ulWidth'] = ulWidth;
            this.c.items[index]['liWidth'] = liWidth;
            this.c.items[index]['itemsVisible'] = itemsVisible;
            this.c.items[index]['liPositions'] = liPositions;
            this.c.items[index]['liAvailablePositions'] = liAvailablePositions;
        },

        prepareUl(ul, index) {
            ul.dataset.listIndex = index;
            this.prepareUlSlideData(index);
            this.setUlEvents(ul);
        },

        setUlEvents(ul) {
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
                    ul.addEventListener('dragstart', this, false);
                    break;
                default:
                    ul.addEventListener('mousedown', this, false);
                    ul.addEventListener('mousemove', this, false);
                    ul.addEventListener('mouseup', this, false);
                    ul.addEventListener('dragstart', this, false);
                    document.addEventListener('mousemove', this, false);
            }
        },

        prepareUlSlideData(index) {
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
            }
        },

        prepareLis(lis, listIndex) {
            lis.forEach((li, index) => {
                li.dataset.listIndex = listIndex;
                li.dataset.imageIndex = index;
                this.setLiEvent(li);
                this.prepareThumb(li, listIndex);
            });
        },

        setLiEvent(li) {
            li.addEventListener('click', this, false);
        },

        prepareThumb(li, index) {
            const thumb = li.getElementsByClassName(this.c.classThumb)[0] || false;
            if (!thumb) {
                return;
            }

            const item = this.c.items[index];
            const thumbImage = thumb.dataset.srcThumb || '';
            const viewImage = thumb.dataset.srcView || '';
            const fullImage = thumb.dataset.srcFull || '';
            const imageInfo = thumb.innerHTML.replace(/(\<\/?)link/g, '$1a');

            item.views.push(viewImage);
            item.fulls.push(fullImage);
            item.infos.push(imageInfo);

            thumb.addEventListener('click', e => {
                e.preventDefault();
                return false;
            }, false);
            thumb.style.backgroundImage = 'url(' + thumbImage + ')';
        },

        getLiPositions(lis) {
            return lis.map(li => {
                return li.offsetLeft;
            });
        },

        getLiWidths(lis) {
            return lis.map(li => {
                return li.offsetWidth;
            });
        },

        getUlWidth(liWidths) {
            return liWidths.reduce(function(addedValues, currentValue) {
                return addedValues + currentValue;
            }, 0);
        },

        dragstart(e) {
            const el = e.currentTarget;
            const item = this.c.items[el.dataset.listIndex] || false;

            if (!item) {
                return false;
            }

            const slide = item.slide;
            const touch = e.touches?
                e.touches[0] : (e.changedTouches? e.changedTouches[0] : false);

            // get touch x if available or mouse x
            slide.startX = touch? touch.pageX : e.clientX;
            slide.startY = touch? touch.pageY : e.clientY;

            // check if dragend animation was interrupted
            this.setCurrentMoveLeft(item);

            slide.startTime = new Date().getTime();
            slide.initalLeft = slide.moveLeft;
            this.c.currItem = item;
            this.c.clickDetected = false;
            return false;
        },

        drag(e) {
            // nothing to do
            if(!this.c.currItem) {
                return true;
            }

            const ul = this.c.currItem.ul;
            if (e.currentTarget !== ul) {
                // move left ul, init dragend
                this.dragend(e);
                return true;
            }

            const slide = this.c.currItem.slide;
            const touch = e.touches?
                e.touches[0] : (e.changedTouches? e.changedTouches[0] : false);

            // get touch x/y if available or mouse x/y
            slide.currX = touch? touch.pageX : e.clientX;
            slide.currY = touch? touch.pageY : e.clientY;

            // calculate x/y distance since start
            slide.distX = slide.currX - slide.startX;
            slide.distY = slide.currY - slide.startY;

            // vertical move detected... do nothing
            if(Math.abs(slide.distY) > Math.abs(slide.distX)) {
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

        dragend(e) {
            // nothing to do
            if(!this.c.currItem) {
                return true;
            }

            const ul = this.c.currItem.ul;
            const slide = this.c.currItem.slide;

            // get duration between down and up
            const duration =  new Date().getTime() - slide.startTime;

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

        getEndpos(item, duration) {
            const slide = item.slide;
            const direction = slide.speed > 0 ? 'toStart': 'toEnd';
            const magneticMove = direction === 'toEnd' ? item.liWidth / 1.5 : item.liWidth / 2.5;

            const speedTime = Math.abs(slide.speed / duration) * 10;
            const shiftLeft = Math.round(speedTime) * item.liWidth * (direction === 'toEnd' ? 1 : -1);
            const moveLeft = Math.abs(slide.moveLeft) + magneticMove + shiftLeft;

            const magneticLeft = item.liAvailablePositions.filter(position => {
                return moveLeft > position;
            }).pop() || 0;

            return magneticLeft * -1;
        },

        animDragend(item) {
            item.ul.classList.add(this.c.classUlAnimate);
            item.ul.style.transform = 'translate(' + item.slide.moveLeft + 'px, 0)';

            // as you can't trust transitionend...
            clearTimeout(this.c.transitionRun);
            this.c.transitionRun = setTimeout(() => {
                if (item.ul.classList.contains(this.c.classUlAnimate)) {
                    item.ul.classList.remove(this.c.classUlAnimate);
                }
            }, 500);
        },

        setCurrentMoveLeft(item) {
            /**
             * seems that the animation was not finished
             * get current position from WebKitCSSMatrix
             * set as moveLeft to continue from there...
             *
             */
            if (item.ul.classList.contains(this.c.classUlAnimate)) {

                const style = window.getComputedStyle(item.ul);
                const matrix = new WebKitCSSMatrix(style.webkitTransform);

                item.ul.classList.remove(this.c.classUlAnimate);
                item.slide.moveLeft = matrix.m41;
                item.ul.style.transform = 'translate(' + item.slide.moveLeft + 'px, 0)';
                this.c.isInterrupted = true;
            }
        },

        reset() {
            // nothing to do
            if(!this.c.currItem) {
                return true;
            }

            const slide = this.c.currItem.slide;
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

        initNavi(index) {
            const item = this.c.items[index];
            const thumbList = item.thumbList;
            const goBack = thumbList.getElementsByClassName(this.c.classGoBack);
            const goNext = thumbList.getElementsByClassName(this.c.classGoNext);

            if (!goBack.length || !goNext.length) {
                return;
            }

            goBack[0].addEventListener('click', () => { this.goBack(index); }, false );
            goNext[0].addEventListener('click', () => { this.goNext(index); }, false );
        },

        goBack(index) {
            const item = this.c.items[index];
            const currentPositionIndex = this.getCurrentOffsetIndex(item);
            const nextPositionIndex = currentPositionIndex > 0 ?
                currentPositionIndex - 1 : 0;
            item.slide.moveLeft = item.liAvailablePositions[nextPositionIndex] * - 1;
            this.animDragend(item);
        },

        goNext(index) {
            const item = this.c.items[index];
            const currentPositionIndex = this.getCurrentOffsetIndex(item);
            const nextPositionIndex = currentPositionIndex < item.liAvailablePositions.length -1 ?
                currentPositionIndex + 1 : currentPositionIndex;

            item.slide.moveLeft = item.liAvailablePositions[nextPositionIndex] * - 1;
            this.animDragend(item);
        },

        getCurrentOffsetIndex(item) {
            const moveLeft = item.slide.moveLeft;
            let foundIndex = 0;
            item.liAvailablePositions.forEach((position, index) => {
                if (position === Math.abs(moveLeft)) {
                    foundIndex = index;
                    return;
                }
            });
            return foundIndex;
        },

        avoidGhostDragging(e) {
            e.preventDefault();
            return false;
        },

        liClick(e) {
            if(!this.c.clickDetected) {
                return false;
            }

            const li = e.currentTarget;
            this.prepareViewDisplay(li);
        },

        prepareViewDisplay(li) {
            const item = this.c.items[li.dataset.listIndex];
            const thumb = li.getElementsByClassName(this.c.classThumb)[0] || false;

            if (!thumb) {
                return;
            }

            clearInterval(this.c.loadViewImageRun);

            item.pastImageIndex = item.currentImageIndex;
            item.currentImageIndex = li.dataset.imageIndex;
            item.loadImage = new Image();
            item.loadImage.src = item.views[item.currentImageIndex];

            let cnt = 0;
            this.c.loadViewImageRun = setInterval(() => {
                this.loadViewImage(item, cnt ++);
            }, 100);
        },

        loadViewImage(item, cnt) {
            // check if new image is complete
            const imageHeight = item.loadImage.height > this.c.loadHeight;
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

        displayViewImage(item) {
            if (!item.images || !item.description) {
                return;
            }

            const index = item.currentImageIndex;
            const curentImages = item.images.getElementsByClassName(this.c.classImage);
            if (curentImages.length > 1) {
                item.images.removeChild(curentImages[0]);
            }

            const imageWrapper = document.createElement('div');
            imageWrapper.classList.add(this.c.classImage);

            const image = document.createElement('img');
            image.src = item.views[index];

            imageWrapper.appendChild(image);
            item.images.appendChild(imageWrapper);
            item.description.innerHTML = item.infos[index];
            this.setSelectedThumb(item);

            if (this.c.callbackFunc) {
                image.addEventListener('click', () => {
                    const params = {
                        index,
                        list: this.c.isSmallDevice ? item.views : item.fulls,
                        sync: this.callback2Sync(item.index)
                    }
                    this.c.callbackFunc(params);
                }, false);
            }
        },

        callback2Sync(listIndex) {
            return (imageIndex) => {
                this.syncWithViewer(listIndex, imageIndex);
            }
        },

        syncWithViewer(listIndex, imageIndex) {
            const item = this.c.items[listIndex];

            item.pastImageIndex = item.currentImageIndex;
            item.currentImageIndex = imageIndex;

            this.displayViewImage(item);
            this.moveSelectedInSight(item);
        },

        setSelectedThumb(item) {
            const pastLi = item.lis[item.pastImageIndex];
            const currentLi = item.lis[item.currentImageIndex];
            if (pastLi.classList.contains(this.c.classSelectedLi)) {
                pastLi.classList.remove(this.c.classSelectedLi);
            }
            currentLi.classList.add(this.c.classSelectedLi);
        },

        moveSelectedInSight(item) {
            item.slide.moveLeft = item.currentImageIndex < item.liAvailablePositions.length ?
                item.liAvailablePositions[item.currentImageIndex] * -1 :
                item.liAvailablePositions[item.liAvailablePositions.length -1] * -1;
            this.animDragend(item);
        },

        resizeHandler: function() {
            clearTimeout(this.c.resizeRun);
            this.c.resizeRun = setTimeout(() => {
                const max = this.c.items.length;
                for (let i = 0; i < max; i += 1) {
                    this.getSizes(i);
                    this.moveSelectedInSight(this.c.items[i]);
                }
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



