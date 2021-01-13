import queue from './queue.js';
import VDom from './VDom.js';
import path from './path.js';
import geometry from './geometry.js';
import colorMap from './colorMap.js';
import Events from './events.js';
import { NodePrototype, CollectionPrototype } from './coreApi.js';
let t2DGeometry = geometry;
const queueInstance = queue;
let Id = 0;

function domId () {
	Id += 1;
	return Id;
}

let CanvasCollection = function () {
	CollectionPrototype.apply(this, arguments);
};
CanvasCollection.prototype = new CollectionPrototype();
CanvasCollection.prototype.constructor = CanvasCollection;
CanvasCollection.prototype.createNode = function (ctx, config, vDomIndex) {
	return new CanvasNodeExe(ctx, config, domId(), vDomIndex);
};

let ratio;

function getPixlRatio (ctx) {
	const dpr = window.devicePixelRatio || 1;
	const bsr =
        ctx.webkitBackingStorePixelRatio ||
        ctx.mozBackingStorePixelRatio ||
        ctx.msBackingStorePixelRatio ||
        ctx.oBackingStorePixelRatio ||
        ctx.backingStorePixelRatio ||
        1;
	const ratio = dpr / bsr;
	return ratio < 1.0 ? 1.0 : ratio;
}

function domSetAttribute (attr, value) {
	if (value !== undefined) {
		this.attr[attr] = value;
	} else {
		delete this.attr[attr];
	}
}

function domSetStyle (attr, value) {
	if (value !== undefined) {
		this.style[attr] = value;
	} else {
		delete this.style[attr];
	}
}

function addListener (eventType, hndlr) {
	this[eventType] = hndlr;
}

function cRender (attr) {
	const self = this;

	if (attr.transform) {
		const {
			transform
		} = attr;
		const hozScale = transform.scale && transform.scale.length > 0 ? transform.scale[0] : 1;
		const verScale = transform.scale && transform.scale.length > 1 ? transform.scale[1] : hozScale || 1;
		const hozSkew = transform.skewX ? transform.skewX[0] : 0;
		const verSkew = transform.skewY ? transform.skewY[0] : 0;
		const hozMove = transform.translate && transform.translate.length > 0 ? transform.translate[0] : 0;
		const verMove = transform.translate && transform.translate.length > 1 ? transform.translate[1] : hozMove || 0;
		self.ctx.transform(hozScale, hozSkew, verSkew, verScale, hozMove, verMove);

		if (transform.rotate) {
			self.ctx.translate(transform.rotate[1] || 0, transform.rotate[2] || 0);
			self.ctx.rotate(transform.rotate[0] * (Math.PI / 180));
			self.ctx.translate(-transform.rotate[1] || 0, -transform.rotate[2] || 0);
		}
	}

	for (let i = 0; i < self.stack.length; i += 1) {
		self.stack[i].execute();
	}
}

function RPolyupdateBBox () {
	const self = this;
	let translateX = 0;
	let translateY = 0;
	let scaleX = 1;
	let scaleY = 1;
	const {
		transform
	} = self.attr;

	if (self.attr.points && self.attr.points.length > 0) {
		let points = self.attr.points;

		if (transform && transform.translate) {
			[translateX, translateY] = transform.translate;
		}

		if (transform && transform.scale) {
			[scaleX, scaleY] = transform.scale;
		}

		let minX = points[0].x;
		let maxX = points[0].x;
		let minY = points[0].y;
		let maxY = points[0].y;

		for (let i = 1; i < points.length; i += 1) {
			if (minX > points[i].x) minX = points[i].x;
			if (maxX < points[i].x) maxX = points[i].x;
			if (minY > points[i].y) minY = points[i].y;
			if (maxY < points[i].y) maxY = points[i].y;
		}

		self.BBox = {
			x: translateX + (minX * scaleX),
			y: translateY + (minY * scaleY),
			width: (maxX - minX) * scaleX,
			height: (maxY - minY) * scaleY
		};
	} else {
		self.BBox = {
			x: 0,
			y: 0,
			width: 0,
			height: 0
		};
	}

	if (transform && transform.rotate) {
		self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform);
	} else {
		self.BBoxHit = this.BBox;
	}
}

function CanvasGradients (config, type) {
	this.config = config;
	this.type = type || 'linear';
	this.mode = !this.config.mode || this.config.mode === 'percent' ? 'percent' : 'absolute';
}

CanvasGradients.prototype.exe = function GRAexe (ctx, BBox) {
	if (this.type === 'linear' && this.mode === 'percent') {
		return this.linearGradient(ctx, BBox);
	}

	if (this.type === 'linear' && this.mode === 'absolute') {
		return this.absoluteLinearGradient(ctx);
	} else if (this.type === 'radial' && this.mode === 'percent') {
		return this.radialGradient(ctx, BBox);
	} else if (this.type === 'radial' && this.mode === 'absolute') {
		return this.absoluteRadialGradient(ctx);
	}

	console.error('wrong Gradiant type');
};

CanvasGradients.prototype.linearGradient = function GralinearGradient (ctx, BBox) {
	const lGradient = ctx.createLinearGradient(BBox.x + (BBox.width * (this.config.x1 / 100)), BBox.y + (BBox.height * (this.config.y1 / 100)), BBox.x + (BBox.width * (this.config.x2 / 100)), BBox.y + (BBox.height * (this.config.y2 / 100)));
	this.config.colorStops.forEach(d => {
		lGradient.addColorStop(d.value / 100, d.color);
	});
	return lGradient;
};

CanvasGradients.prototype.absoluteLinearGradient = function absoluteGralinearGradient (ctx) {
	const lGradient = ctx.createLinearGradient(this.config.x1, this.config.y1, this.config.x2, this.config.y2);
	this.config.colorStops.forEach(d => {
		lGradient.addColorStop(d.value, d.color);
	});
	return lGradient;
};

CanvasGradients.prototype.radialGradient = function GRAradialGradient (ctx, BBox) {
	const cGradient = ctx.createRadialGradient(BBox.x + (BBox.width * (this.config.innerCircle.x / 100)), BBox.y + (BBox.height * (this.config.innerCircle.y / 100)), BBox.width > BBox.height ? BBox.width * this.config.innerCircle.r / 100 : BBox.height * this.config.innerCircle.r / 100, BBox.x + (BBox.width * (this.config.outerCircle.x / 100)), BBox.y + (BBox.height * (this.config.outerCircle.y / 100)), BBox.width > BBox.height ? BBox.width * this.config.outerCircle.r / 100 : BBox.height * this.config.outerCircle.r / 100);
	this.config.colorStops.forEach(d => {
		cGradient.addColorStop(d.value / 100, d.color);
	});
	return cGradient;
};

CanvasGradients.prototype.absoluteRadialGradient = function absoluteGraradialGradient (ctx, BBox) {
	const cGradient = ctx.createRadialGradient(this.config.innerCircle.x, this.config.innerCircle.y, this.config.innerCircle.r, this.config.outerCircle.x, this.config.outerCircle.y, this.config.outerCircle.r);
	this.config.colorStops.forEach(d => {
		cGradient.addColorStop(d.value / 100, d.color);
	});
	return cGradient;
};

CanvasGradients.prototype.colorStops = function GRAcolorStops (colorStopValues) {
	if (Object.prototype.toString.call(colorStopValues) !== '[object Array]') {
		return false;
	}

	this.config.colorStops = colorStopValues;
	return this;
};

function createLinearGradient (config) {
	return new CanvasGradients(config, 'linear');
}

