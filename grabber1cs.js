var Grabber = {

    index: '',
    images: {},

    imageHrefExclusions: ['https://counter.yadro.ru'],

    init: function () {
        this.index = '';
        this.images = {};
        this.imgDlCt = 0;
    },

    getHtml: function (selector) {
        this.init();
        var el = document.querySelector(selector);
        if (el) {
            el.style.border = '2px solid red';
            this.index = el.innerHTML;
            console.log('got index', this.index);
            return el.innerHTML;
        }
    },

    createFakeElement: function (selector) {
        var host = document.createElement('div');
        host.style.display = 'none';
        document.body.appendChild(host);

        var el = document.createElement('div');
        el.innerHTML = this.getHtml(selector);
        host.appendChild(el);
        return el;
    },

    cleanAll: function (parent) {
        //очистить от лишних тегов
        Grabber.clean(parent, 'noindex');
        Grabber.clean(parent, 'script');

        Grabber.index = parent.innerHTML;
    },

    clean: function (parent, selector) {
        var items = parent.querySelectorAll(selector);
        Array.prototype.forEach.call(items, function (node) {
            node.parentNode.removeChild(node);
        });
    },

    normalizeAs: function (el) {
        var As = el.querySelectorAll('a');
        console.log(As.length);
        As.forEach((a, ix, arr) => {
            var href = a.getAttribute('href');
            var newhref = this._absolutePath(href);
            a.setAttribute('href', newhref);
        });
        Grabber.index = el.innerHTML;
    },

    parseImgs : function (el) {
        var imgs = el.querySelectorAll('img');
        console.log(imgs.length);
        imgs.forEach((img, ix, arr) => {
            var src = img.getAttribute('src');

            if (!Grabber._isExcluded(src)) {
                var newimg = {
                    src_original: src,
                    src_absolute: this._absolutePath(src),
                    src_new: this._getFileNameFromUrl('/' + src)
                };
                Grabber.images[newimg.src_original] = newimg;
                img.setAttribute('src', newimg.src_new);
            }
        });
        Grabber.index = el.innerHTML;
    },

    downloadImgs: function () {
        var keys = Object.keys(Grabber.images);
        keys.forEach(function (key) {

            var ajax = new XMLHttpRequest();
            ajax.onreadystatechange = function () {
                if (ajax.readyState == 4 && ajax.status == 200) {
                    Grabber.images[key].data = ajax.response; //base64Encode(ajax.response);
                    //console.log(key, ajax.response);

                    Grabber.waitForImgDl();
                }
            }
            ajax.responseType = 'blob';
            ajax.open("GET", Grabber.images[key].src_absolute, true);
            ajax.send();
        });
        
    },
    
    waitForImgDl: function () {
        Grabber.imgDlCt++;
        console.log(Grabber.imgDlCt, Object.keys(Grabber.images).length);
        if (Grabber.imgDlCt == Object.keys(Grabber.images).length) {
            Grabber.makeZip();
        }
    },

    makeZip: function () {
        var zip = new JSZip();
        //файл манифеста с метаданными
        var meta = {
            originalUrl : window.location.href,
            title : Grabber.getTitle()
        };
        zip.file('meta.json', JSON.stringify(meta));
        zip.file('index.html', Grabber.index);
        for (var key in Grabber.images) {
            zip.file(Grabber.images[key].src_new, Grabber.images[key].data );
        }
        zip.generateAsync({ type: "blob" })
            .then(function (content) {
                // see FileSaver.js
                saveAs(content, "example.zip");
            });
    },

    getTitle: function () {
        var h1 = document.body.querySelector('h1');
        if (h1)
            return h1.innerText;
        return document.title;
    },

    _absolutePath : function (href) {
        var link = document.createElement("a");
        link.href = href;
        return link.href;
    },

    _getFileNameFromUrl:function (url) {
        return url.substring(url.lastIndexOf('/') + 1);
    },

    _isExcluded: function (s) {
        for (var i in Grabber.imageHrefExclusions) {
            if (s.startsWith(Grabber.imageHrefExclusions[i]))
                return true;
        }
        return false;
    }
};

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    console.log('received', request);
    if (request.method == "show") {        
        var el = Grabber.getHtml(request.value);
        sendResponse('ok');
    }
    else if (request.method == 'save') {
    //обработка:
        //1. получить и запомнить разметку
        //2. получить перечень картинок
        //3. скачать и запомнить картинки
        //4. заменить пути картинок на относительные ./
        //5. что-то сделать со ссылками (ссылки могут быть куда угодно)
        //6. собрать зип из index.html и картинок
        
        var el = Grabber.createFakeElement(request.value);
        Grabber.cleanAll(el);
        Grabber.normalizeAs(el);
        Grabber.images = [];
        Grabber.parseImgs(el);
        console.log('after parse', Grabber.images);
        Grabber.downloadImgs();
        console.log('after dl', Grabber.images);
        sendResponse('ok');
    } else 
    sendResponse({}); // snub them.
});

