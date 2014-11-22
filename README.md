# color-source-orig

Firefox [Color Source](https://addons.mozilla.org/en-US/thunderbird/addon/color-source/)
add-on to add syntax highlighting of code to email messages.

# To-dos
+ In order to get fulling working for latest versions of Thunderbird in a
manner that will be accepted at AMO, we still need to remove em:unpack:true
in install.rdf and use [nsIZipReader](https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIZipReader)
as per
[this StackOverflow post](http://stackoverflow.com/questions/27067723/how-to-iterate-files-in-add-on-directory)

# Credits

+ Uses [SHJS](http://shjs.sourceforge.net) as the coloring mechanism.
+ Support for recent Thunderbird editions provided by [Macavity Tuitio](https://addons.mozilla.org/en-US/firefox/user/Macavity/).

# Author notes

Given my interest in long-term stability and use of
well-established web languages, I'm favoring the concept of
full-blown web-based email clients (if necessary using
[AsYouWish](https://github.com/brettz9/asyouwish/) or perhaps a
[node-webkit](https://github.com/rogerwang/node-webkit)-based
browser if websockets
[won't work](http://stackoverflow.com/questions/5467395/can-i-use-html5-to-send-a-client-side-email)).

As to a WYSIWYG editor into
which syntax highligthing might be added as a plug-in, I'm partial to
[CKEditor](http://ckeditor.com/). I considered adapting CodeMirror,
but it appears CKEditor itself now
[supports](http://ckeditor.com/demo#widgets)
[syntax](http://docs.ckeditor.com/#!/guide/dev_codesnippet)
[highlighting](http://ckeditor.com/addon/codesnippet)
so now that solutions are available (even if I think that
plugin could be improved by allowing in-place editing,
or at least syntax-highlighting within the dialog where
edits are made), I may place less priority on developing
this add-on.