function createRadialGradient (config) {
	return new CanvasGradients(config, 'radial');
}

function pixelObject (data, width, height, x, y) {
	this.pixels = data;
	this.width = width;
	this.height = height;
	this.x = x;
	this.y = y;
}

pixelObject.prototype.get = function (pos) {
	let rIndex = ((pos.y - 1) * (this.width * 4)) + ((pos.x - 1) * 4);
	return 'rgba(' + this.pixels[rIndex] + ', ' + this.pixels[rIndex + 1] + ', ' + this.pixels[rIndex + 2] + ', ' + this.pixels[rIndex + 3] + ')';
};

pixelObject.prototype.put = function (color, pos) {
	let rIndex = ((pos.y - 1) * (this.width * 4)) + ((pos.x - 1) * 4);
	this.pixels[rIndex] = color[0];
	this.pixels[rIndex + 1] = color[1];
	this.pixels[rIndex + 2] = color[2];
	this.pixels[rIndex + 3] = color[3];
	return this;
};

// function pixels (pixHndlr) {
// 	const tObj = this.rImageObj ? this.rImageObj : this.imageObj;
// 	const tCxt = tObj.getContext('2d');
// 	const pixelData = tCxt.getImageData(0, 0, this.attr.width, this.attr.height);
// 	return pixHndlr(pixelData);
// }

function getCanvasImgInstance (width, height) {
	const canvas = document.createElement('canvas');
	canvas.setAttribute('height', height);
	canvas.setAttribute('width', width);
	canvas.style.height = `${height}px`;
	canvas.style.width = `${width}px`;
	return canvas;
}

function CanvasMask (self, config = {}) {
	let maskId = config.id ? config.id : 'mask-' + Math.ceil(Math.random() * 1000);
	this.config = config;
	this.mask = new CanvasNodeExe(self.dom.ctx, {
		el: 'group',
		attr: {
			id: maskId
		}
	}, domId(), self.vDomIndex);
}

CanvasMask.prototype.setAttr = function (attr, value) {
	this.config[attr] = value;
};

CanvasMask.prototype.exe = function () {
	this.mask.execute();
	this.mask.dom.ctx.globalCompositeOperation = this.config.globalCompositeOperation || 'destination-atop';
	return true;
};

function createCanvasMask (maskConfig) {
	return new CanvasMask(this, maskConfig);
}


function CanvasClipping (self, config = {}) {
	let clipId = config.id ? config.id : 'clip-' + Math.ceil(Math.random() * 1000);
	this.clip = new CanvasNodeExe(self.dom.ctx, {
		el: 'group',
		attr: {
			id: clipId
		}
	}, domId(), self.vDomIndex);
}

CanvasClipping.prototype.exe = function () {
	this.clip.execute();
	this.clip.dom.ctx.clip();
	return true;
};

function createCanvasClip (patternConfig) {
	return new CanvasClipping(this, patternConfig);
}


function CanvasPattern (self, config = {}) {
	let selfSelf = this;
	let patternId = config.id ? config.id : 'pattern-' + Math.ceil(Math.random() * 1000);
	this.repeatInd = config.repeat ? config.repeat : 'repeat';
	selfSelf.pattern = canvasLayer(null, {}, {
		enableEvents: false,
		enableResize: false
	});
	selfSelf.pattern.setAttr('id', patternId);
	self.prependChild([selfSelf.pattern]);
	selfSelf.pattern.vDomIndex = self.vDomIndex + ':' + patternId;
	selfSelf.pattern.onChange(function () {
		selfSelf.patternObj = self.ctx.createPattern(selfSelf.pattern.domEl, selfSelf.repeatInd);
	});
}

CanvasPattern.prototype.repeat = function (repeat) {
	this.repeatInd = repeat;
};

CanvasPattern.prototype.exe = function () {
	return this.patternObj;
};

function createCanvasPattern (patternConfig) {
	return new CanvasPattern(this, patternConfig);
}

function applyStyles () {
	if (this.ctx.fillStyle !== '#000000') {
		this.ctx.fill();
	}

	if (this.ctx.strokeStyle !== '#000000') {
		this.ctx.stroke();
	}
}

