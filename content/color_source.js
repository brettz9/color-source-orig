/*jslint vars:true*/
/*global Components, XMLSerializer, OS, dump, GetCurrentEditor, sh_highlightByLanguage*/

var color_source = (function () {'use strict';

// Private variables
var NS_XUL = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

function l (s) {
    var c = Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService);
    c.logStringMessage(s);
}

// Private methods
function ser (dom) {
    return new XMLSerializer().serializeToString(dom);
}

function _makeFileURL (path) {
    return 'file://'+path.replace(/\\/g, '/')+'/';
}

function _file_get_contents (url, callback, errCb, currentStyle) {
    var request = new XMLHttpRequest();
    request.open('GET', url+'?date'+(new Date()), true); // avoid caching
    request.overrideMimeType('text/plain');
    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            try {
                if (! request.status || request.status === 200) {
                    callback(request.responseText, currentStyle);
                }
                else {
                    errCb(request.status);
                }
            }
            finally {
                request = null;
            }
        }
    };
    request.send(null);
}


/**
 * @param {String}  id ID of the menupopup
 * @param {String}  dir Directory to iterate for content
 * @param {String}  prefix The prefix to use for localization (e.g., 'lang_' or 'skin_')
 * @param {RegExp}  regex Regular expression to isolate (localizable) string out of file name
 * @param {Boolean} checkbox Whether the menu items should be checkboxes or not
 * @returns {XULElement} Modified menu popup
 */
function _populateMenu (id, dir, prefix, regex, checkbox, successCb) {
    var self = this;
    var popup = document.getElementById(id);
    var iterator = new OS.File.DirectoryIterator(dir);
    var promise = iterator.forEach(
        function onEntry(entry) {
            if (!entry.isDir) {
                var value = entry.path.match(regex)[1];
                var menuitem = document.createElementNS(NS_XUL, 'menuitem');
                if (checkbox) {
                    menuitem.setAttribute('type', 'checkbox');
                }
                var localeValue, localeAccessKey;
                try {
                    localeValue = self.STRS.GetStringFromName(prefix+value);
                }
                catch(ignore) {}
                try {
                    localeAccessKey = self.STRS.GetStringFromName(prefix+'_accesskey_'+value);
                }
                catch(ignore) {}
                menuitem.setAttribute('value', value);
                menuitem.setAttribute('id', value);
                menuitem.setAttribute('label', localeValue || value); // Allow translation (or at least better naming) of languages
                menuitem.setAttribute('accesskey', localeAccessKey || value.substr(0, 1));
                popup.appendChild(menuitem);
            }
        }
    );
    promise.then(
        function onSuccess() {
            if (successCb) {
                successCb();
            }
            iterator.close();
        },
        function onFailure(reason) {
            iterator.close();
            dump(reason);
        }
    );
    return popup;
}

/**
 * Find the current stylehseet
 * @param {String} path The path to the root of the file to obtain
 * @param {Function} cb The callback function for use when a file is found
 * @param {Function} errCb An error callback
 */
function _getCurrentStylesheet (path, cb, errCb) {
    var currentStyle = this.prefs.getCharPref('extensions.color_source.lastStyle');
    
    _file_get_contents(_makeFileURL(path)+'sh_'+currentStyle+'.css', cb, errCb, currentStyle);
}

