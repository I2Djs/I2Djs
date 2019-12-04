import queue from './queue.js';
import VDom from './VDom.js';
import colorMap from './colorMap.js';
import shaders from './shaders.js';
import earcut from 'earcut';
import { CollectionPrototype, NodePrototype } from './coreApi.js';

let ratio;
const queueInstance = queue;

function getPixlRatio (ctx) {
	const dpr = window.devicePixelRatio || 1;
	const bsr = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.msBackingStorePixelRatio || ctx.oBackingStorePixelRatio || ctx.backingStorePixelRatio || 1;
	return dpr / bsr;
}

let Id = 0;

function domId () {
	Id += 1;
	return Id;
}

let WebglCollection = function () {
	CollectionPrototype.apply(this, arguments);
};
WebglCollection.prototype = new CollectionPrototype();
WebglCollection.prototype.constructor = WebglCollection;
WebglCollection.prototype.createNode = function (ctx, config, vDomIndex) {
	return new WebglNodeExe(ctx, config, domId(), vDomIndex);
};

function loadShader (ctx, shaderSource, shaderType) {
	var shader = ctx.createShader(shaderType);
	ctx.shaderSource(shader, shaderSource);
	ctx.compileShader(shader);
	var compiled = ctx.getShaderParameter(shader, ctx.COMPILE_STATUS);

	if (!compiled) {
		var lastError = ctx.getShaderInfoLog(shader);
		console.error('*** Error compiling shader \'' + shader + '\':' + lastError);
		ctx.deleteShader(shader);
		return null;
	}

	return shader;
}

function createProgram (ctx, shaders) {
	var program = ctx.createProgram();
	shaders.forEach(function (shader) {
		ctx.attachShader(program, shader);
	});
	ctx.linkProgram(program);
	var linked = ctx.getProgramParameter(program, ctx.LINK_STATUS);

	if (!linked) {
		var lastError = ctx.getProgramInfoLog(program);
		console.error('Error in program linking:' + lastError);
		ctx.deleteProgram(program);
		return null;
	}

	return program;
}

function getProgram (ctx, shaderCode) {
	var shaders = [loadShader(ctx, shaderCode.vertexShader, ctx.VERTEX_SHADER), loadShader(ctx, shaderCode.fragmentShader, ctx.FRAGMENT_SHADER)];
	return createProgram(ctx, shaders);
}

function PointNode (attr, style) {
	this.attr = attr || {};
	this.style = style || {};
}

PointNode.prototype.setAttr = function (prop, value) {
	this.attr[prop] = value;
};

function RectNode (attr, style) {
	this.attr = attr || {};
	this.style = style || {};
}

RectNode.prototype.setAttr = function (key, value) {
	this.attr[key] = value; // this.nodeExe.parent.shader.updatePosition(this.nodeExe.parent.children.indexOf(this.nodeExe),
	                        // this.nodeExe)
};

function PolyLineNode (attr, style) {
	this.attr = attr || {};
	this.style = style || {};
}

PolyLineNode.prototype.setAttr = function (key, value) {
	this.attr[key] = value;
};

PolyLineNode.prototype.getAttr = function (key) {
	return this.attr[key];
};

PolyLineNode.prototype.setStyle = function (key, value) {
	this.style[key] = value;
};

PolyLineNode.prototype.getStyle = function (key) {
	return this.style[key];
};

function LineNode (attr, style) {
	this.attr = attr || {};
	this.style = style || {};
}

LineNode.prototype.setAttr = function (key, value) {
	this.attr[key] = value;
};

LineNode.prototype.getAttr = function (key) {
	return this.attr[key];
};

LineNode.prototype.setStyle = function (key, value) {
	this.style[key] = value;
};

LineNode.prototype.getStyle = function (key) {
	return this.style[key];
};

function polygonPointsMapper (value) {
	return earcut(value.reduce(function (p, c) {
		p.push(c.x);
		p.push(c.y);
		return p;
	}, [])).map(function (d) {
		return value[d];
	});
}

function PolygonNode (attr, style) {
	this.attr = attr;
	this.style = style;

	if (this.attr['points']) {
		this.attr.triangulatedPoints = polygonPointsMapper(this.attr['points']);
	}
}

PolygonNode.prototype.setAttr = function (key, value) {
	if (key === 'points') {
		this.attr.triangulatedPoints = polygonPointsMapper(value);
	}
};

PolygonNode.prototype.getAttr = function (key) {
	return this.attr[key];
};

PolygonNode.prototype.getStyle = function (key) {
	return this.style[key];
};

function CircleNode (attr, style) {
	this.attr = attr;
	this.style = style;
}

CircleNode.prototype.setAttr = function (key, value) {
	this.attr[key] = value;
};

CircleNode.prototype.getAttr = function (key) {
	return this.attr[key];
};

CircleNode.prototype.getStyle = function (key) {
	return this.style[key];
};

let webGLImageTextures = {};

function isPowerOf2 (value) {
	return (value & value - 1) === 0;
}

function ImageNode (ctx, attr, style) {
	let self = this;
	this.attr = attr;
	this.style = style;
	this.image = new Image(); // self.image.crossOrigin="anonymous"
	// self.image.setAttribute('crossOrigin', '*')

	this.image.onload = function onload () {
		this.crossOrigin = 'anonymous';
		queueInstance.vDomChanged(self.nodeExe.vDomIndex);

		if (!webGLImageTextures[self.attr.src]) {
			let texture = ctx.createTexture();
			ctx.bindTexture(ctx.TEXTURE_2D, texture);
			ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, self.image);

			if (isPowerOf2(self.image.width) && isPowerOf2(self.image.height)) {
				// Yes, it's a power of 2. Generate mips.
				// console.log('mips')
				ctx.generateMipmap(ctx.TEXTURE_2D);
				ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST_MIPMAP_LINEAR);
				ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
			} else {
				ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
				ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
				ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
				ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
			}

			webGLImageTextures[self.attr.src] = texture;
		} // self.loadStatus = true
	};

	this.image.onerror = function onerror (onerrorExe) {
		if (onerrorExe && typeof onerrorExe === 'function') { // onerrorExe.call(nodeExe)
		}
	};

	if (this.attr.src) {
		this.image.src = this.attr.src;
	}
};