function CanvasDom () {
	this.BBox = {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
	this.BBoxHit = {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
}

CanvasDom.prototype = {
	render: cRender,
	on: addListener,
	setAttr: domSetAttribute,
	setStyle: domSetStyle,
	applyStyles
};

const imageDataMap = {};

function imageInstance (self) {
	let imageIns = new Image();
	imageIns.crossOrigin = 'anonymous';
	imageIns.onload = function onload () {
		self.attr.height = self.attr.height !== undefined ? self.attr.height : this.height;
		self.attr.width = self.attr.width !== undefined ? self.attr.width : this.width;

		if (imageDataMap[self.attr.src]) {
			self.imageObj = imageDataMap[self.attr.src];
		} else {
			const im = getCanvasImgInstance(this.width, this.height);
			const ctxX = im.getContext('2d');
			ctxX.drawImage(this, 0, 0, this.width, this.height);
			self.imageObj = im;
			imageDataMap[self.attr.src] = im;
		}

		self.postProcess();

		if (self.nodeExe.attr.onload && typeof self.nodeExe.attr.onload === 'function') {
			self.nodeExe.attr.onload.call(self.nodeExe, self.image);
		}

		self.nodeExe.BBoxUpdate = true;
		queueInstance.vDomChanged(self.nodeExe.vDomIndex);
	};

	imageIns.onerror = function onerror (error) {
		if (self.nodeExe.attr.onerror && typeof self.nodeExe.attr.onerror === 'function') {
			self.nodeExe.attr.onerror.call(self.nodeExe, error);
		}
	};

	return imageIns;
}

function RenderImage (ctx, props, stylesProps, onloadExe, onerrorExe, nodeExe) {
	const self = this;
	self.ctx = ctx;
	self.attr = props;
	self.style = stylesProps;
	self.nodeName = 'Image';
	self.nodeExe = nodeExe;

	for (let key in props) {
		this.setAttr(key, props[key]);
	}

	queueInstance.vDomChanged(nodeExe.vDomIndex);
	self.stack = [self];
}

RenderImage.prototype = new CanvasDom();
RenderImage.prototype.constructor = RenderImage;

RenderImage.prototype.setAttr = function RIsetAttr (attr, value) {
	const self = this;

	if (attr === 'src') {
		if (typeof value === 'string') {
			self.image = self.image ? self.image : imageInstance(self);
			if (self.image.src !== value) {
				self.image.src = value;
			}
		} else if (value instanceof HTMLImageElement || value instanceof SVGImageElement || value instanceof HTMLCanvasElement) {
			self.imageObj = value;
			self.postProcess();
			self.attr.height = self.attr.height ? self.attr.height : value.height;
			self.attr.width = self.attr.width ? self.attr.width : value.width;
		} else if (value instanceof CanvasNodeExe) {
			self.imageObj = value.domEl;
			self.postProcess();
			self.attr.height = self.attr.height ? self.attr.height : value.height;
			self.attr.width = self.attr.width ? self.attr.width : value.width;
		}
	}
	this.attr[attr] = value;

	if (attr === 'clip') {
		this.clipImage();
	}

	if (attr === 'pixels') {
		this.pixelsUpdate();
	}

	queueInstance.vDomChanged(this.nodeExe.vDomIndex);
};

RenderImage.prototype.postProcess = function () {
	let self = this;
	if (self.attr.clip) {
		self.clipImage();
	}

	if (self.attr.pixels) {
		self.pixelsUpdate();
	}
};

RenderImage.prototype.clipImage = function () {
	let self = this;
	if (!self.imageObj) {
		return;
	}
	if (!self.rImageObj) {
		self.rImageObj = getCanvasImgInstance(self.attr.width, self.attr.height);
	}

	const ctxX = self.rImageObj.getContext('2d');
	const {
		clip,
		width = 0,
		height = 0
	} = self.attr;
	let {
		sx = 0,
		sy = 0,
		swidth = width,
		sheight = height
	} = clip;

	ctxX.clearRect(0, 0, width, height);
	if (width === 0 || height === 0) {
		return;
	}
	ctxX.drawImage(this.imageObj, sx, sy, swidth, sheight, 0, 0, width, height);
};

RenderImage.prototype.pixelsUpdate = function () {
	let self = this;
	let ctxX;
	let pixels;

	if (!this.imageObj) {
		return;
	}

	const {
		width,
		height
	} = self.attr;

	if (!self.rImageObj) {
		self.rImageObj = getCanvasImgInstance(width, height);
		ctxX = self.rImageObj.getContext('2d');
		ctxX.drawImage(self.imageObj, 0, 0, width, height);
	} else {
		ctxX = self.rImageObj.getContext('2d');
		// ctxX.drawImage(self.imageObj, 0, 0, width, height);
	}
	pixels = ctxX.getImageData(0, 0, width, height);
	
	// ctxX.clearRect(0, 0, width, height);
	// ctxX.clearRect(0, 0, width, height);
	ctxX.putImageData(self.attr.pixels(pixels), 0, 0);
};

RenderImage.prototype.updateBBox = function RIupdateBBox () {
	const self = this;
	let translateX = 0;
	let translateY = 0;
	let scaleX = 1;
	let scaleY = 1;
	const {
		transform
	} = self.attr;
	let {
		x,
		y,
		width,
		height
	} = self.attr;

	if (transform) {
		if (transform.translate) {
			[translateX, translateY] = transform.translate;
		}

		if (transform.scale) {
			scaleX = transform.scale[0] !== undefined ? transform.scale[0] : 1;
			scaleY = transform.scale[1] !== undefined ? transform.scale[1] : scaleX;
		}
	}

	self.BBox = {
		x: (translateX + x) * scaleX,
		y: (translateY + y) * scaleY,
		width: (width || 0) * scaleX,
		height: (height || 0) * scaleY
	};

	if (transform && transform.rotate) {
		self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform);
	} else {
		self.BBoxHit = this.BBox;
	}
};

RenderImage.prototype.execute = function RIexecute () {
	const {
		width = 0,
		height = 0,
		x = 0,
		y = 0
	} = this.attr;

	if (this.imageObj && width !== 0 && height !== 0) {
		this.ctx.drawImage(this.rImageObj ? this.rImageObj : this.imageObj, x, y, width, height);
	}
};

RenderImage.prototype.applyStyles = function RIapplyStyles () { };

RenderImage.prototype.in = function RIinfun (co) {
	return co.x >= this.attr.x && co.x <= this.attr.x + this.attr.width && co.y >= this.attr.y && co.y <= this.attr.y + this.attr.height;
};

function RenderText (ctx, props, stylesProps) {
	const self = this;
	self.ctx = ctx;
	self.attr = props;
	self.style = stylesProps;
	self.nodeName = 'text';
	self.stack = [self];
};

RenderText.prototype = new CanvasDom();
RenderText.prototype.constructor = RenderText;

RenderText.prototype.text = function RTtext (value) {
	this.attr.text = value;
};

RenderText.prototype.updateBBox = function RTupdateBBox () {
	const self = this;
	let translateX = 0;
	let translateY = 0;
	let scaleX = 1;
	let scaleY = 1;
	let height = 1;
	const {
		transform
	} = self.attr;

	if (transform && transform.translate) {
		[translateX, translateY] = transform.translate;
	}

	if (transform && transform.scale) {
		[scaleX, scaleY] = transform.scale;
	}

	if (this.style.font) {
		this.ctx.font = this.style.font;
		height = parseInt(this.style.font, 10);
	}

	self.BBox = {
		x: translateX + (self.attr.x * scaleX),
		y: translateY + ((self.attr.y - height + 5) * scaleY),
		width: this.ctx.measureText(this.attr.text).width * scaleX,
		height: height * scaleY
	};

	if (transform && transform.rotate) {
		self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform);
	} else {
		self.BBoxHit = this.BBox;
	}
};

RenderText.prototype.execute = function RTexecute () {
	if (this.attr.text !== undefined && this.attr.text !== null) {
		if (this.ctx.fillStyle !== '#000000') {
			this.ctx.fillText(this.attr.text, this.attr.x, this.attr.y);
		}

		if (this.ctx.strokeStyle !== '#000000') {
			this.ctx.strokeText(this.attr.text, this.attr.x, this.attr.y);
		}
	}
};

RenderText.prototype.applyStyles = function RTapplyStyles () {};

RenderText.prototype.in = function RTinfun (co) {
	return co.x >= this.attr.x && co.x <= this.attr.x + this.attr.width && co.y >= this.attr.y && co.y <= this.attr.y + this.attr.height;
};
/** ***************** Render Circle */

const RenderCircle = function RenderCircle (ctx, props, stylesProps) {
	const self = this;
	self.ctx = ctx;
	self.attr = props;
	self.style = stylesProps;
	self.nodeName = 'circle';
	self.stack = [self];
};

RenderCircle.prototype = new CanvasDom();
RenderCircle.prototype.constructor = RenderCircle;

RenderCircle.prototype.updateBBox = function RCupdateBBox () {
	const self = this;
	let translateX = 0;
	let translateY = 0;
	let scaleX = 1;
	let scaleY = 1;
	const {
		transform
	} = self.attr;

	if (transform) {
		if (transform.translate) {
			[translateX, translateY] = transform.translate;
		}

		if (transform.scale) {
			[scaleX, scaleY] = transform.scale;
		}
	}

	self.BBox = {
		x: (translateX + (self.attr.cx - self.attr.r)) * scaleX,
		y: (translateY + (self.attr.cy - self.attr.r)) * scaleY,
		width: 2 * self.attr.r * scaleX,
		height: 2 * self.attr.r * scaleY
	};

	if (transform && transform.rotate) {
		self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform);
	} else {
		self.BBoxHit = this.BBox;
	}
};

RenderCircle.prototype.execute = function RCexecute () {
	this.ctx.beginPath();
	this.ctx.arc(this.attr.cx, this.attr.cy, this.attr.r, 0, 2 * Math.PI, false);
	this.applyStyles();
	this.ctx.closePath();
};

RenderCircle.prototype.in = function RCinfun (co, eventType) {
	const r = Math.sqrt(((co.x - this.attr.cx) * (co.x - this.attr.cx)) + ((co.y - this.attr.cy) * (co.y - this.attr.cy)));
	return r <= this.attr.r;
};

const RenderLine = function RenderLine (ctx, props, stylesProps) {
	const self = this;
	self.ctx = ctx;
	self.attr = props;
	self.style = stylesProps;
	self.nodeName = 'line';
	self.stack = [self];
};

RenderLine.prototype = new CanvasDom();
RenderLine.prototype.constructor = RenderLine;

