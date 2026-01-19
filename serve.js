const liveServer = require("live-server");

const params = {
    port: 8080,
    host: "0.0.0.0",
    root: ".",
    open: false,
    file: "index.html",
    wait: 1000,
    mount: [],
    logLevel: 2,
    middleware: [
        function (req, res, next) {
            // If the URL doesn't have an extension, try adding .html
            if (req.url !== "/" && !req.url.includes(".")) {
                req.url += ".html";
            }
            next();
        }
    ]
};

liveServer.start(params);
