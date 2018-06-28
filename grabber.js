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
            originalUrl = window.location.href,
            title = Grabber.getTitle()
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

/*function base64Encode(str) {
    var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var out = "", i = 0, len = str.length, c1, c2, c3;
    while (i < len) {
        c1 = str.charCodeAt(i++) & 0xff;
        if (i == len) {
            out += CHARS.charAt(c1 >> 2);
            out += CHARS.charAt((c1 & 0x3) << 4);
            out += "==";
            break;
        }
        c2 = str.charCodeAt(i++);
        if (i == len) {
            out += CHARS.charAt(c1 >> 2);
            out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
            out += CHARS.charAt((c2 & 0xF) << 2);
            out += "=";
            break;
        }
        c3 = str.charCodeAt(i++);
        out += CHARS.charAt(c1 >> 2);
        out += CHARS.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
        out += CHARS.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
        out += CHARS.charAt(c3 & 0x3F);
    }
    return out;
}*/

function prepareSideBar() {
    var existing = document.getElementById('sidebar');
    if (!existing) {
        var side = document.createElement('aside');
        document.body.appendChild(side);
        side.setAttribute('id', 'sidebar');
        side.style.position = 'fixed';
        side.style.top = '0';
        side.style.right = '0';
        side.style.width = '300px';
        side.style.height = '800px';
        side.style.border = '1px solid red';
        side.style.backgroundColor = '#fff';
        side.style.zIndex = '10';
        side.style.overflowX = 'auto';

        //поле селектора
        var selField = document.createElement('input');        
        selField.setAttribute('id', 'selField');
        selField.setAttribute('type', 'text');
        selField.setAttribute('value', '.content-wrap .container');
        side.appendChild(selField);

        //кнопка показать
        var showBtn = document.createElement('button');        
        showBtn.innerText = 'Показать';
        showBtn.onclick = function (evt) {
            var sel = document.getElementById('selField').getAttribute('value');
            var el = Grabber.getHtml(sel);
        };
        side.appendChild(showBtn);

        //кнопка сохранить
        var saveBtn = document.createElement('button');        
        saveBtn.innerText = 'Сохранить';
        saveBtn.onclick = function (evt) {
            console.log('saveBtn click');
            var sel = document.getElementById('selField').getAttribute('value');
            var el = Grabber.createFakeElement(sel);
            Grabber.cleanAll(el);
            Grabber.normalizeAs(el);
            Grabber.images = [];
            Grabber.parseImgs(el);
            console.log('after parse', Grabber.images);
            Grabber.downloadImgs();
            console.log('after dl', Grabber.images);
            
        };
        side.appendChild(saveBtn);

        
        //обработка:
        //1. получить и запомнить разметку
        //2. получить перечень картинок
        //3. скачать и запомнить картинки
        //4. заменить пути картинок на относительные ./
        //5. что-то сделать со ссылками (ссылки могут быть куда угодно)
        //6. собрать зип из index.html и картинок
    }
}

prepareSideBar();