RenderLine.prototype.updateBBox = function RLupdateBBox () {
	const self = this;
	let translateX = 0;
	let translateY = 0;
	let scaleX = 1;
	let scaleY = 1;
	const {
		transform
	} = self.attr;

	if (transform && transform.translate) {
		[translateX, translateY] = transform.translate;
	}

	if (transform && transform.scale) {
		[scaleX, scaleY] = transform.scale;
	}

	self.BBox = {
		x: translateX + ((self.attr.x1 < self.attr.x2 ? self.attr.x1 : self.attr.x2) * scaleX),
		y: translateY + ((self.attr.y1 < self.attr.y2 ? self.attr.y1 : self.attr.y2) * scaleY),
		width: Math.abs(self.attr.x2 - self.attr.x1) * scaleX,
		height: Math.abs(self.attr.y2 - self.attr.y1) * scaleY
	};

	if (transform && transform.rotate) {
		self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform);
	} else {
		self.BBoxHit = this.BBox;
	}
};

RenderLine.prototype.execute = function RLexecute () {
	const {
		ctx
	} = this;
	ctx.beginPath();
	ctx.moveTo(this.attr.x1, this.attr.y1);
	ctx.lineTo(this.attr.x2, this.attr.y2);
	this.applyStyles();
	ctx.closePath();
};

RenderLine.prototype.in = function RLinfun (co) {
	return parseFloat(t2DGeometry.getDistance({
		x: this.attr.x1,
		y: this.attr.y1
	}, co) + t2DGeometry.getDistance(co, {
		x: this.attr.x2,
		y: this.attr.y2
	})).toFixed(1) === parseFloat(t2DGeometry.getDistance({
		x: this.attr.x1,
		y: this.attr.y1
	}, {
		x: this.attr.x2,
		y: this.attr.y2
	})).toFixed(1);
};

function RenderPolyline (ctx, props, stylesProps) {
	const self = this;
	self.ctx = ctx;
	self.attr = props;
	self.style = stylesProps;
	self.nodeName = 'polyline';
	self.stack = [self];
}

RenderPolyline.prototype = new CanvasDom();
RenderPolyline.constructor = RenderPolyline;

RenderPolyline.prototype.execute = function polylineExe () {
	let self = this;
	let d;
	if (!this.attr.points) return;
	this.ctx.beginPath();
	self.ctx.moveTo(this.attr.points[0].x, this.attr.points[0].y);
	for (var i = 1; i < this.attr.points.length; i++) {
		d = this.attr.points[i];
		self.ctx.lineTo(d.x, d.y);
	};
	this.applyStyles();
	this.ctx.closePath();
};

RenderPolyline.prototype.updateBBox = RPolyupdateBBox;

RenderPolyline.prototype.in = function RPolyLinfun (co) {
	let flag = false;

	for (let i = 0, len = this.attr.points.length; i <= len - 2; i++) {
		let p1 = this.attr.points[i];
		let p2 = this.attr.points[i + 1];
		flag = flag || parseFloat(t2DGeometry.getDistance({
			x: p1.x,
			y: p1.y
		}, co) + t2DGeometry.getDistance(co, {
			x: p2.x,
			y: p2.y
		})).toFixed(1) === parseFloat(t2DGeometry.getDistance({
			x: p1.x,
			y: p1.y
		}, {
			x: p2.x,
			y: p2.y
		})).toFixed(1);
	}

	return flag;
};
/** ***************** Render Path */

const RenderPath = function RenderPath (ctx, props, styleProps) {
	const self = this;
	self.ctx = ctx;
	self.angle = 0;
	self.nodeName = 'path';
	self.attr = props;
	self.style = styleProps;

	if (self.attr.d) {
		if (path.isTypePath(self.attr.d)) {
			self.path = self.attr.d;
			self.attr.d = self.attr.d.fetchPathString();
		} else {
			self.path = path.instance(self.attr.d);
		}

		self.pathNode = new Path2D(self.attr.d);
	}

	self.stack = [self];
	return self;
};

RenderPath.prototype = new CanvasDom();
RenderPath.prototype.constructor = RenderPath;

RenderPath.prototype.updateBBox = function RPupdateBBox () {
	const self = this;
	let translateX = 0;
	let translateY = 0;
	let scaleX = 1;
	let scaleY = 1;
	const {
		transform
	} = self.attr;

	if (transform && transform.translate) {
		[translateX, translateY] = transform.translate;
	}

	if (transform && transform.scale) {
		[scaleX, scaleY] = transform.scale;
	}

	self.BBox = self.path ? t2DGeometry.getBBox(self.path.stackGroup.length > 0 ? self.path.stackGroup : [self.path.stack]) : {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
	self.BBox.x = translateX + (self.BBox.x * scaleX);
	self.BBox.y = translateY + (self.BBox.y * scaleY);
	self.BBox.width *= scaleX;
	self.BBox.height *= scaleY;

	if (transform && transform.rotate) {
		self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform);
	} else {
		self.BBoxHit = this.BBox;
	}
};

RenderPath.prototype.setAttr = function RPsetAttr (attr, value) {
	this.attr[attr] = value;

	if (attr === 'd') {
		if (path.isTypePath(value)) {
			this.path = value;
			this.attr.d = value.fetchPathString();
		} else {
			this.path = path.instance(this.attr.d);
		}

		this.pathNode = new Path2D(this.attr.d);
	}
};

RenderPath.prototype.getPointAtLength = function RPgetPointAtLength (len) {
	return this.path ? this.path.getPointAtLength(len) : {
		x: 0,
		y: 0
	};
};

RenderPath.prototype.getAngleAtLength = function RPgetAngleAtLength (len) {
	return this.path ? this.path.getAngleAtLength(len) : 0;
};

RenderPath.prototype.getTotalLength = function RPgetTotalLength () {
	return this.path ? this.path.getTotalLength() : 0;
};

RenderPath.prototype.execute = function RPexecute () {
	if (this.attr.d) {
		if (this.ctx.fillStyle !== '#000000' || this.ctx.strokeStyle !== '#000000') {
			if (this.ctx.fillStyle !== '#000000') {
				this.ctx.fill(this.pathNode);
			}

			if (this.ctx.strokeStyle !== '#000000') {
				this.ctx.stroke(this.pathNode);
			}
		} else {
			this.path.execute(this.ctx);
		}
	}
};

RenderPath.prototype.applyStyles = function RPapplyStyles () {};

RenderPath.prototype.in = function RPinfun (co) {
	let flag = false;

	if (!this.attr.d) {
		return flag;
	}

	this.ctx.save();
	this.ctx.scale(1 / ratio, 1 / ratio);
	flag = this.style.fillStyle ? this.ctx.isPointInPath(this.pathNode, co.x, co.y) : flag;
	this.ctx.restore();
	return flag;
};
/** *****************End Render Path */

/** ***************** Render polygon */

function polygonExe (points) {
	if (Object.prototype.toString.call(points) !== '[object Array]') {
		console.error('Points expected as array [{x: , y:}]');
		return;
	}

	let polygon = new Path2D();
	polygon.moveTo(points[0].x, points[0].y);
	for (let i = 1; i < points.length; i++) {
		polygon.lineTo(points[i].x, points[i].y);
	}
	polygon.closePath();

	return {
		path: polygon,
		points: points,
		execute: function (ctx) {
			if (this.points.length === 0) {
				return;
			}
			ctx.beginPath();
			let points = this.points;
			ctx.moveTo(points[0].x, points[0].y);
			for (let i = 1; i < points.length; i++) {
				ctx.lineTo(points[i].x, points[i].y);
			}
			ctx.closePath();
		}
	};
}

const RenderPolygon = function RenderPolygon (ctx, props, styleProps) {
	const self = this;
	self.ctx = ctx;
	self.nodeName = 'polygon';
	self.attr = props;
	self.style = styleProps;
	self.stack = [self];

	if (props.points) {
		self.polygon = polygonExe(self.attr.points);
	}

	return this;
};