ImageNode.prototype.setAttr = function (key, value) {
	this.attr[key] = value;

	if (key === 'src') {
		this.image.src = this.attr.src;
	}
};

ImageNode.prototype.getAttr = function (key) {
	return this.attr[key];
};

ImageNode.prototype.getStyle = function (key) {
	return this.style[key];
};

function writeDataToShaderAttributes (ctx, data) {
	let d;

	for (let i = 0, len = data.length; i < len; i++) {
		d = data[i];
		ctx.bindBuffer(d.bufferType, d.buffer);
		ctx.bufferData(d.bufferType, d.data, d.drawType);
		ctx.enableVertexAttribArray(d.attribute);
		ctx.vertexAttribPointer(d.attribute, d.size, d.valueType, true, 0, 0);
	}
}

let defaultColor = {
	r: 0,
	g: 0,
	b: 0,
	a: 255.0
};

function webGlAttrMapper (ctx, program, attr, attrObj) {
	return {
		bufferType: ctx[attrObj.bufferType],
		buffer: ctx.createBuffer(),
		drawType: ctx[attrObj.drawType],
		valueType: ctx[attrObj.valueType],
		size: attrObj.size,
		attribute: ctx.getAttribLocation(program, attr),
		data: attrObj.data
	};
}

function webGlUniformMapper (ctx, program, uniform, uniObj) {
	return {
		type: uniObj.type,
		data: uniObj.data,
		attribute: ctx.getUniformLocation(program, uniform)
	};
}

function RenderWebglShader (ctx, shader, vDomIndex) {
	this.ctx = ctx;
	this.dom = {};
	this.shader = shader;
	this.vDomIndex = vDomIndex;
	this.program = getProgram(ctx, shader);
	this.uniforms = {};
	this.drawArrays = shader.drawArrays;
	this.preDraw = shader.preDraw;
	this.postDraw = shader.postDraw;

	for (let uniform in shader.uniforms) {
		this.uniforms[uniform] = webGlUniformMapper(ctx, this.program, uniform, shader.uniforms[uniform]);
	}

	this.inputs = [];

	for (let attr in shader.attributes) {
		this.inputs.push(webGlAttrMapper(ctx, this.program, attr, shader.attributes[attr]));
	}
}

RenderWebglShader.prototype.execute = function () {
	this.ctx.useProgram(this.program);

	for (let uniform in this.uniforms) {
		this.ctx[this.uniforms[uniform].type](this.uniforms[uniform].attribute, this.uniforms[uniform].data);
	}

	writeDataToShaderAttributes(this.ctx, this.inputs);

	if (typeof this.preDraw === 'function') {
		this.preDraw(this.ctx);
	}

	for (let item in this.drawArrays) {
		this.ctx.drawArrays(this.ctx[this.drawArrays[item].type], this.drawArrays[item].start, this.drawArrays[item].end);
	}

	if (typeof this.preDraw === 'function') {
		this.postDraw(this.ctx);
	}
};

RenderWebglShader.prototype.addUniform = function (key, value) {
	this.uniforms[key] = value;
};

RenderWebglShader.prototype.addAttribute = function (key, value) {
	this.attribute[key] = value;
};

RenderWebglShader.prototype.setAttribute = function (key, value) {
};

RenderWebglShader.prototype.setUniformData = function (key, value) {
	this.uniforms[key].data = value;
	queueInstance.vDomChanged(this.vDomIndex);
};

function RenderWebglPoints (ctx, attr, style, vDomIndex) {
	this.ctx = ctx;
	this.dom = {};
	this.attr = attr || {};
	this.style = style || {};
	this.vDomIndex = vDomIndex;
	this.program = getProgram(ctx, shaders('point'));
	this.colorBuffer = ctx.createBuffer();
	this.sizeBuffer = ctx.createBuffer();
	this.positionBuffer = ctx.createBuffer();
	this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position');
	this.colorAttributeLocation = ctx.getAttribLocation(this.program, 'a_color');
	this.sizeAttributeLocation = ctx.getAttribLocation(this.program, 'a_size');
	this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution');
	this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate');
	this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale'); // this.ctx.uniform2f(this.resolutionUniformLocation,
	                                                                             // this.ctx.canvas.width,
	                                                                             // this.ctx.canvas.height)

	this.positionArray = [];
	this.colorArray = [];
	this.pointsSize = [];
	this.inputs = [{
		bufferType: this.ctx.ARRAY_BUFFER,
		buffer: this.colorBuffer,
		drawType: this.ctx.STATIC_DRAW,
		valueType: this.ctx.UNSIGNED_BYTE,
		size: 4,
		attribute: this.colorAttributeLocation
	}, {
		bufferType: this.ctx.ARRAY_BUFFER,
		buffer: this.sizeBuffer,
		drawType: this.ctx.STATIC_DRAW,
		valueType: this.ctx.FLOAT,
		size: 1,
		attribute: this.sizeAttributeLocation
	}, {
		bufferType: this.ctx.ARRAY_BUFFER,
		buffer: this.positionBuffer,
		drawType: this.ctx.STATIC_DRAW,
		valueType: this.ctx.FLOAT,
		size: 2,
		attribute: this.positionAttributeLocation
	}];

	if (!this.attr.transform) {
		this.attr.transform = {
			translate: [0.0, 0.0],
			scale: [1.0, 1.0]
		};
	}
}