return {
    onLoad : function () {
        Cu.import("resource://gre/modules/AddonManager.jsm", null)
            .AddonManager
            .getAddonByID(
                "color_source@brett.zamir",
                function(addon) {
                    color_source.dir = addon.getResourceURI().path;
                    color_source.run();
                }
            );
    },
    run : function () {
        var that = this;
        this.appliedStyles = {};
        var STR_PROPERTIES = 'chrome://color_source/locale/color_source.properties';
        this.STRS = Cc['@mozilla.org/intl/stringbundle;1'].getService(Ci.nsIStringBundleService).
                                                createBundle(STR_PROPERTIES);

        //this.langDirPath = OS.Path.join(this.dir, "content", "langs");
        //this.skinDirPath = OS.Path.join(this.dir, "skin");

        var langDir = this.dir.clone();
        langDir.append('content');
        langDir.append('langs');
        this.langDirPath = langDir.path;

        var skinDir = this.dir.clone();
        skinDir.append('skin');
        this.skinDirPath = skinDir.path;

l('ldp:' + this.langDirPath);
l('sdp:' + this.skinDirPath);

        var langMenupopup = _populateMenu.call(this, 'color_source-langs', this.langDirPath, 'lang_', /[\/\\]sh_([^\/\\]*?)\.js$/);
        var skinMenupopup = _populateMenu.call(this, 'color_source-skins', this.skinDirPath, 'skin_', /[\/\\]sh_([^\/\\]*?)\.css$/, true, function () {
            that.prefs = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefService);
            var lastStyle = that.prefs.getCharPref('extensions.color_source.lastStyle');
            if (lastStyle) {
                document.getElementById(lastStyle).setAttribute('checked', 'true');
                that.currElement = document.getElementById(lastStyle);
            }
        });

/**
 Works but need to implement CSS editor
        var menuitem = document.createElementNS(NS_XUL, 'menuitem');
        menuitem.setAttribute('value', 'createNewStyles');
        menuitem.setAttribute('label', this.STRS.GetStringFromName('createNewStyles')); // Allow translation (or at least better naming) of languages
        menuitem.setAttribute('accesskey', this.STRS.GetStringFromName('access_createNewStyles'));
        skinMenupopup.appendChild(menuitem);
*/
        langMenupopup.addEventListener('command',
            function (e) {
                that.colorCode(e.target.value);
            },
            true
        );
        skinMenupopup.addEventListener('command',
            function (e) {
                if (e.target.value === 'createNewStyles') {
                    // Fix: implement call to CSS editor
                    
                    return;
                }
                if (that.currElement) {
                    that.currElement.setAttribute('checked', 'false');
                }
                that.currElement = e.target;
                that.currElement.setAttribute('checked', 'true');
                that.prefs.setCharPref('extensions.color_source.lastStyle', e.target.id);
            },
            true
        );
    },
    colorCode : function (language) {
        var ed = GetCurrentEditor();
        var code = ed.selection.toString();
        var that = this;

        function _insertHTML (styles, currentStyle) {
            styles =  styles ? // (styles && !that.appliedStyles[currentStyle]) ?  // Test usually works, but sometimes a stale copy is used (onLoad not called anew), thinking we have already used this before
                                '<style type="text/css">'+styles.replace(/\.sh_/g, '.'+currentStyle+'_'+'sh_')+'</style>' : '';

            var element = document.createElementNS('http://www.w3.org/1999/xhtml', 'pre');
            var text = document.createTextNode(code);
            element.appendChild(text);

            sh_highlightByLanguage(
                language,
                element,
                _makeFileURL(that.langDirPath),
                '.js',
                function (elements) {
/*                    if (elements[0].innerHTML !== '') {
                        ed.insertHTML(ser(elements[0]));
                        if (styles) {
                            ed.insertHTMLWithContext (styles, '', '', '', null, ed.rootElement, 0, false); // Insert styles at head
                            that.appliedStyles[currentStyle] = true;
                        }
                    }*/
                    if (elements[0].innerHTML !== '') {
                        ed.insertHTML('<div>'+(styles+ser(elements[0]).replace(/\r\n/g, '\n'))+'</div>');
                    }
                },
                currentStyle+'_' // Use as prefix to ensure each style type's tokens has a unique class
            );
        }
        function _errCb (err) {
            alert('HTTP error: status '+err);
        }
        _getCurrentStylesheet.call(this, this.skinDirPath, _insertHTML, _errCb);
    }
};

}());

window.addEventListener('load', function () {'use strict';
    color_source.onLoad();
}, false);