RenderPolygon.prototype = new CanvasDom();
RenderPolygon.prototype.constructor = RenderPolygon;

RenderPolygon.prototype.setAttr = function RPolysetAttr (attr, value) {
	this.attr[attr] = value;

	if (attr === 'points') {
		this.polygon = polygonExe(this.attr[attr]);
		this.attr.points = this.polygon.points;
	}
};

RenderPolygon.prototype.updateBBox = RPolyupdateBBox;

RenderPolygon.prototype.execute = function RPolyexecute () {
	if (this.attr.points) {
		if (this.ctx.fillStyle !== '#000000' || this.ctx.strokeStyle !== '#000000') {
			if (this.ctx.fillStyle !== '#000000') {
				this.ctx.fill(this.polygon.path);
			}

			if (this.ctx.strokeStyle !== '#000000') {
				this.ctx.stroke(this.polygon.path);
			}
		} else {
			this.polygon.execute(this.ctx);
		}
	}
};

RenderPolygon.prototype.applyStyles = function RPolyapplyStyles () {};

RenderPolygon.prototype.in = function RPolyinfun (co) {
	let flag = false;

	if (!this.attr.points) {
		return flag;
	}

	this.ctx.save();
	this.ctx.scale(1 / ratio, 1 / ratio);
	flag = this.style.fillStyle ? this.ctx.isPointInPath(this.polygon.path, co.x, co.y) : flag;
	this.ctx.restore();
	return flag;
};
/** ***************** Render polygon */

/** ***************** Render ellipse */

const RenderEllipse = function RenderEllipse (ctx, props, styleProps) {
	const self = this;
	self.ctx = ctx;
	self.nodeName = 'ellipse';
	self.attr = props;
	self.style = styleProps;
	self.stack = [self];
	return this;
};

RenderEllipse.prototype = new CanvasDom();
RenderEllipse.prototype.constructor = RenderEllipse;

RenderEllipse.prototype.updateBBox = function REupdateBBox () {
	const self = this;
	let translateX = 0;
	let translateY = 0;
	let scaleX = 1;
	let scaleY = 1;
	const {
		transform
	} = self.attr;

	if (transform && transform.translate) {
		[translateX, translateY] = transform.translate;
	}

	if (transform && transform.scale) {
		[scaleX, scaleY] = transform.scale;
	}

	self.BBox = {
		x: translateX + ((self.attr.cx - self.attr.rx) * scaleX),
		y: translateY + ((self.attr.cy - self.attr.ry) * scaleY),
		width: self.attr.rx * 2 * scaleX,
		height: self.attr.ry * 2 * scaleY
	};

	if (transform && transform.rotate) {
		self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform);
	} else {
		self.BBoxHit = this.BBox;
	}
};

RenderEllipse.prototype.execute = function REexecute () {
	const {
		ctx
	} = this;
	ctx.beginPath();
	ctx.ellipse(this.attr.cx, this.attr.cy, this.attr.rx, this.attr.ry, 0, 0, 2 * Math.PI);
	this.applyStyles();
	ctx.closePath();
};

RenderEllipse.prototype.in = function REinfun (co) {
	const {
		cx,
		cy,
		rx,
		ry
	} = this.attr;
	return ((co.x - cx) * (co.x - cx) / (rx * rx)) + ((co.y - cy) * (co.y - cy) / (ry * ry)) <= 1;
};
/** ***************** Render ellipse */

/** ***************** Render Rect */

const RenderRect = function RenderRect (ctx, props, styleProps) {
	const self = this;
	self.ctx = ctx;
	self.nodeName = 'rect';
	self.attr = props;
	self.style = styleProps;
	self.stack = [self];
	return this;
};

RenderRect.prototype = new CanvasDom();
RenderRect.prototype.constructor = RenderRect;

RenderRect.prototype.updateBBox = function RRupdateBBox () {
	const self = this;
	let translateX = 0;
	let translateY = 0;
	let scaleX = 1;
	let scaleY = 1;
	const {
		transform
	} = self.attr;

	if (transform && transform.translate) {
		[translateX, translateY] = transform.translate;
	}

	if (transform && transform.scale) {
		[scaleX, scaleY] = transform.scale;
	}

	self.BBox = {
		x: translateX + (self.attr.x * scaleX),
		y: translateY + (self.attr.y * scaleY),
		width: self.attr.width * scaleX,
		height: self.attr.height * scaleY
	};

	if (transform && transform.rotate) {
		self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform);
	} else {
		self.BBoxHit = this.BBox;
	}
};

RenderRect.prototype.applyStyles = function rStyles () {
};


function renderRoundRect (ctx, attr) {
	const {
		x,
		y,
		width = 0,
		height = 0,
		rx = 0,
		ry = 0
	} = attr;

	ctx.beginPath();
	ctx.moveTo(x + rx, y);
	ctx.lineTo(x + width - rx, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + ry);
	ctx.lineTo(x + width, y + height - ry);
	ctx.quadraticCurveTo(x + width, y + height, x + width - rx, y + height);
	ctx.lineTo(x + rx, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - ry);
	ctx.lineTo(x, y + ry);
	ctx.quadraticCurveTo(x, y, x + rx, y);
	ctx.closePath();
}


RenderRect.prototype.execute = function RRexecute () {
	const {
		ctx,
		attr
	} = this;

	if (ctx.fillStyle !== '#000000' || ctx.strokeStyle !== '#000000') {
		if (ctx.fillStyle !== '#000000') {
			if (!attr['rx'] && !attr['ry']) {
				ctx.fillRect(attr.x, attr.y, attr.width, attr.height);
			} else {
				renderRoundRect(ctx, attr);
				ctx.fill();
			}
		}

		if (ctx.strokeStyle !== '#000000') {
			if (!attr['rx'] && !attr['ry']) {
				ctx.strokeRect(attr.x, attr.y, attr.width, attr.height);
			} else {
				renderRoundRect(ctx, attr);
				ctx.stroke();
			}
		}
	} else {
		ctx.rect(attr.x, attr.y, attr.width, attr.height);
	}
};

RenderRect.prototype.in = function RRinfun (co) {
	const {
		x,
		y,
		width,
		height
	} = this.attr;
	return co.x >= x && co.x <= x + width && co.y >= y && co.y <= y + height;
};
/** ***************** Render Rect */

/** ***************** Render Group */

const RenderGroup = function RenderGroup (ctx, props, styleProps) {
	const self = this;
	self.nodeName = 'group';
	self.ctx = ctx;
	self.attr = props;
	self.style = styleProps;
	self.stack = new Array(0);
	return this;
};

RenderGroup.prototype = new CanvasDom();
RenderGroup.prototype.constructor = RenderGroup;

