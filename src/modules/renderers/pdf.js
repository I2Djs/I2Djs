
import queue from "./../queue.js";
import VDom from "./../VDom.js";
import PDFDocument from "pdfkit";
import blobStream from "blob-stream-i2d";
import fs from "fs";
import { STANDARD_FONTS } from "./../../data/static-fonts.js";
import { createPage } from "./canvas.js";
import { pdfSupportedFontFamily } from "./../constants.js";

if (Object.keys(STANDARD_FONTS).length > 0) {
    for(let key in STANDARD_FONTS) {
        fs.writeFileSync('/data/'+key, STANDARD_FONTS[key]);
    }
}

function parsePdfConfig(config, oldConfig = {}) {
    return {
        ...oldConfig,
        autoFirstPage: false,
        bufferPages: true,
        ...(config.margin !== undefined && { margin: config.margin }),
        ...(config.margins !== undefined && { margins: config.margins }),
        ...(config.defaultFont !== undefined && { font: config.defaultFont }),
        ...(config.encryption !== undefined && { ...config.encryption }),
    };
}

function pdfLayer(container, config = {}, layerSettings = {}) {
    const res =
        container instanceof HTMLElement
            ? container
            : typeof container === "string" || container instanceof String
            ? document.querySelector(container)
            : null;
    let { height = 0, width = 0 } = config;
    let pdfConfig = parsePdfConfig(config, {});
    const { autoUpdate = true, onUpdate } = layerSettings;
    const layer = document.createElement("canvas");
    const ctx = layer.getContext("2d", {});
    let fontRegister = config.fontRegister || {};
    let pdfInfo = config.info || { title: "I2Djs-PDF" };
    let onUpdateExe = onUpdate;

    let vDomIndex = 999999;
    let pageDefaultTemplate = null;
    ctx.type_ = "pdf";

    ctx.doc = new PDFDocument({
        size: [width, height],
        ...pdfConfig,
    });

    ctx.doc.addPage();

    layer.setAttribute("height", height * 1);
    layer.setAttribute("width", width * 1);

    const vDomInstance = new VDom();

    if (autoUpdate) {
        vDomIndex = queue.addVdom(vDomInstance);
    }

    const fallBackPage = createPage(ctx, vDomIndex);

    function PDFCreator() {
        this.pages = [];
        this.ctx = ctx;
        this.domEl = layer;
        this.vDomIndex = vDomIndex;
        this.container = res;
    }
    PDFCreator.prototype.flush = function () {
        this.pages.forEach(function (page) {
            page.flush();
        });

        this.pages = [];

        if (this.doc) {
            this.doc.flushPages();
        }
    };

    PDFCreator.prototype.setConfig = function (config = {}) {
        const tPdfConfig = parsePdfConfig(config, pdfConfig);

        if (config.fontRegister) {
            fontRegister = {
                ...(config.fontRegister || {}),
            };
        }

        if (config.info) {
            pdfInfo = config.info || { title: "I2Djs-PDF" };
        }

        height = config.height || height;
        width = config.width || width;

        layer.setAttribute("height", height * 1);
        layer.setAttribute("width", width * 1);

        this.width = width;
        this.height = height;

        pdfConfig = tPdfConfig;

        this.execute();

        return this;
    };

    PDFCreator.prototype.setPageTemplate = function (exec) {
        pageDefaultTemplate = exec;
    };

    PDFCreator.prototype.setSize = function (width = 0, height = 0) {
        this.width = width;
        this.height = height;

        return this;
    };
    PDFCreator.prototype.execute = function () {
        this.exportPdf(
            onUpdateExe ||
                function (url) {
                    res.setAttribute("src", url);
                },
            pdfConfig
        );
    };
    PDFCreator.prototype.onChange = function (exec) {
        onUpdateExe = exec;
    };
    PDFCreator.prototype.addPage = function (config = {}) {
        const newpage = createPage(ctx, this.vDomIndex);
        newpage.domEl = layer;
        newpage.height = config.height || height;
        newpage.width = config.width || width;
        newpage.margin = config.margin || pdfConfig.margin || 0;
        newpage.margins = config.margins ||
            pdfConfig.margins || { top: 0, bottom: 0, left: 0, right: 0 };
        newpage.type = "CANVAS";
        newpage.EXEType = "pdf";
        newpage.ctx = ctx;

        if (config.pageTemplate || pageDefaultTemplate) {
            newpage.addTemplate(config.pageTemplate || pageDefaultTemplate);
        }

        this.pages.push(newpage);
        return newpage;
    };
    PDFCreator.prototype.removePage = function (page) {
        const pageIndex = this.pages.indexOf(page);
        let removedPage = null;
        if (pageIndex !== -1) {
            removedPage = this.pages.splice(pageIndex, 1);
        }

        return removedPage;
    };
    PDFCreator.prototype.createTemplate = function () {
        return createPage(ctx, this.vDomIndex);
    };
    PDFCreator.prototype.exportPdf = async function (callback, pdfConfig = {}) {
        const doc = new PDFDocument({
            ...pdfConfig,
        });
        const stream_ = doc.pipe(blobStream());

        if (fontRegister) {
            for (const key in fontRegister) {
                if (pdfSupportedFontFamily.indexOf(key) === -1) pdfSupportedFontFamily.push(key);
                const font = await fetch(fontRegister[key]);
                const fontBuffer = await font.arrayBuffer();
                doc.registerFont(key, fontBuffer);
            }
        }

        if (pdfInfo) {
            doc.info.Title = pdfInfo.title || "";
            doc.info.Author = pdfInfo.author || "";
            doc.info.Subject = pdfInfo.subject || "";
            doc.info.Keywords = pdfInfo.keywords || "";
            doc.info.CreationDate = pdfInfo.creationDate || new Date();
        }

        this.doc = doc;

        this.pages.forEach(function (page) {
            page.updateBBox();
            doc.addPage({
                margin: page.margin || 0,
                size: [page.width, page.height],
            });
            if (page.pageTemplate) {
                page.pageTemplate.executePdf(doc);
            }
            page.exportPdf(doc);
        });

        doc.end();

        stream_.on("finish", function () {
            callback(stream_.toBlobURL("application/pdf"));
        });
    };

    PDFCreator.prototype.destroy = function () {
        const res = document.body.contains(this.container);
        if (res && this.container.contains(this.domEl)) {
            this.container.removeChild(this.domEl);
        }
        this.flush();
        queue.removeVdom(this.vDomIndex);
    };
    PDFCreator.prototype.exec = function (exe) {
        exe.call(this, this.dataObj);
    };
    PDFCreator.prototype.data = function (data) {
        if (!data) {
            return this.dataObj;
        } else {
            this.dataObj = data;
        }
        return this;
    };
    PDFCreator.prototype.createTexture = function (config = {}) {
        return fallBackPage.createTexture(config);
    };

    PDFCreator.prototype.createAsyncTexture = function (config = {}) {
        return fallBackPage.createAsyncTexture(config);
    };

    const pdfInstance = new PDFCreator();

    if (vDomInstance) {
        vDomInstance.rootNode(pdfInstance);
    }

    return pdfInstance;
}

