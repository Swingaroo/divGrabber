function extractHostname(url) {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("://") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
}

function prepareSideBar() {

    chrome.tabs.query({ 'active': true, 'lastFocusedWindow': true }, function (tabs) {
        var url = tabs[0].url;

        var selField = document.getElementById('selField');
        var host = //window.location.hostname;
            extractHostname(url);
        var storeKey = 'DivGrabber_' + host;

        var stored = localStorage[storeKey];
        if (stored)
            selField.value = stored;

        selField.onchange = function (evt) {
            var store = {};
            store[storeKey] = evt.srcElement.value;
            localStorage[storeKey] = evt.srcElement.value;
        };

    });


    
    
        //кнопка показать
        var showBtn = document.getElementById('showBtn');
        
        showBtn.onclick = function (evt) {
            //var sel = document.getElementById('selField').getAttribute('value');
            //var el = Grabber.getHtml(sel);

            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.sendRequest(tab.id, { method: "show", value: document.getElementById('selField').value },
                    function (response) {
                        console.log(response);
                });
            });

        };
        

        //кнопка сохранить
        var saveBtn = document.getElementById('saveBtn');
        
        saveBtn.onclick = function (evt) {
            /*console.log('saveBtn click');
            var sel = document.getElementById('selField').getAttribute('value');
            var el = Grabber.createFakeElement(sel);
            Grabber.cleanAll(el);
            Grabber.normalizeAs(el);
            Grabber.images = [];
            Grabber.parseImgs(el);
            console.log('after parse', Grabber.images);
            Grabber.downloadImgs();
            console.log('after dl', Grabber.images);*/

            chrome.tabs.getSelected(null, function (tab) {
                chrome.tabs.sendRequest(tab.id, { method: "save", value: document.getElementById('selField').value },
                    function (response) {
                        console.log(response);
                });
            });

        };


        //обработка:
        //1. получить и запомнить разметку
        //2. получить перечень картинок
        //3. скачать и запомнить картинки
        //4. заменить пути картинок на относительные ./
        //5. что-то сделать со ссылками (ссылки могут быть куда угодно)
        //6. собрать зип из index.html и картинок
    
}

prepareSideBar();