RenderGroup.prototype.updateBBox = function RGupdateBBox (children) {
	const self = this;
	let minX;
	let maxX;
	let minY;
	let maxY;
	let gTranslateX = 0;
	let gTranslateY = 0;
	let scaleX = 1;
	let scaleY = 1;
	const {
		transform
	} = self.attr;
	self.BBox = {};

	if (transform && transform.translate) {
		gTranslateX = transform.translate[0] !== undefined ? transform.translate[0] : 0;
		gTranslateY = transform.translate[1] !== undefined ? transform.translate[1] : gTranslateX;
	}

	if (transform && self.attr.transform.scale && self.attr.id !== 'rootNode') {
		scaleX = transform.scale[0] !== undefined ? transform.scale[0] : 1;
		scaleY = transform.scale[1] !== undefined ? transform.scale[1] : scaleX;
	}

	if (children && children.length > 0) {
		let d;
		let boxX;
		let boxY;

		for (let i = 0; i < children.length; i += 1) {
			d = children[i];
			boxX = d.dom.BBoxHit.x;
			boxY = d.dom.BBoxHit.y;
			minX = minX === undefined ? boxX : minX > boxX ? boxX : minX;
			minY = minY === undefined ? boxY : minY > boxY ? boxY : minY;
			maxX = maxX === undefined ? boxX + d.dom.BBoxHit.width : maxX < boxX + d.dom.BBoxHit.width ? boxX + d.dom.BBoxHit.width : maxX;
			maxY = maxY === undefined ? boxY + d.dom.BBoxHit.height : maxY < boxY + d.dom.BBoxHit.height ? boxY + d.dom.BBoxHit.height : maxY;
		}
	}

	minX = minX === undefined ? 0 : minX;
	minY = minY === undefined ? 0 : minY;
	maxX = maxX === undefined ? 0 : maxX;
	maxY = maxY === undefined ? 0 : maxY;
	self.BBox.x = gTranslateX + (minX * scaleX);
	self.BBox.y = gTranslateY + (minY * scaleY);
	self.BBox.width = Math.abs(maxX - minX) * scaleX;
	self.BBox.height = Math.abs(maxY - minY) * scaleY;

	if (self.attr.transform && self.attr.transform.rotate) {
		self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, this.attr.transform);
	} else {
		self.BBoxHit = this.BBox;
	}
};

RenderGroup.prototype.child = function RGchild (obj) {
	const self = this;
	const objLocal = obj;

	if (objLocal instanceof CanvasNodeExe) {
		objLocal.dom.parent = self;
		self.stack[self.stack.length] = objLocal;
	} else if (objLocal instanceof CanvasCollection) {
		objLocal.stack.forEach(d => {
			d.dom.parent = self;
			self.stack[self.stack.length] = d;
		});
	} else {
		console.log('wrong Object');
	}
};

RenderGroup.prototype.in = function RGinfun (coOr) {
	const self = this;
	const co = {
		x: coOr.x,
		y: coOr.y
	};
	const {
		BBox
	} = this;
	const {
		transform
	} = self.attr;
	let gTranslateX = 0;
	let gTranslateY = 0;
	let scaleX = 1;
	let scaleY = 1;

	if (transform && transform.translate) {
		[gTranslateX, gTranslateY] = transform.translate;
	}

	if (transform && transform.scale) {
		scaleX = transform.scale[0] !== undefined ? transform.scale[0] : 1;
		scaleY = transform.scale[1] !== undefined ? transform.scale[1] : scaleX;
	}

	return co.x >= (BBox.x - gTranslateX) / scaleX && co.x <= (BBox.x - gTranslateX + BBox.width) / scaleX && co.y >= (BBox.y - gTranslateY) / scaleY && co.y <= (BBox.y - gTranslateY + BBox.height) / scaleY;
};

/** ***************** End Render Group */

let CanvasNodeExe = function CanvasNodeExe (context, config, id, vDomIndex) {
	this.style = config.style || {};
	this.setStyle(config.style);
	this.attr = config.attr || {};
	this.id = id;
	this.nodeName = config.el;
	this.nodeType = 'CANVAS';
	this.children = [];
	this.ctx = context;
	this.vDomIndex = vDomIndex;
	this.bbox = config['bbox'] !== undefined ? config['bbox'] : true;

	switch (config.el) {
		case 'circle':
			this.dom = new RenderCircle(this.ctx, this.attr, this.style);
			break;

		case 'rect':
			this.dom = new RenderRect(this.ctx, this.attr, this.style);
			break;

		case 'line':
			this.dom = new RenderLine(this.ctx, this.attr, this.style);
			break;

		case 'polyline':
			this.dom = new RenderPolyline(this.ctx, this.attr, this.style);
			break;

		case 'path':
			this.dom = new RenderPath(this.ctx, this.attr, this.style);
			break;

		case 'group':
			this.dom = new RenderGroup(this.ctx, this.attr, this.style);
			break;

		case 'text':
			this.dom = new RenderText(this.ctx, this.attr, this.style);
			break;

		case 'image':
			this.dom = new RenderImage(this.ctx, this.attr, this.style, config.onload, config.onerror, this);
			break;

		case 'polygon':
			this.dom = new RenderPolygon(this.ctx, this.attr, this.style, this);
			break;

		case 'ellipse':
			this.dom = new RenderEllipse(this.ctx, this.attr, this.style, this);
			break;

		default:
			this.dom = null;
			break;
	}

	this.dom.nodeExe = this;
	this.BBoxUpdate = true;
	// if (config.style) {
	// 	this.setStyle(config.style);
	// }

	// if (config.attr) {
	// 	this.setAttr(config.attr);
	// }
};

CanvasNodeExe.prototype = new NodePrototype();

CanvasNodeExe.prototype.node = function Cnode () {
	this.updateBBox();
	return this.dom;
};

CanvasNodeExe.prototype.stylesExe = function CstylesExe () {
	let value;
	let key;
	let style = this.style;

	for (key in style) {
		if (typeof style[key] === 'string' || typeof style[key] === 'number') {
			value = style[key];
		} else if (typeof style[key] === 'object') {
			if (style[key] instanceof CanvasGradients || style[key] instanceof CanvasPattern || style[key] instanceof CanvasClipping || style[key] instanceof CanvasMask) {
				value = style[key].exe(this.ctx, this.dom.BBox);
			} else {
				value = style[key];
			}
		} else if (typeof style[key] === 'function') {
			style[key] = style[key].call(this, this.dataObj);
			value = style[key];
		} else {
			console.log('unkonwn Style');
		}

		if (typeof this.ctx[key] !== 'function') {
			this.ctx[key] = value;
		} else if (typeof this.ctx[key] === 'function') {
			this.ctx[key](value);
		} else {
			console.log('junk comp');
		}
	}
};

CanvasNodeExe.prototype.remove = function Cremove () {
	const {
		children
	} = this.dom.parent;
	const index = children.indexOf(this);

	if (index !== -1) {
		children.splice(index, 1);
	}

	this.dom.parent.BBoxUpdate = true;
	queueInstance.vDomChanged(this.vDomIndex);
};

CanvasNodeExe.prototype.attributesExe = function CattributesExe () {
	this.dom.render(this.attr);
};

CanvasNodeExe.prototype.setStyle = function CsetStyle (attr, value) {
	if (arguments.length === 2) {
		this.style[attr] = valueCheck(value);
	} else if (arguments.length === 1 && typeof attr === 'object') {
		const styleKeys = Object.keys(attr);

		for (let i = 0, len = styleKeys.length; i < len; i += 1) {
			this.style[styleKeys[i]] = valueCheck(attr[styleKeys[i]]);
		}
	}

	queueInstance.vDomChanged(this.vDomIndex);
	return this;
};

function valueCheck (value) {
	if (colorMap.RGBAInstanceCheck(value)) {
		value = value.rgba;
	}

	return value === '#000' || value === '#000000' || value === 'black' ? 'rgb(1, 1, 1)' : value;
}

CanvasNodeExe.prototype.setAttr = function CsetAttr (attr, value) {
	if (arguments.length === 2) {
		this.attr[attr] = value;
		this.dom.setAttr(attr, value);
	} else if (arguments.length === 1 && typeof attr === 'object') {
		const keys = Object.keys(attr);

		for (let i = 0; i < keys.length; i += 1) {
			this.attr[keys[i]] = attr[keys[i]];
			this.dom.setAttr(keys[i], attr[keys[i]]);
		}
	}

	this.BBoxUpdate = true;
	queueInstance.vDomChanged(this.vDomIndex);
	return this;
};

