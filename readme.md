
Javascript gallery... standalone gallery with a thumlist and an image-detail-view, furthermore a full-size image-viewer opening on image-detail-view click. All responsive and as well mouse draggable and swipeable, big devices will also see arrows to navigate.

Find a working example here: http://vogelfisch.de/gallery

*Work in progress, more info comming soon!*

But here some steps:

- the example is created with sass and es6, so run **npm install** to install some helpfull node modules like http-server, node-sass and babel
- run **npm run dev** to start a server and a watcher to compile your sass files. Check your current work at localhost:4000 
- run **npm run build** to start a server, create a compressed css file and minified js files (preset-env) in the build dir. Check the build files at localhost:4000
- run **npm run kill** in case you forgot to stop one of the servers and ended up in errors ;)

Just try it out and give me some feedback :)