RenderWebglPoints.prototype.remove = function (position) {
	this.positionArray.splice(position * 2, 2);
	this.pointsSize.splice(position, 1);
	this.colorArray.splice(position * 4, 4);
};

RenderWebglPoints.prototype.execute = function (stack) {
	let positionArray = this.positionArray;
	let colorArray = this.colorArray;
	let pointsSize = this.pointsSize;
	let node;
	let fill;
	let styleFlag = false;
	let attrFlag = false;

	for (var i = 0, len = stack.length; i < len; i++) {
		node = stack[i];

		if (node.propChanged) {
			positionArray[i * 2] = node.attr.x;
			positionArray[(i * 2) + 1] = node.attr.y;
			pointsSize[i] = (node.attr.size || 1.0) * ratio;
			attrFlag = true;
			node.propChanged = false;
		}

		if (node.styleChanged) {
			fill = node.style.fill || defaultColor;
			colorArray[i * 4] = fill.r;
			colorArray[(i * 4) + 1] = fill.g;
			colorArray[(i * 4) + 2] = fill.b;
			colorArray[(i * 4) + 3] = fill.a === undefined ? 255 : fill.a;
			styleFlag = true;
			node.styleChanged = false;
		}
	}

	if (attrFlag) {
		this.inputs[2].data = new Float32Array(positionArray);
		this.inputs[1].data = new Float32Array(pointsSize);
	}

	if (styleFlag) {
		this.inputs[0].data = new Uint8Array(colorArray);
	}

	if (!this.attr.transform.scale) {
		this.attr.transform.scale = [1.0, 1.0];
	}

	if (!this.attr.transform.translate) {
		this.attr.transform.translate = [0.0, 0.0];
	}

	this.ctx.useProgram(this.program);
	writeDataToShaderAttributes(this.ctx, this.inputs);
	this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio);
	this.ctx.uniform2fv(this.translationUniformLocation, [this.attr.transform.translate[0], this.attr.transform.translate[1]]);
	this.ctx.uniform2fv(this.scaleUniformLocation, [this.attr.transform.scale[0], this.attr.transform.scale[1]]);
	this.ctx.drawArrays(this.ctx.POINTS, 0, positionArray.length / 2);
};

function RenderWebglRects (ctx, attr, style, vDomIndex) {
	this.ctx = ctx;
	this.dom = {};
	this.attr = attr || {};
	this.style = style || {};
	this.vDomIndex = vDomIndex;
	this.program = getProgram(ctx, shaders('rect'));
	this.colorBuffer = ctx.createBuffer();
	this.positionBuffer = ctx.createBuffer();
	this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position');
	this.colorAttributeLocation = ctx.getAttribLocation(this.program, 'a_color');
	this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution');
	this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate');
	this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale');
	this.positionArray = [];
	this.colorArray = [];
	this.inputs = [{
		data: this.colorArray,
		bufferType: this.ctx.ARRAY_BUFFER,
		buffer: this.colorBuffer,
		drawType: this.ctx.STATIC_DRAW,
		valueType: this.ctx.UNSIGNED_BYTE,
		size: 4,
		attribute: this.colorAttributeLocation
	}, {
		data: new Float32Array(this.positionArray),
		bufferType: this.ctx.ARRAY_BUFFER,
		buffer: this.positionBuffer,
		drawType: this.ctx.STATIC_DRAW,
		valueType: this.ctx.FLOAT,
		size: 2,
		attribute: this.positionAttributeLocation
	}];

	if (!this.attr.transform) {
		this.attr.transform = {
			translate: [0.0, 0.0],
			scale: [1.0, 1.0]
		};
	}
}

RenderWebglRects.prototype.remove = function (position) {
	this.positionArray.splice(position * 12, 12);
	this.colorArray.splice(position * 24, 24);
};

RenderWebglRects.prototype.execute = function (stack) {
	let positionArray = this.positionArray;
	let colorArray = this.colorArray;
	let fill, r, g, b, a, x1, x2, y1, y2;
	let node;
	let ti;
	let posi;

	for (var i = 0, len = stack.length; i < len; i++) {
		node = stack[i];

		if (node.propChanged) {
			x1 = node.attr.x;
			x2 = x1 + node.attr.width;
			y1 = node.attr.y;
			y2 = y1 + node.attr.height;
			posi = i * 12;
			positionArray[posi] = positionArray[posi + 4] = positionArray[posi + 6] = x1;
			positionArray[posi + 1] = positionArray[posi + 3] = positionArray[posi + 9] = y1;
			positionArray[posi + 2] = positionArray[posi + 8] = positionArray[posi + 10] = x2;
			positionArray[posi + 5] = positionArray[posi + 7] = positionArray[posi + 11] = y2;
			node.propChanged = false;
		}

		if (node.styleChanged) {
			fill = node.style.fill || defaultColor;
			r = fill.r;
			g = fill.g;
			b = fill.b;
			a = fill.a === undefined ? 255 : fill.a;
			ti = i * 24;
			colorArray[ti] = colorArray[ti + 4] = colorArray[ti + 8] = colorArray[ti + 12] = colorArray[ti + 16] = colorArray[ti + 20] = r;
			colorArray[ti + 1] = colorArray[ti + 5] = colorArray[ti + 9] = colorArray[ti + 13] = colorArray[ti + 17] = colorArray[ti + 21] = g;
			colorArray[ti + 2] = colorArray[ti + 6] = colorArray[ti + 10] = colorArray[ti + 14] = colorArray[ti + 18] = colorArray[ti + 22] = b;
			colorArray[ti + 3] = colorArray[ti + 7] = colorArray[ti + 11] = colorArray[ti + 15] = colorArray[ti + 19] = colorArray[ti + 23] = a;
			node.styleChanged = false;
		}
	}

	if (!this.attr.transform.scale) {
		this.attr.transform.scale = [1.0, 1.0];
	}

	if (!this.attr.transform.translate) {
		this.attr.transform.translate = [0.0, 0.0];
	}

	this.inputs[0].data = new Uint8Array(this.colorArray);
	this.inputs[1].data = new Float32Array(this.positionArray);
	writeDataToShaderAttributes(this.ctx, this.inputs);
	this.ctx.useProgram(this.program);
	this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio);
	this.ctx.uniform2fv(this.translationUniformLocation, [this.attr.transform.translate[0], this.attr.transform.translate[1]]);
	this.ctx.uniform2fv(this.scaleUniformLocation, [this.attr.transform.scale[0], this.attr.transform.scale[1]]);
	this.ctx.drawArrays(this.ctx.TRIANGLES, 0, positionArray.length / 2);
};

