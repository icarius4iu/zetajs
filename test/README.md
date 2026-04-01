# zetajs Smoketesting

## Running the smoketest

Put this directory into a webservers webroot.

The following HTTP headers must be set in the webserver configuration.
```
Cross-Origin-Opener-Policy "same-origin"
Cross-Origin-Embedder-Policy "require-corp"
```

You might configure a webserver like Apache for this. Or you use emrun which comes has Emscripten and sets this headers by default.
```
$ emrun rainbow_writer.html
```

Additionally you need to provide the following files. in the webroot:
```
soffice.data
soffice.data.js.metadata
soffice.js
soffice.wasm
zeta.js
```

### Alternative: Build LOWA with EMSCRIPTEN_EXTRA_SOFFICE_PRE_JS

One way to run some of the provided example and test code is to serve those files next to `qt_soffice.html`, along with some `include.js` that looks like
```
Module.uno_scripts = [
    'zetajs/source/zeta.js',
    'zetajs/test/smoketest.js'];
```
(or whatever the paths where you serve them, relative to `qt_soffice.html`; `zeta.js` always needs to come first), and to build LOWA with an `EMSCRIPTEN_EXTRA_SOFFICE_PRE_JS=/path/to/include.js` configuration option (e.g., as a line in `autogen.input`), with `/path/to` adapted accordingly.