CanvasNodeExe.prototype.rotate = function Crotate (angle, x, y) {
	if (!this.attr.transform) {
		this.attr.transform = {};
	}

	if (Object.prototype.toString.call(angle) === '[object Array]') {
		this.attr.transform.rotate = [angle[0] || 0, angle[1] || 0, angle[2] || 0];
	} else {
		this.attr.transform.rotate = [angle, x || 0, y || 0];
	}

	this.dom.setAttr('transform', this.attr.transform);
	this.BBoxUpdate = true;
	queueInstance.vDomChanged(this.vDomIndex);
	return this;
};

CanvasNodeExe.prototype.scale = function Cscale (XY) {
	if (!this.attr.transform) {
		this.attr.transform = {};
	}

	if (XY.length < 1) {
		return null;
	}

	this.attr.transform.scale = [XY[0], XY[1] ? XY[1] : XY[0]];
	this.dom.setAttr('transform', this.attr.transform);
	this.BBoxUpdate = true;
	queueInstance.vDomChanged(this.vDomIndex);
	return this;
};

CanvasNodeExe.prototype.translate = function Ctranslate (XY) {
	if (!this.attr.transform) {
		this.attr.transform = {};
	}

	this.attr.transform.translate = XY;
	this.dom.setAttr('transform', this.attr.transform);
	this.BBoxUpdate = true;
	queueInstance.vDomChanged(this.vDomIndex);
	return this;
};

CanvasNodeExe.prototype.skewX = function CskewX (x) {
	if (!this.attr.transform) {
		this.attr.transform = {};
	}

	this.attr.transform.skewX = [x];
	this.dom.setAttr('transform', this.attr.transform);
	this.BBoxUpdate = true;
	queueInstance.vDomChanged(this.vDomIndex);
	return this;
};

CanvasNodeExe.prototype.skewY = function CskewY (y) {
	if (!this.attr.transform) {
		this.attr.transform = {};
	}

	this.attr.transform.skewY = [y];
	this.dom.setAttr('transform', this.attr.transform);
	this.BBoxUpdate = true;
	queueInstance.vDomChanged(this.vDomIndex);
	return this;
};

CanvasNodeExe.prototype.execute = function Cexecute () {
	this.ctx.save();
	this.stylesExe();
	this.attributesExe();

	if (this.dom instanceof RenderGroup) {
		for (let i = 0, len = this.children.length; i < len; i += 1) {
			this.children[i].execute();
		}
	}

	this.ctx.restore();
};

CanvasNodeExe.prototype.prependChild = function child (childrens) {
	const self = this;
	const childrensLocal = childrens;

	if (self.dom instanceof RenderGroup) {
		for (let i = 0; i < childrensLocal.length; i += 1) {
			childrensLocal[i].dom.parent = self;
			self.children.unshift(childrensLocal[i]);
		}
	} else {
		console.error('Trying to insert child to nonGroup Element');
	}

	this.BBoxUpdate = true;
	queueInstance.vDomChanged(this.vDomIndex);
	return self;
};

CanvasNodeExe.prototype.child = function child (childrens) {
	const self = this;
	const childrensLocal = childrens;

	if (self.dom instanceof RenderGroup) {
		for (let i = 0; i < childrensLocal.length; i += 1) {
			childrensLocal[i].dom.parent = self;
			self.children[self.children.length] = childrensLocal[i];
		}
	} else {
		console.error('Trying to insert child to nonGroup Element');
	}

	this.BBoxUpdate = true;
	queueInstance.vDomChanged(this.vDomIndex);
	return self;
};

CanvasNodeExe.prototype.updateBBox = function CupdateBBox () {
	let status;

	for (let i = 0, len = this.children.length; i < len; i += 1) {
		if (this.bbox) {
			status = this.children[i].updateBBox() || status;
		}
	}

	if (this.bbox) {
		if (this.BBoxUpdate || status) {
			this.dom.updateBBox(this.children);
			this.BBoxUpdate = false;
			return true;
		}
	}

	return false;
};

CanvasNodeExe.prototype.in = function Cinfun (co) {
	return this.dom.in(co);
};

CanvasNodeExe.prototype.on = function Con (eventType, hndlr) {
	this.dom.on(eventType, hndlr);
	return this;
};

CanvasNodeExe.prototype.animatePathTo = path.animatePathTo;
CanvasNodeExe.prototype.morphTo = path.morphTo;
CanvasNodeExe.prototype.vDomIndex = null;

CanvasNodeExe.prototype.createRadialGradient = createRadialGradient;
CanvasNodeExe.prototype.createLinearGradient = createLinearGradient;
// CanvasNodeExe.prototype

CanvasNodeExe.prototype.createEls = function CcreateEls (data, config) {
	const e = new CanvasCollection({
		type: 'CANVAS',
		ctx: this.dom.ctx
	}, data, config, this.vDomIndex);
	this.child(e.stack);
	queueInstance.vDomChanged(this.vDomIndex);
	return e;
};

CanvasNodeExe.prototype.text = function Ctext (value) {
	if (this.dom instanceof RenderText) {
		this.dom.text(value);
	}

	queueInstance.vDomChanged(this.vDomIndex);
	return this;
};

CanvasNodeExe.prototype.createEl = function CcreateEl (config) {
	const e = new CanvasNodeExe(this.dom.ctx, config, domId(), this.vDomIndex);
	this.child([e]);
	queueInstance.vDomChanged(this.vDomIndex);
	return e;
};

CanvasNodeExe.prototype.removeChild = function CremoveChild (obj) {
	let index = -1;
	this.children.forEach((d, i) => {
		if (d === obj) {
			index = i;
		}
	});

	if (index !== -1) {
		const removedNode = this.children.splice(index, 1)[0];
		this.dom.removeChild(removedNode.dom);
	}

	this.BBoxUpdate = true;
	queueInstance.vDomChanged(this.vDomIndex);
};

CanvasNodeExe.prototype.getBBox = function () {
	return {
		x: this.dom.BBox.x,
		y: this.dom.BBox.y,
		width: this.dom.BBox.width,
		height: this.dom.BBox.height
	};
};

CanvasNodeExe.prototype.getPixels = function () {
	return this.ctx.getImageData(this.dom.BBox.x, this.dom.BBox.y, this.dom.BBox.width, this.dom.BBox.height);
};

CanvasNodeExe.prototype.putPixels = function (imageData) {
	return this.ctx.putImageData(imageData, this.dom.BBox.x, this.dom.BBox.y);
};