function RenderWebglLines (ctx, attr, style, vDomIndex) {
	this.ctx = ctx;
	this.dom = {};
	this.attr = attr || {};
	this.style = style || {};
	this.vDomIndex = vDomIndex;
	this.program = getProgram(ctx, shaders('line'));
	this.colorBuffer = ctx.createBuffer();
	this.positionBuffer = ctx.createBuffer();
	this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position');
	this.colorAttributeLocation = ctx.getAttribLocation(this.program, 'a_color');
	this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution');
	this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate');
	this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale');
	this.positionArray = [];
	this.colorArray = [];
	this.inputs = [{
		bufferType: this.ctx.ARRAY_BUFFER,
		buffer: this.colorBuffer,
		drawType: this.ctx.STATIC_DRAW,
		valueType: this.ctx.UNSIGNED_BYTE,
		size: 4,
		attribute: this.colorAttributeLocation
	}, {
		bufferType: this.ctx.ARRAY_BUFFER,
		buffer: this.positionBuffer,
		drawType: this.ctx.DYNAMIC_DRAW,
		valueType: this.ctx.FLOAT,
		size: 2,
		attribute: this.positionAttributeLocation
	}];

	if (!this.attr.transform) {
		this.attr.transform = {
			translate: [0.0, 0.0],
			scale: [1.0, 1.0]
		};
	}
}

RenderWebglLines.prototype.remove = function (position) {
	this.positionArray.splice(position * 4, 4);
	this.colorArray.splice(position * 8, 8);
};

RenderWebglLines.prototype.execute = function (stack) {
	let positionArray = this.positionArray;
	let colorArray = this.colorArray;
	let node, r, g, b, a, stroke;

	for (var i = 0, len = stack.length; i < len; i++) {
		node = stack[i];

		if (node.propChanged) {
			positionArray[i * 4] = node.attr.x1;
			positionArray[(i * 4) + 1] = node.attr.y1;
			positionArray[(i * 4) + 2] = node.attr.x2;
			positionArray[(i * 4) + 3] = node.attr.y2;
		}

		if (node.styleChanged) {
			stroke = node.style.stroke || defaultColor;
			r = stroke.r;
			g = stroke.g;
			b = stroke.b;
			a = stroke.a === undefined ? 255 : stroke.a;
			colorArray[i * 8] = r;
			colorArray[(i * 8) + 1] = g;
			colorArray[(i * 8) + 2] = b;
			colorArray[(i * 8) + 3] = a;
			colorArray[(i * 8) + 4] = r;
			colorArray[(i * 8) + 5] = g;
			colorArray[(i * 8) + 6] = b;
			colorArray[(i * 8) + 7] = a;
			node.styleChanged = false;
		}
	}

	if (!this.attr.transform.scale) {
		this.attr.transform.scale = [1.0, 1.0];
	}

	if (!this.attr.transform.translate) {
		this.attr.transform.translate = [0.0, 0.0];
	}

	this.inputs[0].data = new Uint8Array(this.colorArray);
	this.inputs[1].data = new Float32Array(this.positionArray);
	writeDataToShaderAttributes(this.ctx, this.inputs);
	this.ctx.useProgram(this.program);
	this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio);
	this.ctx.uniform2fv(this.translationUniformLocation, [this.attr.transform.translate[0], this.attr.transform.translate[1]]);
	this.ctx.uniform2fv(this.scaleUniformLocation, [this.attr.transform.scale[0], this.attr.transform.scale[1]]);
	this.ctx.drawArrays(this.ctx.LINES, 0, positionArray.length / 2);
};

function RenderWebglPolyLines (ctx, attr, style, vDomIndex) {
	this.ctx = ctx;
	this.dom = {};
	this.attr = attr || {};
	this.style = style || {};
	this.vDomIndex = vDomIndex;
	this.program = getProgram(ctx, shaders('line'));
	this.colorBuffer = ctx.createBuffer();
	this.positionBuffer = ctx.createBuffer();
	this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position');
	this.colorAttributeLocation = ctx.getAttribLocation(this.program, 'a_color');
	this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution');
	this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate');
	this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale');
	this.polyLineArray = []; // this.colorArray = []

	this.inputs = [{
		bufferType: this.ctx.ARRAY_BUFFER,
		buffer: this.colorBuffer,
		drawType: this.ctx.STATIC_DRAW,
		valueType: this.ctx.UNSIGNED_BYTE,
		size: 4,
		attribute: this.colorAttributeLocation
	}, {
		bufferType: this.ctx.ARRAY_BUFFER,
		buffer: this.positionBuffer,
		drawType: this.ctx.DYNAMIC_DRAW,
		valueType: this.ctx.FLOAT,
		size: 2,
		attribute: this.positionAttributeLocation
	}];

	if (!this.attr.transform) {
		this.attr.transform = {
			translate: [0.0, 0.0],
			scale: [1.0, 1.0]
		};
	}
}

