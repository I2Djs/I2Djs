
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

function PDFCreator(config) {
        this.pages = [];
        this.ctx = config.ctx;
        this.domEl = config.layer;
        this.vDomIndex = config.vDomIndex;
        this.container = config.res;
        this.height = config.height;
        this.width = config.width;
        this.pdfConfig = config.pdfConfig;
        this.pdfInfo = config.pdfInfo;
        this.fontRegister = config.fontRegister;
        this.fallBackPage = config.fallBackPage;
        this.layerConfig = config.layerConfig;
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
        const tPdfConfig = parsePdfConfig(config, this.pdfConfig);

        if (config.fontRegister) {
            this.fontRegister = {
                ...(config.fontRegister || {}),
            };
        }

        this.pdfInfo = config.info || this.pdfInfo || { title: "I2Djs-PDF" };

        this.height = config.height || this.height;
        this.width = config.width || this.width;

        this.layer.setAttribute("height", this.height * 1);
        this.layer.setAttribute("width", this.width * 1);

        this.pdfConfig = tPdfConfig;

        this.execute();

        return this;
    };

    PDFCreator.prototype.setPageTemplate = function (exec) {
        this.pageDefaultTemplate = exec;
    };

    PDFCreator.prototype.setSize = function (width = 0, height = 0) {
        this.width = width;
        this.height = height;

        this.pdfConfig = parsePdfConfig({
            height, width
        }, this.pdfConfig);

        this.pages.forEach((p) => {
            let pConfig = p.pageConfig;
            p.height = pConfig.height || height;
            p.width = pConfig.width || width;
        });

        this.execute();

        return this;
    };
    PDFCreator.prototype.execute = function () {
        let self = this;
        this.exportPdf(
            this.onUpdateExe ||
                function (url) {
                    self.container.setAttribute("src", url);
                },
            this.pdfConfig
        );
    };
    PDFCreator.prototype.onChange = function (exec) {
        this.onUpdateExe = exec;
    };
    PDFCreator.prototype.addPage = function addPage (config = {}) {
        const newpage = createPage(this.ctx, this.vDomIndex);

        Object.assign(newpage, {
            domEl: this.layer,
            pageConfig: config,
            height: config.height || this.height,
            width: config.width || this.width,
            margin: config.margin || this.pdfConfig.margin || 0,
            margins: config.margins || this.pdfConfig.margins || { top: 0, bottom: 0, left: 0, right: 0 },
            type: 'CANVAS',
            EXEType: 'pdf',
            ctx: this.ctx
        })

        const template = config.pageTemplate || this.pageDefaultTemplate;
        if (template) {
            newpage.addTemplate(template);
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
        return createPage(this.ctx, this.vDomIndex);
    };
    PDFCreator.prototype.exportPdf = async function (callback, pdfConfig = {}) {
        let self = this;
        const doc = new PDFDocument({
            ...pdfConfig,
        });
        const stream_ = doc.pipe(blobStream());

        if (this.fontRegister) {
            for (const key in this.fontRegister) {
                if (pdfSupportedFontFamily.indexOf(key) === -1) pdfSupportedFontFamily.push(key);
                const font = await fetch(this.fontRegister[key]);
                const fontBuffer = await font.arrayBuffer();
                doc.registerFont(key, fontBuffer);
            }
        }

        if (this.pdfInfo) {
            doc.info.Title = this.pdfInfo.title || "";
            doc.info.Author = this.pdfInfo.author || "";
            doc.info.Subject = this.pdfInfo.subject || "";
            doc.info.Keywords = this.pdfInfo.keywords || "";
            doc.info.CreationDate = this.pdfInfo.creationDate || new Date();
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
            page.exportPdf(doc, {
                autoPagination: self.layerConfig.autoPagination
            });
        });

        this.doc.end();

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
        return this.fallBackPage.createTexture(config);
    };

    PDFCreator.prototype.createAsyncTexture = function (config = {}) {
        return this.fallBackPage.createAsyncTexture(config);
    };


function pdfLayer(container, config = {}, layerSettings = {}) {

    const res = typeof container === 'string' ? document.querySelector(container) : container instanceof HTMLElement ? container : null;
    
    let clientHeight = res?.clientHeight || 0;
    let clientWidth = res?.clientWidth || 0;

    let { height = (clientHeight), width = clientWidth } = config;

    let pdfConfig = parsePdfConfig(config);
    let { autoUpdate = true, onUpdate, autoPagination = true } = layerSettings;

    const layer = document.createElement('canvas');
    layer.setAttribute('height', height);
    layer.setAttribute('width', width);
    const ctx = layer.getContext('2d');

    let fontRegister = config.fontRegister || {};
    let pdfInfo = config.info || { title: "I2Djs-PDF" };

    let vDomIndex = 999999;
    ctx.type_ = "pdf";

    ctx.doc = new PDFDocument({
        size: [width, height],
        ...pdfConfig,
    });

    ctx.doc.addPage();

    const vDomInstance = new VDom();

    if (autoUpdate) {
        vDomIndex = queue.addVdom(vDomInstance);
    }

    const fallBackPage = createPage(ctx, vDomIndex);

    const pdfInstance = new PDFCreator({
        ctx,
        layer,
        vDomIndex,
        res,
        height,
        width,
        pdfConfig,
        pdfInfo,
        fontRegister,
        fallBackPage,
        layerConfig : {
            autoUpdate,
            autoPagination
        }
    });

    pdfInstance.onChange(onUpdate);

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
                    this.exportPdf(doc, {});
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
  exportCanvasToPdf,
  PDFCreator
} 