function canvasLayer (container, contextConfig = {}, layerSettings = {}) {
	const res = container ? document.querySelector(container) : null;
	let height = res ? res.clientHeight : 0;
	let width = res ? res.clientWidth : 0;
	const layer = document.createElement('canvas');
	const ctx = layer.getContext('2d', contextConfig);
	let { enableEvents = true, autoUpdate = true, enableResize = true } = layerSettings;
	ratio = getPixlRatio(ctx);
	let onClear = function (ctx) {
		ctx.clearRect(0, 0, width * ratio, height * ratio);
	};
	layer.setAttribute('height', height * ratio);
	layer.setAttribute('width', width * ratio);
	layer.style.height = `${height}px`;
	layer.style.width = `${width}px`;
	layer.style.position = 'absolute';

	let vDomInstance;
	let vDomIndex = 999999;
	let cHeight;
	let cWidth;
	let resizeCall;
	let onChangeExe;

	if (res) {
		res.appendChild(layer);
		vDomInstance = new VDom();
		if (autoUpdate) {
			vDomIndex = queueInstance.addVdom(vDomInstance);
		}
	} else {
		enableEvents = false;
	}

	const root = new CanvasNodeExe(ctx, {
		el: 'group',
		attr: {
			id: 'rootNode'
		}
	}, domId(), vDomIndex);

	if (vDomInstance) {
		vDomInstance.rootNode(root);
	}

	const execute = root.execute.bind(root);
	root.container = res;
	root.domEl = layer;
	root.height = height;
	root.width = width;
	root.type = 'CANVAS';

	root.setClear = function (exe) {
		 onClear = exe;
	};

	root.setAttr = function (prop, value) {
		if (prop === 'viewBox') {
			this.setViewBox.apply(this, value.split(','));
		}
		layer.setAttribute(prop, value);
		this.attr[prop] = value;
	};

	root.enableEvents = function (flag) {
		enableEvents = flag;
	};

	root.setStyle = function (prop, value) {
		this.domEl.style[prop] = value;
	};

	root.setPixelRatio = function (val) {
		ratio = val;
		this.setSize(this.width, this.height);
	};

	root.addDependentLayer = function (layer) {
		if (!(layer instanceof CanvasNodeExe)) {
			return;
		}
		let depId = layer.attr.id ? layer.attr.id : 'dep-' + Math.ceil(Math.random() * 1000);
		layer.setAttr('id', depId);
		layer.vDomIndex = this.vDomIndex + ':' + depId;
		this.prependChild([layer]);
	};

	let resize = function () {
		if (!document.querySelector(container)) {
			window.removeEventListener('resize', resize);
			return;
		}
		height = cHeight || res.clientHeight;
		width = cWidth || res.clientWidth;
		layer.setAttribute('height', height * ratio);
		layer.setAttribute('width', width * ratio);
		layer.style.height = `${height}px`;
		layer.style.width = `${width}px`;
		root.width = width;
		root.height = height;

		if (resizeCall) {
			resizeCall();
		}
		root.execute();
	};

	root.onResize = function (exec) {
		resizeCall = exec;
	};

	root.onChange = function (exec) {
		onChangeExe = exec;
	};

	root.invokeOnChange = function () {
		
	};

	root.setSize = function (width_, height_) {
		cHeight = height_;
		cWidth = width_;
		width = width_;
		height = height_;
		this.domEl.setAttribute('height', cHeight * ratio);
		this.domEl.setAttribute('width', cWidth * ratio);
		this.domEl.style.height = `${cHeight}px`;
		this.domEl.style.width = `${cWidth}px`;
		this.width = width;
		this.height = height;
		this.execute();
	};

	root.setViewBox = function (x, y, height, width) {

	};

	root.getPixels = function (x, y, width_, height_) {
		return this.ctx.getImageData(x, y, width_, height_);
	};

	root.putPixels = function (imageData, x, y) {
		return this.ctx.putImageData(imageData, x, y);
	};

	root.clear = function () {
		onClear();
	};

	root.setContext = function (prop, value) {
		/** Expecting value to be array if multiple aruments */
		if (this.ctx[prop] && typeof this.ctx[prop] === 'function') {
			this.ctx[prop].apply(null, value);
		} else if (this.ctx[prop]) {
			this.ctx[prop] = value;
		}
	};

	root.createPattern = createCanvasPattern;

	root.createClip = createCanvasClip;

	root.createMask = createCanvasMask;

	root.execute = function executeExe () {
		onClear(ctx);
		ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
		this.updateBBox();
		execute();
		if (onChangeExe && this.stateModified) {
			onChangeExe();
		}
		this.stateModified = false;
	};

	root.update = function executeUpdate () {
		this.execute();
	};

	root.destroy = function () {
		let res = document.querySelector(container);
		if (res && res.contains(layer)) {
			res.removeChild(layer);
		}
		queueInstance.removeVdom(vDomIndex);
	};

	if (enableEvents) {
		let eventsInstance = new Events(root);
		layer.addEventListener('mousemove', e => {
			e.preventDefault();
			eventsInstance.mousemoveCheck(e);
		});
		layer.addEventListener('click', e => {
			e.preventDefault();
			eventsInstance.clickCheck(e);
		});
		layer.addEventListener('dblclick', e => {
			e.preventDefault();
			eventsInstance.dblclickCheck(e);
		});
		layer.addEventListener('mousedown', e => {
			e.preventDefault();
			eventsInstance.mousedownCheck(e);
		});
		layer.addEventListener('mouseup', e => {
			e.preventDefault();
			eventsInstance.mouseupCheck(e);
		});
		layer.addEventListener('mouseleave', e => {
			e.preventDefault();
			eventsInstance.mouseleaveCheck(e);
		});
		layer.addEventListener('contextmenu', e => {
			e.preventDefault();
			eventsInstance.contextmenuCheck(e);
		});
		layer.addEventListener('touchstart', e => {
			e.preventDefault();
			eventsInstance.touchstartCheck(e);
		});
		layer.addEventListener('touchend', e => {
			e.preventDefault();
			eventsInstance.touchendCheck(e);
		});
		layer.addEventListener('touchmove', e => {
			e.preventDefault();
			eventsInstance.touchmoveCheck(e);
		});
		layer.addEventListener('touchcancel', e => {
			e.preventDefault();
			eventsInstance.touchcancelCheck(e);
		});
	}

	queueInstance.execute();

	if (enableResize) {
		window.addEventListener('resize', resize);
	}

	return root;
}

function canvasNodeLayer (config, height = 0, width = 0) {
	if (!Canvas) {
		console.error('Canvas missing from node');
		console.error('Install "Canvas" "canvas-5-polyfill" node modules');
		console.error('Make "Canvas" "Image" "Path2D" objects global from the above modules');
		return;
	}

	let layer = new Canvas(width, height);
	const ctx = layer.getContext('2d', config);
	ratio = getPixlRatio(ctx);
	let onClear = function (ctx) {
		ctx.clearRect(0, 0, width * ratio, height * ratio);
	};
	const vDomInstance = new VDom();
	const vDomIndex = queueInstance.addVdom(vDomInstance);
	const root = new CanvasNodeExe(ctx, {
		el: 'group',
		attr: {
			id: 'rootNode'
		}
	}, domId(), vDomIndex);
	vDomInstance.rootNode(root);
	const execute = root.execute.bind(root);
	root.domEl = layer;
	root.height = height;
	root.width = width;
	root.type = 'CANVAS';
	root.ENV = 'NODE';

	root.setClear = function (exe) {
		 onClear = exe;
	};

	root.getPixels = function (x, y, width_, height_) {
		return this.ctx.getImageData(x, y, width_, height_);
	};

	root.putPixels = function (imageData, x, y) {
		return this.ctx.putImageData(imageData, x, y);
	};

	root.clear = function () {
		onClear();
	};

	root.setContext = function (prop, value) {
		/** Expecting value to be array if multiple aruments */
		if (this.ctx[prop] && typeof this.ctx[prop] === 'function') {
			this.ctx[prop].apply(null, value);
		} else if (this.ctx[prop]) {
			this.ctx[prop] = value;
		}
	};

	root.execute = function () {
		onClear(ctx);
		ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
		root.updateBBox();
		execute();
	};

	root.toDataURL = function () {
		return this.domEl.toDataURL();
	};

	return root;
}

export default {
	canvasLayer,
	canvasNodeLayer
};