RenderWebglPolyLines.prototype.remove = function (position) {
	this.polyLineArray.splice(position, 1);
};

RenderWebglPolyLines.prototype.execute = function (stack) {
	let node;
	let fill;
	let points;

	if (!this.attr.transform.scale) {
		this.attr.transform.scale = [1.0, 1.0];
	}

	if (!this.attr.transform.translate) {
		this.attr.transform.translate = [0.0, 0.0];
	}

	this.ctx.useProgram(this.program);
	this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio);
	this.ctx.uniform2fv(this.translationUniformLocation, [this.attr.transform.translate[0], this.attr.transform.translate[1]]);
	this.ctx.uniform2fv(this.scaleUniformLocation, [this.attr.transform.scale[0], this.attr.transform.scale[1]]);

	for (let i = 0, len = stack.length; i < len; i++) {
		node = stack[i];
		fill = node.style.stroke;
		points = node.attr.points;
		fill = fill || defaultColor;

		if (node.propChanged) {
			let positionArray = [];

			for (let j = 0, jlen = points.length; j < jlen; j++) {
				positionArray[j * 2] = points[j].x;
				positionArray[(j * 2) + 1] = points[j].y;
			}

			if (!this.polyLineArray[i]) {
				this.polyLineArray[i] = {};
			}

			this.polyLineArray[i].positionArray = new Float32Array(positionArray);
		}

		if (node.styleChanged) {
			let colorArray = [];
			let r = fill.r || 0;
			let g = fill.g || 0;
			let b = fill.b || 0;
			let a = fill.a === undefined ? 255 : fill.a;

			for (let j = 0, jlen = points.length; j < jlen; j++) {
				colorArray[j * 4] = r;
				colorArray[(j * 4) + 1] = g;
				colorArray[(j * 4) + 2] = b;
				colorArray[(j * 4) + 3] = a;
			}

			this.polyLineArray[i].colorArray = new Uint8Array(colorArray);
		}

		this.inputs[0].data = this.polyLineArray[i].colorArray;
		this.inputs[1].data = this.polyLineArray[i].positionArray;
		writeDataToShaderAttributes(this.ctx, this.inputs);
		this.ctx.drawArrays(this.ctx.LINE_STRIP, 0, this.polyLineArray[i].positionArray.length / 2);
	}
};

function RenderWebglPolygons (ctx, attr, style, vDomIndex) {
	this.ctx = ctx;
	this.dom = {};
	this.attr = attr || {};
	this.style = style || {};
	this.vDomIndex = vDomIndex;
	this.program = getProgram(ctx, shaders('line'));
	this.colorBuffer = ctx.createBuffer();
	this.positionBuffer = ctx.createBuffer();
	this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position');
	this.colorAttributeLocation = ctx.getAttribLocation(this.program, 'a_color');
	this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution');
	this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate');
	this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale');
	this.polygonArray = [];
	this.inputs = [{
		bufferType: this.ctx.ARRAY_BUFFER,
		buffer: this.colorBuffer,
		drawType: this.ctx.STATIC_DRAW,
		valueType: this.ctx.UNSIGNED_BYTE,
		size: 4,
		attribute: this.colorAttributeLocation
	}, {
		bufferType: this.ctx.ARRAY_BUFFER,
		buffer: this.positionBuffer,
		drawType: this.ctx.DYNAMIC_DRAW,
		valueType: this.ctx.FLOAT,
		size: 2,
		attribute: this.positionAttributeLocation
	}];

	if (!this.attr.transform) {
		this.attr.transform = {
			translate: [0.0, 0.0],
			scale: [1.0, 1.0]
		};
	}
}

RenderWebglPolygons.prototype.remove = function (position) {
	this.polygonArray.splice(position, 1);
};

RenderWebglPolygons.prototype.execute = function (stack) {
	this.ctx.useProgram(this.program);

	if (!this.attr.transform.scale) {
		this.attr.transform.scale = [1.0, 1.0];
	}

	if (!this.attr.transform.translate) {
		this.attr.transform.translate = [0.0, 0.0];
	}

	this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio);
	this.ctx.uniform2fv(this.translationUniformLocation, [this.attr.transform.translate[0], this.attr.transform.translate[1]]);
	this.ctx.uniform2fv(this.scaleUniformLocation, [this.attr.transform.scale[0], this.attr.transform.scale[1]]);

	for (var i = 0, len = stack.length; i < len; i++) {
		let node = stack[i];
		let points = node.attr.triangulatedPoints;

		if (node.propChanged) {
			let positionArray = [];

			for (let j = 0, jlen = points.length; j < jlen; j++) {
				positionArray[j * 2] = points[j].x;
				positionArray[(j * 2) + 1] = points[j].y;
			}

			if (!this.polygonArray[i]) {
				this.polygonArray[i] = {};
			}

			this.polygonArray[i].positionArray = new Float32Array(positionArray);
		}

		if (node.styleChanged) {
			let colorArray = [];
			let fill = node.style.fill;
			fill = fill || defaultColor;
			let r = fill.r || 0;
			let g = fill.g || 0;
			let b = fill.b || 0;
			let a = fill.a === undefined ? 255 : fill.a;

			for (let j = 0, jlen = points.length; j < jlen; j++) {
				colorArray[j * 4] = r;
				colorArray[(j * 4) + 1] = g;
				colorArray[(j * 4) + 2] = b;
				colorArray[(j * 4) + 3] = a;
			}

			this.polygonArray[i].colorArray = new Uint8Array(colorArray);
		}

		this.inputs[0].data = this.polygonArray[i].colorArray;
		this.inputs[1].data = this.polygonArray[i].positionArray;
		writeDataToShaderAttributes(this.ctx, this.inputs);
		this.ctx.drawArrays(this.ctx.TRIANGLES, 0, this.polygonArray[i].positionArray.length / 2);
	}
};