async function CanvasToPdf(options) {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                    const pdfConfig = parsePdfConfig(options);
                    const doc = new PDFDocument({
                        size: [this.width, this.height],
                        ...pdfConfig,
                    });
                    const stream_ = doc.pipe(blobStream());

                    const fontRegister = options.fontRegister || {};
                    const pdfInfo = options.info || { title: "I2Djs-PDF" };

                    if (fontRegister) {
                        for (const key in fontRegister) {
                            if (pdfSupportedFontFamily.indexOf(key) === -1) pdfSupportedFontFamily.push(key);
                            const font = await fetch(fontRegister[key]);
                            const fontBuffer = await font.arrayBuffer();
                            doc.registerFont(key, fontBuffer);
                        }
                    }

                    doc.info = {
                        Title: pdfInfo.title || "",
                        Author: pdfInfo.author || "",
                        Subject: pdfInfo.subject || "",
                        Keywords: pdfInfo.keywords || "",
                        CreationDate: pdfInfo.creationDate || new Date(),
                    };

                    this.updateBBox();
                    this.updateABBox();

                    doc.addPage();
                    this.exportPdf(doc);
                    doc.end();

                    stream_.on("finish", function () {
                        resolve(stream_.toBlobURL("application/pdf"));
                    });
                } catch (error) {
                    reject(error);
                }
            })()
        })
}

function exportCanvasToPdf(canvasLayer, options) {
    return CanvasToPdf.call(canvasLayer, options);
}

export {
  pdfLayer,
  exportCanvasToPdf  
} 