function RenderWebglCircles (ctx, attr, style, vDomIndex) {
	this.ctx = ctx;
	this.dom = {};
	this.attr = attr || {};
	this.style = style || {};
	this.vDomIndex = vDomIndex;
	this.program = getProgram(ctx, shaders('circle'));
	this.colorBuffer = ctx.createBuffer();
	this.radiusBuffer = ctx.createBuffer();
	this.positionBuffer = ctx.createBuffer();
	this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position');
	this.colorAttributeLocation = ctx.getAttribLocation(this.program, 'a_color');
	this.radiusAttributeLocation = ctx.getAttribLocation(this.program, 'a_radius');
	this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution');
	this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate');
	this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale');
	this.positionArray = [];
	this.colorArray = [];
	this.radius = [];
	this.inputs = [{
		bufferType: this.ctx.ARRAY_BUFFER,
		buffer: this.colorBuffer,
		drawType: this.ctx.STATIC_DRAW,
		valueType: this.ctx.UNSIGNED_BYTE,
		size: 4,
		attribute: this.colorAttributeLocation
	}, {
		bufferType: this.ctx.ARRAY_BUFFER,
		buffer: this.radiusBuffer,
		drawType: this.ctx.STATIC_DRAW,
		valueType: this.ctx.FLOAT,
		size: 1,
		attribute: this.radiusAttributeLocation
	}, {
		bufferType: this.ctx.ARRAY_BUFFER,
		buffer: this.positionBuffer,
		drawType: this.ctx.DYNAMIC_DRAW,
		valueType: this.ctx.FLOAT,
		size: 2,
		attribute: this.positionAttributeLocation
	}];

	if (!this.attr.transform) {
		this.attr.transform = {
			translate: [0.0, 0.0],
			scale: [1.0, 1.0]
		};
	}
};

RenderWebglCircles.prototype.remove = function (position) {
	this.positionArray.splice(position * 2, 2);
	this.radius.splice(position, 1);
	this.colorArray.splice(position * 4, 4);
};

RenderWebglCircles.prototype.execute = function (stack) {
	this.ctx.useProgram(this.program);

	if (!this.attr.transform.scale) {
		this.attr.transform.scale = [1.0, 1.0];
	}

	if (!this.attr.transform.translate) {
		this.attr.transform.translate = [0.0, 0.0];
	}

	this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio);
	this.ctx.uniform2fv(this.translationUniformLocation, [this.attr.transform.translate[0], this.attr.transform.translate[1]]);
	this.ctx.uniform2fv(this.scaleUniformLocation, [this.attr.transform.scale[0], this.attr.transform.scale[1]]);
	let positionArray = this.positionArray;
	let colorArray = this.colorArray;
	let radius = this.radius;
	let attrFlag;
	let styleFlag;

	for (var i = 0, len = stack.length; i < len; i++) {
		let node = stack[i];
		let fill = node.style.fill;
		fill = fill || defaultColor;

		if (node.propChanged) {
			positionArray[i * 2] = node.attr.cx;
			positionArray[(i * 2) + 1] = node.attr.cy;
			radius[i] = node.attr.r * ratio;
			node.propChanged = false;
			attrFlag = true;
		}

		if (node.styleChanged) {
			colorArray[i * 4] = fill.r;
			colorArray[(i * 4) + 1] = fill.g;
			colorArray[(i * 4) + 2] = fill.b;
			colorArray[(i * 4) + 3] = fill.a === undefined ? 255 : fill.a;
			node.styleChanged = false;
			styleFlag = true;
		}
	}

	if (attrFlag) {
		this.inputs[2].data = new Float32Array(positionArray);
		this.inputs[1].data = new Float32Array(radius);
	}

	if (styleFlag) {
		this.inputs[0].data = new Uint8Array(colorArray);
	}

	writeDataToShaderAttributes(this.ctx, this.inputs);
	this.ctx.drawArrays(this.ctx.POINTS, 0, positionArray.length / 2);
};

function RenderWebglImages (ctx, attr, style, vDomIndex) {
	this.ctx = ctx;
	this.dom = {};
	this.attr = attr || {};
	this.style = style || {};
	this.vDomIndex = vDomIndex;
	this.program = getProgram(ctx, shaders('image'));
	this.texture = ctx.createTexture();
	this.texCoordBuffer = ctx.createBuffer();
	this.positionBuffer = ctx.createBuffer();
	this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position');
	this.texCoordAttributeLocation = ctx.getAttribLocation(this.program, 'a_texCoord');
	this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution');
	this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate');
	this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale');
	this.imagesArray = [];
	this.texArray = new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]);
	this.inputs = [{
		bufferType: this.ctx.ARRAY_BUFFER,
		buffer: this.positionBuffer,
		drawType: this.ctx.DYNAMIC_DRAW,
		valueType: this.ctx.FLOAT,
		size: 2,
		attribute: this.positionAttributeLocation
	}];

	if (!this.attr.transform) {
		this.attr.transform = {
			translate: [0.0, 0.0],
			scale: [1.0, 1.0]
		};
	}
}

RenderWebglImages.prototype.remove = function (position) {
	this.imagesArray.splice(position, 1);
};

RenderWebglImages.prototype.execute = function (stack) {
	this.ctx.enable(this.ctx.BLEND);
	this.ctx.blendFunc(this.ctx.ONE, this.ctx.ONE_MINUS_SRC_ALPHA);
	this.ctx.useProgram(this.program);

	if (!this.attr.transform.scale) {
		this.attr.transform.scale = [1.0, 1.0];
	}

	if (!this.attr.transform.translate) {
		this.attr.transform.translate = [0.0, 0.0];
	}

	this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio);
	this.ctx.uniform2fv(this.translationUniformLocation, [this.attr.transform.translate[0], this.attr.transform.translate[1]]);
	this.ctx.uniform2fv(this.scaleUniformLocation, [this.attr.transform.scale[0], this.attr.transform.scale[1]]);
	writeDataToShaderAttributes(this.ctx, [{
		bufferType: this.ctx.ARRAY_BUFFER,
		data: this.texArray,
		buffer: this.texCoordBuffer,
		drawType: this.ctx.STATIC_DRAW,
		valueType: this.ctx.FLOAT,
		size: 2,
		attribute: this.texCoordAttributeLocation
	}]);
	let x1, x2, y1, y2;
	let activeTexture = null;

	for (var i = 0, len = stack.length; i < len; i++) {
		if (!this.imagesArray[i]) {
			this.imagesArray[i] = {
				positionArray: new Float32Array(12)
			};
		}

		let positionArray = this.imagesArray[i].positionArray;
		let node = stack[i];

		if (node.propChanged) {
			x1 = node.attr.x;
			x2 = x1 + node.attr.width;
			y1 = node.attr.y;
			y2 = y1 + node.attr.height;
			positionArray[0] = positionArray[4] = positionArray[6] = x1;
			positionArray[1] = positionArray[3] = positionArray[9] = y1;
			positionArray[2] = positionArray[8] = positionArray[10] = x2;
			positionArray[5] = positionArray[7] = positionArray[11] = y2;
			node.propChanged = false;
		}

		if (!webGLImageTextures[node.attr.src]) {
			continue;
		}

		this.inputs[0].data = this.imagesArray[i].positionArray;
		writeDataToShaderAttributes(this.ctx, this.inputs);

		if (activeTexture !== webGLImageTextures[node.attr.src]) {
			this.ctx.bindTexture(this.ctx.TEXTURE_2D, webGLImageTextures[node.attr.src]);
			activeTexture = webGLImageTextures[node.attr.src];
		}

		this.ctx.drawArrays(this.ctx.TRIANGLES, 0, this.imagesArray[i].positionArray.length / 2);
	}
};

function RenderWebglGroup (ctx, attr, style, shader, vDomIndex, shaderObject) {
	let e;
	this.ctx = ctx;

	switch (shader) {
		case 'rects':
			e = new RenderWebglRects(ctx, attr, style, vDomIndex);
			break;

		case 'points':
			e = new RenderWebglPoints(ctx, attr, style, vDomIndex);
			break;

		case 'lines':
			e = new RenderWebglLines(ctx, attr, style, vDomIndex);
			break;

		case 'polylines':
			e = new RenderWebglPolyLines(ctx, attr, style, vDomIndex);
			break;

		case 'polygons':
			e = new RenderWebglPolygons(ctx, attr, style, vDomIndex);
			break;

		case 'circles':
			e = new RenderWebglCircles(ctx, attr, style, vDomIndex);
			break;

		case 'images':
			e = new RenderWebglImages(ctx, attr, style, vDomIndex);
			break;

		default:
			e = null;
			break;
	}

	this.shader = e;
}

RenderWebglGroup.prototype.execute = function (stack) {
	this.shader.execute(stack);
};

function WebglNodeExe (ctx, config, id, vDomIndex) {
	this.ctx = ctx;
	this.style = config.style ? config.style : {};
	this.attr = config.attr ? config.attr : {};
	this.id = id;
	this.nodeName = config.el;
	this.nodeType = 'WEBGL';
	this.children = [];
	this.ctx = ctx;
	this.vDomIndex = vDomIndex;
	this.el = config.el;
	this.shaderType = config.shaderType;

	switch (config.el) {
		case 'point':
			this.dom = new PointNode(this.attr, this.style);
			break;

		case 'rect':
			this.dom = new RectNode(this.attr, this.style);
			break;

		case 'line':
			this.dom = new LineNode(this.attr, this.style);
			break;

		case 'polyline':
			this.dom = new PolyLineNode(this.attr, this.style);
			break;

		case 'polygon':
			this.dom = new PolygonNode(this.attr, this.style);
			break;

		case 'circle':
			this.dom = new CircleNode(this.attr, this.style);
			break;

		case 'image':
			this.dom = new ImageNode(ctx, this.attr, this.style);
			break;

		case 'group':
			this.dom = new RenderWebglGroup(this.ctx, this.attr, this.style, this.shaderType, this.vDomIndex, config.shaderObject);
			break;

		default:
			this.dom = null;
			break;
	}

	this.dom.nodeExe = this;
	this.propChanged = true;
}

WebglNodeExe.prototype = new NodePrototype();

WebglNodeExe.prototype.setAttr = function WsetAttr (attr, value) {
	if (arguments.length === 2) {
		this.attr[attr] = value;
		this.dom.setAttr(attr, value);
	} else if (arguments.length === 1 && typeof attr === 'object') {
		for (let key in attr) {
			this.attr[key] = attr[key];
			this.dom.setAttr(key, attr[key]);
		}
	}

	this.propChanged = true;
	queueInstance.vDomChanged(this.vDomIndex);
	return this;
};

WebglNodeExe.prototype.setStyle = function WsetStyle (attr, value) {
	if (arguments.length === 2) {
		if (attr === 'fill' || attr === 'stroke') {
			value = colorMap.colorToRGB(value);
		}

		this.style[attr] = value;
	} else if (arguments.length === 1 && typeof attr === 'object') {
		for (let key in attr) {
			value = attr[key];

			if (key === 'fill' || key === 'stroke') {
				value = colorMap.colorToRGB(attr[key]);
			}

			this.style[key] = value;
		}
	}

	this.styleChanged = true;
	queueInstance.vDomChanged(this.vDomIndex);
	return this;
};

WebglNodeExe.prototype.execute = function Cexecute () {
	if (!this.dom.shader && this.dom instanceof RenderWebglGroup) {
		for (let i = 0, len = this.children.length; i < len; i += 1) {
			this.children[i].execute();
		}
	} else if (this.dom.shader) {
		this.dom.execute(this.children);
	}
};

WebglNodeExe.prototype.child = function child (childrens) {
	const self = this;

	if (self.dom instanceof RenderWebglGroup) {
		for (let i = 0; i < childrens.length; i += 1) {
			childrens[i].dom.parent = self;
			childrens[i].nindex = self.children.length;
			self.children[self.children.length] = childrens[i];
		}
	} else {
		console.log('Error');
	}

	this.BBoxUpdate = true;
	queueInstance.vDomChanged(this.vDomIndex);
	return self;
};

WebglNodeExe.prototype.createEls = function CcreateEls (data, config) {
	const e = new WebglCollection({
		type: 'WEBGL',
		ctx: this.dom.ctx
	}, data, config, this.vDomIndex);
	this.child(e.stack);
	queueInstance.vDomChanged(this.vDomIndex);
	return e;
};

WebglNodeExe.prototype.createEl = function WcreateEl (config) {
	const e = new WebglNodeExe(this.ctx, config, domId(), this.vDomIndex);
	this.child([e]);
	queueInstance.vDomChanged(this.vDomIndex);
	return e;
};

WebglNodeExe.prototype.createShaderEl = function createShader (shaderObject) {
	const e = new RenderWebglShader(this.ctx, shaderObject, this.vDomIndex);
	this.child([e]);
	queueInstance.vDomChanged(this.vDomIndex);
	return e;
};

WebglNodeExe.prototype.remove = function Wremove () {
	const {
		children
	} = this.dom.parent;
	const index = children.indexOf(this);

	if (index !== -1) {
		children.splice(index, 1);

		if (this.dom.parent.dom.shader) {
			this.dom.parent.dom.shader.remove(index);
		}
	}

	this.BBoxUpdate = true;
	queueInstance.vDomChanged(this.vDomIndex);
};

WebglNodeExe.prototype.removeChild = function WremoveChild (obj) {
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

	queueInstance.vDomChanged(this.vDomIndex);
};

function WebGLLayer (container, config = {}, eventsFlag = true, autoUpdateFlag = true) {
	const res = container ? document.querySelector(container) : null;
	const height = res ? res.clientHeight : 0;
	const width = res ? res.clientWidth : 0;
	// config.clearColor ? colorMap.colorToRGB(config.clearColor) : 
	let clearColor = {
		r: 0,
		g: 0,
		b: 0,
		a: 0
	};
	config = config || {
		premultipliedAlpha: false,
		depth: false,
		antialias: false,
		alpha: true
	};
	const layer = document.createElement('canvas');
	const ctx = layer.getContext('webgl', config);

	ratio = getPixlRatio(ctx);
	ctx.enable(ctx.BLEND);
	ctx.blendFunc(ctx.SRC_ALPHA, ctx.DST_ALPHA);
	ctx.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a);
	layer.setAttribute('height', height * ratio);
	layer.setAttribute('width', width * ratio);
	layer.style.height = `${height}px`;
	layer.style.width = `${width}px`;
	layer.style.position = 'absolute';

	let vDomInstance;
	let vDomIndex = 999999;

	if (res) {
		res.appendChild(layer);
		vDomInstance = new VDom();
		if (autoUpdateFlag) {
			vDomIndex = queueInstance.addVdom(vDomInstance);
		}
	}
	
	const root = new WebglNodeExe(ctx, {
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
	root.type = 'WEBGL';
	root.pixelRatio = ratio;


	root.execute = function executeExe () {
		this.ctx.viewport(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
		this.ctx.clear(this.ctx.COLOR_BUFFER_BIT | this.ctx.DEPTH_BUFFER_BIT);
		execute();
	};

	root.destroy = function () {
		queueInstance.removeVdom(vDomIndex);
	};

	root.setSize = function (width_, height_) {
		this.domEl.setAttribute('height', height_ * ratio);
		this.domEl.setAttribute('width', width_ * ratio);
		this.domEl.style.height = `${height_}px`;
		this.domEl.style.width = `${width_}px`;
		this.width = width_;
		this.height = height_;
		height = height_;
		width = width_;
		this.execute();
	};

	root.setViewBox = function (x, y, height, width) {
	};

	root.setStyle = function (prop, value) {
		this.domEl.style[prop] = value;
	};

	root.setContext = function (prop, value) {
		/** Expecting value to be array if multiple aruments */
		if (this.ctx[prop] && typeof this.ctx[prop] === 'function') {
			this.ctx[prop].apply(null, value);
		} else if (this.ctx[prop]) {
			this.ctx[prop] = value;
		}
	};

	queueInstance.execute();
	return root;
}

export default WebGLLayer;
