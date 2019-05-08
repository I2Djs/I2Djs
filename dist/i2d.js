(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("i2d", [], factory);
	else if(typeof exports === 'object')
		exports["i2d"] = factory();
	else
		root["i2d"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/renderer.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/earcut/src/earcut.js":
/*!*******************************************!*\
  !*** ./node_modules/earcut/src/earcut.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = earcut;
module.exports.default = earcut;

function earcut(data, holeIndices, dim) {

    dim = dim || 2;

    var hasHoles = holeIndices && holeIndices.length,
        outerLen = hasHoles ? holeIndices[0] * dim : data.length,
        outerNode = linkedList(data, 0, outerLen, dim, true),
        triangles = [];

    if (!outerNode) return triangles;

    var minX, minY, maxX, maxY, x, y, invSize;

    if (hasHoles) outerNode = eliminateHoles(data, holeIndices, outerNode, dim);

    // if the shape is not too simple, we'll use z-order curve hash later; calculate polygon bbox
    if (data.length > 80 * dim) {
        minX = maxX = data[0];
        minY = maxY = data[1];

        for (var i = dim; i < outerLen; i += dim) {
            x = data[i];
            y = data[i + 1];
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
        }

        // minX, minY and invSize are later used to transform coords into integers for z-order calculation
        invSize = Math.max(maxX - minX, maxY - minY);
        invSize = invSize !== 0 ? 1 / invSize : 0;
    }

    earcutLinked(outerNode, triangles, dim, minX, minY, invSize);

    return triangles;
}

// create a circular doubly linked list from polygon points in the specified winding order
function linkedList(data, start, end, dim, clockwise) {
    var i, last;

    if (clockwise === (signedArea(data, start, end, dim) > 0)) {
        for (i = start; i < end; i += dim) last = insertNode(i, data[i], data[i + 1], last);
    } else {
        for (i = end - dim; i >= start; i -= dim) last = insertNode(i, data[i], data[i + 1], last);
    }

    if (last && equals(last, last.next)) {
        removeNode(last);
        last = last.next;
    }

    return last;
}

// eliminate colinear or duplicate points
function filterPoints(start, end) {
    if (!start) return start;
    if (!end) end = start;

    var p = start,
        again;
    do {
        again = false;

        if (!p.steiner && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
            removeNode(p);
            p = end = p.prev;
            if (p === p.next) break;
            again = true;

        } else {
            p = p.next;
        }
    } while (again || p !== end);

    return end;
}

// main ear slicing loop which triangulates a polygon (given as a linked list)
function earcutLinked(ear, triangles, dim, minX, minY, invSize, pass) {
    if (!ear) return;

    // interlink polygon nodes in z-order
    if (!pass && invSize) indexCurve(ear, minX, minY, invSize);

    var stop = ear,
        prev, next;

    // iterate through ears, slicing them one by one
    while (ear.prev !== ear.next) {
        prev = ear.prev;
        next = ear.next;

        if (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear)) {
            // cut off the triangle
            triangles.push(prev.i / dim);
            triangles.push(ear.i / dim);
            triangles.push(next.i / dim);

            removeNode(ear);

            // skipping the next vertice leads to less sliver triangles
            ear = next.next;
            stop = next.next;

            continue;
        }

        ear = next;

        // if we looped through the whole remaining polygon and can't find any more ears
        if (ear === stop) {
            // try filtering points and slicing again
            if (!pass) {
                earcutLinked(filterPoints(ear), triangles, dim, minX, minY, invSize, 1);

            // if this didn't work, try curing all small self-intersections locally
            } else if (pass === 1) {
                ear = cureLocalIntersections(ear, triangles, dim);
                earcutLinked(ear, triangles, dim, minX, minY, invSize, 2);

            // as a last resort, try splitting the remaining polygon into two
            } else if (pass === 2) {
                splitEarcut(ear, triangles, dim, minX, minY, invSize);
            }

            break;
        }
    }
}

// check whether a polygon node forms a valid ear with adjacent nodes
function isEar(ear) {
    var a = ear.prev,
        b = ear,
        c = ear.next;

    if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

    // now make sure we don't have other points inside the potential ear
    var p = ear.next.next;

    while (p !== ear.prev) {
        if (pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
            area(p.prev, p, p.next) >= 0) return false;
        p = p.next;
    }

    return true;
}

function isEarHashed(ear, minX, minY, invSize) {
    var a = ear.prev,
        b = ear,
        c = ear.next;

    if (area(a, b, c) >= 0) return false; // reflex, can't be an ear

    // triangle bbox; min & max are calculated like this for speed
    var minTX = a.x < b.x ? (a.x < c.x ? a.x : c.x) : (b.x < c.x ? b.x : c.x),
        minTY = a.y < b.y ? (a.y < c.y ? a.y : c.y) : (b.y < c.y ? b.y : c.y),
        maxTX = a.x > b.x ? (a.x > c.x ? a.x : c.x) : (b.x > c.x ? b.x : c.x),
        maxTY = a.y > b.y ? (a.y > c.y ? a.y : c.y) : (b.y > c.y ? b.y : c.y);

    // z-order range for the current triangle bbox;
    var minZ = zOrder(minTX, minTY, minX, minY, invSize),
        maxZ = zOrder(maxTX, maxTY, minX, minY, invSize);

    var p = ear.prevZ,
        n = ear.nextZ;

    // look for points inside the triangle in both directions
    while (p && p.z >= minZ && n && n.z <= maxZ) {
        if (p !== ear.prev && p !== ear.next &&
            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
            area(p.prev, p, p.next) >= 0) return false;
        p = p.prevZ;

        if (n !== ear.prev && n !== ear.next &&
            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
            area(n.prev, n, n.next) >= 0) return false;
        n = n.nextZ;
    }

    // look for remaining points in decreasing z-order
    while (p && p.z >= minZ) {
        if (p !== ear.prev && p !== ear.next &&
            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, p.x, p.y) &&
            area(p.prev, p, p.next) >= 0) return false;
        p = p.prevZ;
    }

    // look for remaining points in increasing z-order
    while (n && n.z <= maxZ) {
        if (n !== ear.prev && n !== ear.next &&
            pointInTriangle(a.x, a.y, b.x, b.y, c.x, c.y, n.x, n.y) &&
            area(n.prev, n, n.next) >= 0) return false;
        n = n.nextZ;
    }

    return true;
}

// go through all polygon nodes and cure small local self-intersections
function cureLocalIntersections(start, triangles, dim) {
    var p = start;
    do {
        var a = p.prev,
            b = p.next.next;

        if (!equals(a, b) && intersects(a, p, p.next, b) && locallyInside(a, b) && locallyInside(b, a)) {

            triangles.push(a.i / dim);
            triangles.push(p.i / dim);
            triangles.push(b.i / dim);

            // remove two nodes involved
            removeNode(p);
            removeNode(p.next);

            p = start = b;
        }
        p = p.next;
    } while (p !== start);

    return p;
}

// try splitting polygon into two and triangulate them independently
function splitEarcut(start, triangles, dim, minX, minY, invSize) {
    // look for a valid diagonal that divides the polygon into two
    var a = start;
    do {
        var b = a.next.next;
        while (b !== a.prev) {
            if (a.i !== b.i && isValidDiagonal(a, b)) {
                // split the polygon in two by the diagonal
                var c = splitPolygon(a, b);

                // filter colinear points around the cuts
                a = filterPoints(a, a.next);
                c = filterPoints(c, c.next);

                // run earcut on each half
                earcutLinked(a, triangles, dim, minX, minY, invSize);
                earcutLinked(c, triangles, dim, minX, minY, invSize);
                return;
            }
            b = b.next;
        }
        a = a.next;
    } while (a !== start);
}

// link every hole into the outer loop, producing a single-ring polygon without holes
function eliminateHoles(data, holeIndices, outerNode, dim) {
    var queue = [],
        i, len, start, end, list;

    for (i = 0, len = holeIndices.length; i < len; i++) {
        start = holeIndices[i] * dim;
        end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
        list = linkedList(data, start, end, dim, false);
        if (list === list.next) list.steiner = true;
        queue.push(getLeftmost(list));
    }

    queue.sort(compareX);

    // process holes from left to right
    for (i = 0; i < queue.length; i++) {
        eliminateHole(queue[i], outerNode);
        outerNode = filterPoints(outerNode, outerNode.next);
    }

    return outerNode;
}

function compareX(a, b) {
    return a.x - b.x;
}

// find a bridge between vertices that connects hole with an outer ring and and link it
function eliminateHole(hole, outerNode) {
    outerNode = findHoleBridge(hole, outerNode);
    if (outerNode) {
        var b = splitPolygon(outerNode, hole);
        filterPoints(b, b.next);
    }
}

// David Eberly's algorithm for finding a bridge between hole and outer polygon
function findHoleBridge(hole, outerNode) {
    var p = outerNode,
        hx = hole.x,
        hy = hole.y,
        qx = -Infinity,
        m;

    // find a segment intersected by a ray from the hole's leftmost point to the left;
    // segment's endpoint with lesser x will be potential connection point
    do {
        if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
            var x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
            if (x <= hx && x > qx) {
                qx = x;
                if (x === hx) {
                    if (hy === p.y) return p;
                    if (hy === p.next.y) return p.next;
                }
                m = p.x < p.next.x ? p : p.next;
            }
        }
        p = p.next;
    } while (p !== outerNode);

    if (!m) return null;

    if (hx === qx) return m.prev; // hole touches outer segment; pick lower endpoint

    // look for points inside the triangle of hole point, segment intersection and endpoint;
    // if there are no points found, we have a valid connection;
    // otherwise choose the point of the minimum angle with the ray as connection point

    var stop = m,
        mx = m.x,
        my = m.y,
        tanMin = Infinity,
        tan;

    p = m.next;

    while (p !== stop) {
        if (hx >= p.x && p.x >= mx && hx !== p.x &&
                pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {

            tan = Math.abs(hy - p.y) / (hx - p.x); // tangential

            if ((tan < tanMin || (tan === tanMin && p.x > m.x)) && locallyInside(p, hole)) {
                m = p;
                tanMin = tan;
            }
        }

        p = p.next;
    }

    return m;
}

// interlink polygon nodes in z-order
function indexCurve(start, minX, minY, invSize) {
    var p = start;
    do {
        if (p.z === null) p.z = zOrder(p.x, p.y, minX, minY, invSize);
        p.prevZ = p.prev;
        p.nextZ = p.next;
        p = p.next;
    } while (p !== start);

    p.prevZ.nextZ = null;
    p.prevZ = null;

    sortLinked(p);
}

// Simon Tatham's linked list merge sort algorithm
// http://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html
function sortLinked(list) {
    var i, p, q, e, tail, numMerges, pSize, qSize,
        inSize = 1;

    do {
        p = list;
        list = null;
        tail = null;
        numMerges = 0;

        while (p) {
            numMerges++;
            q = p;
            pSize = 0;
            for (i = 0; i < inSize; i++) {
                pSize++;
                q = q.nextZ;
                if (!q) break;
            }
            qSize = inSize;

            while (pSize > 0 || (qSize > 0 && q)) {

                if (pSize !== 0 && (qSize === 0 || !q || p.z <= q.z)) {
                    e = p;
                    p = p.nextZ;
                    pSize--;
                } else {
                    e = q;
                    q = q.nextZ;
                    qSize--;
                }

                if (tail) tail.nextZ = e;
                else list = e;

                e.prevZ = tail;
                tail = e;
            }

            p = q;
        }

        tail.nextZ = null;
        inSize *= 2;

    } while (numMerges > 1);

    return list;
}

// z-order of a point given coords and inverse of the longer side of data bbox
function zOrder(x, y, minX, minY, invSize) {
    // coords are transformed into non-negative 15-bit integer range
    x = 32767 * (x - minX) * invSize;
    y = 32767 * (y - minY) * invSize;

    x = (x | (x << 8)) & 0x00FF00FF;
    x = (x | (x << 4)) & 0x0F0F0F0F;
    x = (x | (x << 2)) & 0x33333333;
    x = (x | (x << 1)) & 0x55555555;

    y = (y | (y << 8)) & 0x00FF00FF;
    y = (y | (y << 4)) & 0x0F0F0F0F;
    y = (y | (y << 2)) & 0x33333333;
    y = (y | (y << 1)) & 0x55555555;

    return x | (y << 1);
}

// find the leftmost node of a polygon ring
function getLeftmost(start) {
    var p = start,
        leftmost = start;
    do {
        if (p.x < leftmost.x) leftmost = p;
        p = p.next;
    } while (p !== start);

    return leftmost;
}

// check if a point lies within a convex triangle
function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
    return (cx - px) * (ay - py) - (ax - px) * (cy - py) >= 0 &&
           (ax - px) * (by - py) - (bx - px) * (ay - py) >= 0 &&
           (bx - px) * (cy - py) - (cx - px) * (by - py) >= 0;
}

// check if a diagonal between two polygon nodes is valid (lies in polygon interior)
function isValidDiagonal(a, b) {
    return a.next.i !== b.i && a.prev.i !== b.i && !intersectsPolygon(a, b) &&
           locallyInside(a, b) && locallyInside(b, a) && middleInside(a, b);
}

// signed area of a triangle
function area(p, q, r) {
    return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
}

// check if two points are equal
function equals(p1, p2) {
    return p1.x === p2.x && p1.y === p2.y;
}

// check if two segments intersect
function intersects(p1, q1, p2, q2) {
    if ((equals(p1, q1) && equals(p2, q2)) ||
        (equals(p1, q2) && equals(p2, q1))) return true;
    return area(p1, q1, p2) > 0 !== area(p1, q1, q2) > 0 &&
           area(p2, q2, p1) > 0 !== area(p2, q2, q1) > 0;
}

// check if a polygon diagonal intersects any polygon segments
function intersectsPolygon(a, b) {
    var p = a;
    do {
        if (p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i &&
                intersects(p, p.next, a, b)) return true;
        p = p.next;
    } while (p !== a);

    return false;
}

// check if a polygon diagonal is locally inside the polygon
function locallyInside(a, b) {
    return area(a.prev, a, a.next) < 0 ?
        area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 :
        area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
}

// check if the middle point of a polygon diagonal is inside the polygon
function middleInside(a, b) {
    var p = a,
        inside = false,
        px = (a.x + b.x) / 2,
        py = (a.y + b.y) / 2;
    do {
        if (((p.y > py) !== (p.next.y > py)) && p.next.y !== p.y &&
                (px < (p.next.x - p.x) * (py - p.y) / (p.next.y - p.y) + p.x))
            inside = !inside;
        p = p.next;
    } while (p !== a);

    return inside;
}

// link two polygon vertices with a bridge; if the vertices belong to the same ring, it splits polygon into two;
// if one belongs to the outer ring and another to a hole, it merges it into a single ring
function splitPolygon(a, b) {
    var a2 = new Node(a.i, a.x, a.y),
        b2 = new Node(b.i, b.x, b.y),
        an = a.next,
        bp = b.prev;

    a.next = b;
    b.prev = a;

    a2.next = an;
    an.prev = a2;

    b2.next = a2;
    a2.prev = b2;

    bp.next = b2;
    b2.prev = bp;

    return b2;
}

// create a node and optionally link it with previous one (in a circular doubly linked list)
function insertNode(i, x, y, last) {
    var p = new Node(i, x, y);

    if (!last) {
        p.prev = p;
        p.next = p;

    } else {
        p.next = last.next;
        p.prev = last;
        last.next.prev = p;
        last.next = p;
    }
    return p;
}

function removeNode(p) {
    p.next.prev = p.prev;
    p.prev.next = p.next;

    if (p.prevZ) p.prevZ.nextZ = p.nextZ;
    if (p.nextZ) p.nextZ.prevZ = p.prevZ;
}

function Node(i, x, y) {
    // vertice index in coordinates array
    this.i = i;

    // vertex coordinates
    this.x = x;
    this.y = y;

    // previous and next vertice nodes in a polygon ring
    this.prev = null;
    this.next = null;

    // z-order curve value
    this.z = null;

    // previous and next nodes in z-order
    this.prevZ = null;
    this.nextZ = null;

    // indicates whether this is a steiner point
    this.steiner = false;
}

// return a percentage difference between the polygon area and its triangulation area;
// used to verify correctness of triangulation
earcut.deviation = function (data, holeIndices, dim, triangles) {
    var hasHoles = holeIndices && holeIndices.length;
    var outerLen = hasHoles ? holeIndices[0] * dim : data.length;

    var polygonArea = Math.abs(signedArea(data, 0, outerLen, dim));
    if (hasHoles) {
        for (var i = 0, len = holeIndices.length; i < len; i++) {
            var start = holeIndices[i] * dim;
            var end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
            polygonArea -= Math.abs(signedArea(data, start, end, dim));
        }
    }

    var trianglesArea = 0;
    for (i = 0; i < triangles.length; i += 3) {
        var a = triangles[i] * dim;
        var b = triangles[i + 1] * dim;
        var c = triangles[i + 2] * dim;
        trianglesArea += Math.abs(
            (data[a] - data[c]) * (data[b + 1] - data[a + 1]) -
            (data[a] - data[b]) * (data[c + 1] - data[a + 1]));
    }

    return polygonArea === 0 && trianglesArea === 0 ? 0 :
        Math.abs((trianglesArea - polygonArea) / polygonArea);
};

function signedArea(data, start, end, dim) {
    var sum = 0;
    for (var i = start, j = end - dim; i < end; i += dim) {
        sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
        j = i;
    }
    return sum;
}

// turn a polygon in a multi-dimensional array form (e.g. as in GeoJSON) into a form Earcut accepts
earcut.flatten = function (data) {
    var dim = data[0][0].length,
        result = {vertices: [], holes: [], dimensions: dim},
        holeIndex = 0;

    for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data[i].length; j++) {
            for (var d = 0; d < dim; d++) result.vertices.push(data[i][j][d]);
        }
        if (i > 0) {
            holeIndex += data[i - 1].length;
            result.holes.push(holeIndex);
        }
    }
    return result;
};


/***/ }),

/***/ "./src/chaining.js":
/*!*************************!*\
  !*** ./src/chaining.js ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* eslint-disable no-undef */
(function chain (root, factory) {
  const i2d = root
  if ( true && module.exports) {
    module.exports = factory(__webpack_require__(/*! ./easing.js */ "./src/easing.js"), __webpack_require__(/*! ./queue.js */ "./src/queue.js"))
  } else if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! ./easing.js */ "./src/easing.js"), __webpack_require__(/*! ./queue.js */ "./src/queue.js")], __WEBPACK_AMD_DEFINE_RESULT__ = ((easing, queue) => factory(easing, queue)).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
  } else {}
}(this, (easing, queue) => {
  'use strict'
  let Id = 0
  let chainId = 0

  function generateRendererId () {
    Id += 1
    return Id
  }

  function generateChainId () {
    chainId += 1
    return chainId
  }

  const easying = easing()

  function ease (type) {
    this.easying = easying(type)
    this.transition = type
    return this
  }
  function duration (value) {
    if (arguments.length !== 1) { throw new Error('arguments mis match') }
    this.durationP = value
    return this
  }
  function loopValue (value) {
    if (arguments.length !== 1) { throw new Error('arguments mis match') }
    this.loopValue = value
    return this
  }
  function direction (value) {
    if (arguments.length !== 1) { throw new Error('arguments mis match') }
    this.directionV = value
    return this
  }

  function bind (value) {
    if (arguments.length !== 1) { throw new Error('arguments mis match') }
    this.data = value

    if (this.data.nodeName === 'CANVAS') { this.canvasStack = [] }

    return this
  }
  function callbckExe (exe) {
    if (typeof exe !== 'function') { return null }
    this.callbckExe = exe
    return this
  }
  function reset (value) {
    this.resetV = value
    return this
  }
  function child (exe) {
    this.end = exe
    return this
  }

  function end (exe) {
    this.endExe = exe
    return this
  }

  function commit () {
    this.start()
  }

  function SequenceGroup () {
    this.queue = queue()
    this.sequenceQueue = []
    this.lengthV = 0
    this.currPos = 0
    this.ID = generateRendererId()
    this.loopCounter = 0
  }

  SequenceGroup.prototype = {
    duration,
    loop: loopValue,
    callbck: callbckExe,
    bind,
    child,
    ease,
    end,
    commit,
    reset,
    direction
  }

  SequenceGroup.prototype.add = function SGadd (value) {
    const self = this

    if (!Array.isArray(value) && typeof value !== 'function') {
      value = [value]
    }
    if (Array.isArray(value)) {
      value.map((d) => {
        self.lengthV += (d.length ? d.length : 0)
        return d
      })
    }
    this.sequenceQueue = this.sequenceQueue.concat(value)

    return this
  }

  SequenceGroup.prototype.easyingGlobal = function SGeasyingGlobal (completedTime, durationV) {
    return completedTime / durationV
  }

  SequenceGroup.prototype.start = function SGstart () {
    const self = this
    if (self.directionV === 'alternate') {
      self.factor = self.factor ? -1 * self.factor : 1
      self.currPos = self.factor < 0 ? this.sequenceQueue.length - 1 : 0
    } else if (self.directionV === 'reverse') {
      for (let i = 0; i < this.sequenceQueue.length; i += 1) {
        const currObj = this.sequenceQueue[i]
        if (!(currObj instanceof SequenceGroup) && !(currObj instanceof ParallelGroup)) {
          currObj.run(1)
        }
        self.currPos = i
      }
      self.factor = -1
    } else {
      self.currPos = 0
      self.factor = 1
    }
    this.execute()
  }

  SequenceGroup.prototype.execute = function SGexecute () {
    const self = this
    let currObj = this.sequenceQueue[self.currPos]

    currObj = (typeof currObj === 'function' ? currObj() : currObj)

    if (!currObj) { return }
    if (currObj instanceof SequenceGroup || currObj instanceof ParallelGroup) {
      // currObj.duration(currObj.durationP ? currObj.durationP
      //   : (currObj.length / self.lengthV) * self.durationP)
      currObj.end(self.triggerEnd.bind(self, currObj)).commit()
    } else {
      // const tValue = currObj.duration
      // const data_ = currObj.data ? currObj.data : self.data
      // console.log(currObj)
      this.currObj = currObj
      // currObj.durationP = tValue
      this.queue.add(generateChainId(), {
        run (f) {
          currObj.run(f)
        },
        delay: currObj.delay !== undefined ? currObj.delay : 0,
        duration: currObj.duration !== undefined ? currObj.duration : self.durationP,
        loop: currObj.loop ? currObj.loop : 1,
        direction: self.factor < 0 ? 'reverse' : 'default', // self.factor < 0 ? 'reverse' : 'default',
        end: self.triggerEnd.bind(self, currObj)
      }, (c, v) =>
        c / v)
    }
    return this
  }

  SequenceGroup.prototype.triggerEnd = function SGtriggerEnd (currObj) {
    const self = this
    self.currPos += self.factor
    if (currObj.end) {
      self.triggerChild(currObj)
    }
    if (self.sequenceQueue.length === self.currPos || self.currPos < 0) {
      if (self.endExe) { self.endExe() }
      // if (self.end) { self.triggerChild(self) }

      self.loopCounter += 1
      if (self.loopCounter < self.loopValue) {
        self.start()
      }
      return
    }

    this.execute()
  }

  SequenceGroup.prototype.triggerChild = function SGtriggerChild (currObj) {
    if (currObj.end instanceof ParallelGroup || currObj.end instanceof SequenceGroup) {
      setTimeout(() => {
        currObj.end.commit()
      }, 0)
    } else {
      currObj.end()
      // setTimeout(() => {
      //   currObj.childExe.start()
      // }, 0)
    }
  }

  function ParallelGroup () {
    this.queue = queue()
    this.group = []
    this.currPos = 0
    // this.lengthV = 0
    this.ID = generateRendererId()
    this.loopCounter = 1
    // this.transition = 'linear'
  }

  ParallelGroup.prototype = {
    duration,
    loop: loopValue,
    callbck: callbckExe,
    bind,
    child,
    ease,
    end,
    commit,
    direction
  }

  ParallelGroup.prototype.add = function PGadd (value) {
    const self = this

    if (!Array.isArray(value)) { value = [value] }

    this.group = this.group.concat(value)
    this.group.forEach((d) => {
      d.durationP = d.durationP ? d.durationP : self.durationP
    })

    return this
  }

  ParallelGroup.prototype.execute = function PGexecute () {
    const self = this

    self.currPos = 0
    for (let i = 0, len = self.group.length; i < len; i++) {
      let currObj = self.group[i]
      if (currObj instanceof SequenceGroup || currObj instanceof ParallelGroup) {
        currObj
          // .duration(currObj.durationP ? currObj.durationP : self.durationP)
          .end(self.triggerEnd.bind(self, currObj)).commit()
      } else {
        self.queue.add(generateChainId(), {
          run (f) {
            currObj.run(f)
          },
          delay: currObj.delay !== undefined ? currObj.delay : 0,
          duration: currObj.duration !== undefined ? currObj.duration : self.durationP,
          loop: currObj.loop ? currObj.loop : 1,
          direction: currObj.direction ? currObj.direction : 'default', // self.factor < 0 ? 'reverse' : 'default',
          end: self.triggerEnd.bind(self, currObj)
        }, currObj.ease ? easying(currObj.ease) : self.easying)
      }
    }
    return self
  }

  ParallelGroup.prototype.start = function PGstart () {
    const self = this
    if (self.directionV === 'alternate') {
      self.factor = self.factor ? -1 * self.factor : 1
    } else if (self.directionV === 'reverse') {
      self.factor = -1
    } else {
      self.factor = 1
    }

    this.execute()
  }

  ParallelGroup.prototype.triggerEnd = function PGtriggerEnd (currObj) {
    const self = this
    // Call child transition wen Entire parallelChain transition completes
    this.currPos += 1

    if (currObj.end) {
      this.triggerChild(currObj.end)
    }
    if (this.currPos === this.group.length) {
      // Call child transition wen Entire parallelChain transition completes
      if (this.endExe) { this.triggerChild(this.endExe) }
      // if (this.end) { this.triggerChild(this.end) }

      self.loopCounter += 1
      if (self.loopCounter < self.loopValue) {
        self.start()
      }
    }
  }

  ParallelGroup.prototype.triggerChild = function PGtriggerChild (exe) {
    if (exe instanceof ParallelGroup || exe instanceof SequenceGroup) {
      exe.commit()
    } else if (typeof exe === 'function') {
      exe()
    } else {
      console.log('wrong type')
    }
  }

  const chain = {}

  chain.sequenceChain = function sequenceChain () {
    return new SequenceGroup()
  }
  chain.parallelChain = function parallelChain () {
    return new ParallelGroup()
  }

  return chain
}))


/***/ }),

/***/ "./src/colorMap.js":
/*!*************************!*\
  !*** ./src/colorMap.js ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* eslint-disable no-undef */
;(function colorMap (root, factory) {
  const i2d = root
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (() => factory()).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
  } else {}
}(this, () => {
  'use strict'
  const preDefinedColors = ['AliceBlue', 'AntiqueWhite', 'Aqua', 'Aquamarine', 'Azure', 'Beige', 'Bisque', 'Black', 'BlanchedAlmond', 'Blue', 'BlueViolet', 'Brown', 'BurlyWood', 'CadetBlue', 'Chartreuse', 'Chocolate', 'Coral', 'CornflowerBlue', 'Cornsilk', 'Crimson', 'Cyan', 'DarkBlue', 'DarkCyan', 'DarkGoldenRod', 'DarkGray', 'DarkGrey', 'DarkGreen', 'DarkKhaki', 'DarkMagenta', 'DarkOliveGreen', 'DarkOrange', 'DarkOrchid', 'DarkRed', 'DarkSalmon', 'DarkSeaGreen', 'DarkSlateBlue', 'DarkSlateGray', 'DarkSlateGrey', 'DarkTurquoise', 'DarkViolet', 'DeepPink', 'DeepSkyBlue', 'DimGray', 'DimGrey', 'DodgerBlue', 'FireBrick', 'FloralWhite', 'ForestGreen', 'Fuchsia', 'Gainsboro', 'GhostWhite', 'Gold', 'GoldenRod', 'Gray', 'Grey', 'Green', 'GreenYellow', 'HoneyDew', 'HotPink', 'IndianRed', 'Indigo', 'Ivory', 'Khaki', 'Lavender', 'LavenderBlush', 'LawnGreen', 'LemonChiffon', 'LightBlue', 'LightCoral', 'LightCyan', 'LightGoldenRodYellow', 'LightGray', 'LightGrey', 'LightGreen', 'LightPink', 'LightSalmon', 'LightSeaGreen', 'LightSkyBlue', 'LightSlateGray', 'LightSlateGrey', 'LightSteelBlue', 'LightYellow', 'Lime', 'LimeGreen', 'Linen', 'Magenta', 'Maroon', 'MediumAquaMarine', 'MediumBlue', 'MediumOrchid', 'MediumPurple', 'MediumSeaGreen', 'MediumSlateBlue', 'MediumSpringGreen', 'MediumTurquoise', 'MediumVioletRed', 'MidnightBlue', 'MintCream', 'MistyRose', 'Moccasin', 'NavajoWhite', 'Navy', 'OldLace', 'Olive', 'OliveDrab', 'Orange', 'OrangeRed', 'Orchid', 'PaleGoldenRod', 'PaleGreen', 'PaleTurquoise', 'PaleVioletRed', 'PapayaWhip', 'PeachPuff', 'Peru', 'Pink', 'Plum', 'PowderBlue', 'Purple', 'RebeccaPurple', 'Red', 'RosyBrown', 'RoyalBlue', 'SaddleBrown', 'Salmon', 'SandyBrown', 'SeaGreen', 'SeaShell', 'Sienna', 'Silver', 'SkyBlue', 'SlateBlue', 'SlateGray', 'SlateGrey', 'Snow', 'SpringGreen', 'SteelBlue', 'Tan', 'Teal', 'Thistle', 'Tomato', 'Turquoise', 'Violet', 'Wheat', 'White', 'WhiteSmoke', 'Yellow', 'YellowGreen']

  const preDefinedColorHex = ['f0f8ff', 'faebd7', '00ffff', '7fffd4', 'f0ffff', 'f5f5dc', 'ffe4c4', '000000', 'ffebcd', '0000ff', '8a2be2', 'a52a2a', 'deb887', '5f9ea0', '7fff00', 'd2691e', 'ff7f50', '6495ed', 'fff8dc', 'dc143c', '00ffff', '00008b', '008b8b', 'b8860b', 'a9a9a9', 'a9a9a9', '006400', 'bdb76b', '8b008b', '556b2f', 'ff8c00', '9932cc', '8b0000', 'e9967a', '8fbc8f', '483d8b', '2f4f4f', '2f4f4f', '00ced1', '9400d3', 'ff1493', '00bfff', '696969', '696969', '1e90ff', 'b22222', 'fffaf0', '228b22', 'ff00ff', 'dcdcdc', 'f8f8ff', 'ffd700', 'daa520', '808080', '808080', '008000', 'adff2f', 'f0fff0', 'ff69b4', 'cd5c5c', '4b0082', 'fffff0', 'f0e68c', 'e6e6fa', 'fff0f5', '7cfc00', 'fffacd', 'add8e6', 'f08080', 'e0ffff', 'fafad2', 'd3d3d3', 'd3d3d3', '90ee90', 'ffb6c1', 'ffa07a', '20b2aa', '87cefa', '778899', '778899', 'b0c4de', 'ffffe0', '00ff00', '32cd32', 'faf0e6', 'ff00ff', '800000', '66cdaa', '0000cd', 'ba55d3', '9370db', '3cb371', '7b68ee', '00fa9a', '48d1cc', 'c71585', '191970', 'f5fffa', 'ffe4e1', 'ffe4b5', 'ffdead', '000080', 'fdf5e6', '808000', '6b8e23', 'ffa500', 'ff4500', 'da70d6', 'eee8aa', '98fb98', 'afeeee', 'db7093', 'ffefd5', 'ffdab9', 'cd853f', 'ffc0cb', 'dda0dd', 'b0e0e6', '800080', '663399', 'ff0000', 'bc8f8f', '4169e1', '8b4513', 'fa8072', 'f4a460', '2e8b57', 'fff5ee', 'a0522d', 'c0c0c0', '87ceeb', '6a5acd', '708090', '708090', 'fffafa', '00ff7f', '4682b4', 'd2b48c', '008080', 'd8bfd8', 'ff6347', '40e0d0', 'ee82ee', 'f5deb3', 'ffffff', 'f5f5f5', 'ffff00', '9acd32']

  const colorMap = {}
  const round = Math.round
  var defaultColor = 'rgba(0,0,0,0)'

  for (let i = 0; i < preDefinedColors.length; i += 1) {
    colorMap[preDefinedColors[i]] = preDefinedColorHex[i]
  }

  function RGBA (r, g, b, a) {
    this.r = r
    this.g = g
    this.b = b
    this.a = (a === undefined ? 255 : a)
    this.rgba = `rgb(${r},${g},${b},${a})`
  }

  function nameToHex (name) {
    return colorMap[name] ? `#${colorMap[name]}` : '#000'
  }

  function hexToRgb (hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b)
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)

    return new RGBA(parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16), 255)
  }

  function rgbToHex (rgb) {
    const rgbComponents = rgb.substring(rgb.lastIndexOf('(') + 1, rgb.lastIndexOf(')')).split(',')
    const r = parseInt(rgbComponents[0], 10)
    const g = parseInt(rgbComponents[1], 10)
    const b = parseInt(rgbComponents[2], 10)

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
  }

  function rgbParse (rgb) {
    const res = rgb.replace(/[^0-9.,]+/g, '').split(',')
    const obj = {}
    const flags = ['r', 'g', 'b', 'a']
    for (let i = 0; i < res.length; i += 1) {
      obj[flags[i]] = parseFloat(res[i])
    }
    return new RGBA(obj.r, obj.g, obj.b, obj.a)
  }

  function hslParse (hsl) {
    var r
    var g
    var b
    var a
    var h
    var s
    var l
    var obj = {}
    const res = hsl.replace(/[^0-9.,]+/g, '').split(',').map(function (d) { return parseFloat(d) })
    h = res[0] / 360
    s = res[1] / 100
    l = res[2] / 100
    a = res[3]
    if (s === 0) {
      r = g = b = l
    } else {
      var hue2rgb = function hue2rgb (p, q, t) {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s
      var p = 2 * l - q
      r = hue2rgb(p, q, h + 1 / 3) * 255
      g = hue2rgb(p, q, h) * 255
      b = hue2rgb(p, q, h - 1 / 3) * 255
    }
    if (a !== undefined) obj.a = a
    return new RGBA(r, g, b, a)
  }

  function colorToRGB (val) {
    return val instanceof RGBA ? val : val.startsWith('#') ? hexToRgb(val)
      : val.startsWith('rgb') ? rgbParse(val)
        : val.startsWith('hsl') ? hslParse(val) : { r: 0, g: 0, b: 0, a: 255 }
  }

  function colorTransition (src, dest) {
    src = src || defaultColor
    dest = dest || defaultColor

    src = colorToRGB(src)
    dest = colorToRGB(dest)
    return function trans (f) {
      return `rgb(${Math.round(src.r + (dest.r - src.r) * f)},${Math.round(src.g + (dest.g - src.g) * f)},${Math.round(src.b + (dest.b - src.b) * f)})`
    }
  }

  function colorRGBtransition (src, dest) {
    src = src || defaultColor
    dest = dest || defaultColor

    src = colorToRGB(src)
    dest = colorToRGB(dest)
    return function trans (f) {
      return new RGBA(round(src.r + (dest.r - src.r) * f), round(src.g + (dest.g - src.g) * f), round(src.b + (dest.b - src.b) * f), round(src.a + (dest.a - src.a) * f))
    }
  }

  function rgbaInstance (r, g, b, a) {
    return new RGBA(r, g, b, a)
  }

  function isTypeColor (value) {
    return value instanceof RGBA || value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')
  }

  const colorMapper = {
    nameToHex: nameToHex,
    hexToRgb: hexToRgb,
    rgbToHex: rgbToHex,
    hslToRgb: hslParse,
    transition: colorTransition,
    transitionObj: colorRGBtransition,
    colorToRGB: colorToRGB,
    rgba: rgbaInstance,
    isTypeColor: isTypeColor
  }

  return colorMapper
}))


/***/ }),

/***/ "./src/easing.js":
/*!***********************!*\
  !*** ./src/easing.js ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* eslint-disable no-undef */
(function easing (root, factory) {
  const i2d = root
  if ( true && module.exports) {
    module.exports = factory(__webpack_require__(/*! ./geometry.js */ "./src/geometry.js"))
  } else if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! ./geometry.js */ "./src/geometry.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (geometry => factory(geometry)).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
  } else {}
}(this, (geometry) => {
  'use strict'
  const t2DGeometry = geometry('2D')

  function linear (starttime, duration) {
    return (starttime / duration)
  }
  function elastic (starttime, duration) {
    const decay = 8
    const force = 2 / 1000
    const t = starttime / duration

    return (1 - (1 - t) * Math.sin(t * duration * force * Math.PI * 2 + (Math.PI / 2)) /
    Math.exp(t * decay))
  }
  function bounce (starttime, duration) {
    const decay = 10
    const t = starttime / duration
    const force = t / 100

    return (1 - (1 - t) * Math.abs(Math.sin(t * duration * force * Math.PI * 2 + (Math.PI / 2))) /
    Math.exp(t * decay))
  }
  function easeInQuad (starttime, duration) {
    const t = starttime / duration
    return t * t
  }
  function easeOutQuad (starttime, duration) {
    const t = starttime / duration
    return t * (2 - t)
  }
  function easeInOutQuad (starttime, duration) {
    const t = starttime / duration
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }
  function easeInCubic (starttime, duration) {
    const t = starttime / duration
    return t2DGeometry.pow(t, 3)
  }
  function easeOutCubic (starttime, duration) {
    let t = starttime / duration
    t -= 1
    return t * t * t + 1
  }
  function easeInOutCubic (starttime, duration) {
    const t = starttime / duration
    return t < 0.5 ? 4 * t2DGeometry.pow(t, 3) : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
  }
  function sinIn (starttime, duration) {
    const t = starttime / duration
    return 1 - Math.cos(t * Math.PI / 2)
  }
  function easeOutSin (starttime, duration) {
    const t = starttime / duration
    return Math.cos(t * Math.PI / 2)
  }
  function easeInOutSin (starttime, duration) {
    const t = starttime / duration
    return (1 - Math.cos(Math.PI * t)) / 2
  }
  // function easeInQuart (starttime, duration) {
  //   const t = starttime / duration
  //   return t2DGeometry.pow(t, 4)
  // }
  // function easeOutQuart (starttime, duration) {
  //   let t = starttime / duration
  //   t -= 1
  //   return 1 - t * t2DGeometry.pow(t, 3)
  // }
  // function easeInOutQuart (starttime, duration) {
  //   let t = starttime / duration
  //   t -= 1
  //   return t < 0.5 ? 8 * t2DGeometry.pow(t, 4) : 1 - 8 * t * t2DGeometry.pow(t, 3)
  // }

  function easing () {
    function fetchTransitionType (_) {
      let res
      if (typeof _ === 'function') {
        return function custExe (starttime, duration) {
          return _(starttime / duration)
        }
      }
      switch (_) {
        case 'easeOutQuad':
          res = easeOutQuad
          break
        case 'easeInQuad':
          res = easeInQuad
          break
        case 'easeInOutQuad':
          res = easeInOutQuad
          break
        case 'easeInCubic':
          res = easeInCubic
          break
        case 'easeOutCubic':
          res = easeOutCubic
          break
        case 'easeInOutCubic':
          res = easeInOutCubic
          break
        case 'easeInSin':
          res = sinIn
          break
        case 'easeOutSin':
          res = easeOutSin
          break
        case 'easeInOutSin':
          res = easeInOutSin
          break
        case 'bounce':
          res = bounce
          break
        case 'linear':
          res = linear
          break
        case 'elastic':
          res = elastic
          break
        default:
          res = linear
      }
      return res
    }

    return fetchTransitionType
  }

  return easing
}))


/***/ }),

/***/ "./src/geometry.js":
/*!*************************!*\
  !*** ./src/geometry.js ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;/* eslint-disable no-undef */
;(function (root, factory) {
  if ( true && module.exports) {
    module.exports = factory()
  } else if (true) {
    !(__WEBPACK_AMD_DEFINE_RESULT__ = (() => factory()).call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
  } else {}
}(this, () => {
  'use strict'
  function geometry (context) {
    // function cos (a) {
    //   return Math.cos(a)
    // }

    // function acos (a) {
    //   return Math.acos(a)
    // }

    // function sin (a) {
    //   return Math.sin(a)
    // }

    function pw (a, x) {
      let val = 1
      if (x === 0) return val
      for (let i = 1; i <= x; i += 1) { val *= a }
      return val
    }

    // function tan (a) {
    //   return Math.tan(a)
    // }

    function atan2 (a, b) {
      return Math.atan2(a, b)
    }

    function sqrt (a) {
      return Math.sqrt(a)
    }
    // function angleToRadian (_) {
    //   if (isNaN(_)) { throw new Error('NaN') }
    //   return (Math.PI / 180) * _
    // }
    // function radianToAngle (_) {
    //   if (isNaN(_)) { throw new Error('NaN') }
    //   return (180 / Math.PI) * _
    // }
    // function getAngularDistance (r1, r2) {
    //   if (isNaN(r1 - r2)) { throw new Error('NaN') }
    //   return r1 - r2
    // }
    function bezierLength (p0, p1, p2) {
      const a = {}
      const b = {}

      a.x = p0.x + p2.x - 2 * p1.x
      a.y = p0.y + p2.y - 2 * p1.y
      b.x = 2 * p1.x - 2 * p0.x
      b.y = 2 * p1.y - 2 * p0.y

      const A = 4 * (a.x * a.x + a.y * a.y)
      const B = 4 * (a.x * b.x + a.y * b.y)
      const C = (b.x * b.x + b.y * b.y)

      const Sabc = 2 * Math.sqrt(A + B + C)
      const A_2 = Math.sqrt(A)
      const A_32 = 2 * A * A_2
      const C_2 = 2 * Math.sqrt(C)
      const BA = B / A_2
      let logVal = (2 * A_2 + BA + Sabc) / (BA + C_2)
      logVal = (isNaN(logVal) || Math.abs(logVal) === Infinity) ? 1 : logVal

      return (A_32 * Sabc + A_2 * B * (Sabc - C_2) + (4 * C * A - B * B) * Math.log(logVal)) / (4 * A_32)
    }

    // function bezierLengthOld (p0, p1, p2) {
    //   const interval = 0.001
    //   let sum = 0
    //   const bezierTransitionInstance = bezierTransition.bind(null, p0, p1, p2)
    //   // let p1
    //   // let p2
    //   for (let i = 0; i <= 1 - interval; i += interval) {
    //     p1 = bezierTransitionInstance(i)
    //     p2 = bezierTransitionInstance(i + interval)
    //     sum += sqrt(pw((p2.x - p1.x) / interval, 2) + (pw((p2.y - p1.y) / interval, 2))) * interval
    //   }
    //   return sum
    // }
    function cubicBezierLength (p0, co) {
      const interval = 0.001
      let sum = 0

      const cubicBezierTransitionInstance = cubicBezierTransition.bind(null, p0, co)
      let p1
      let p2
      for (let i = 0; i <= 1; i += interval) {
        p1 = cubicBezierTransitionInstance(i)
        p2 = cubicBezierTransitionInstance(i + interval)
        sum += sqrt(pw((p2.x - p1.x) / interval, 2) + (pw((p2.y - p1.y) / interval, 2))) * interval
      }
      return sum
    }
    function getDistance (p1, p2) {
      let cPw = 0
      for (const p in p1) {
        cPw += pw(p2[p] - p1[p], 2)
      }
      if (isNaN(cPw)) {
        throw new Error('error')
      }
      return sqrt(cPw)
    }

    function get2DAngle (p1, p2) {
      return atan2(p2.x - p1.x, p2.y - p1.y)
    }
    // function get3DAngle (p1, p2) {
    //   return acos((p1.x * p2.x + p1.y * p2.y + p1.z * p2.z) / (sqrt(p1.x * p1.x + p1.y * p1.y + p1.z * p1.z) * sqrt(p2.x * p2.x + p2.y * p2.y + p2.z * p2.z)))
    // }
    function scaleAlongOrigin (co, factor) {
      const co_ = {}
      for (const prop in co) {
        co_[prop] = co[prop] * factor
      }
      return co_
    }
    function scaleAlongPoint (p, r, f) {
      const s = (p.y - r.y) / (p.x - r.x)
      const xX = p.x * f
      const yY = (s * (xX - r.x) + r.y) * f

      return {
        x: xX,
        y: yY
      }
    }

    function cubicBezierCoefficients (p) {
      const cx = 3 * (p.cntrl1.x - p.p0.x)
      const bx = 3 * (p.cntrl2.x - p.cntrl1.x) - cx
      const ax = p.p1.x - p.p0.x - cx - bx
      const cy = 3 * (p.cntrl1.y - p.p0.y)
      const by = 3 * (p.cntrl2.y - p.cntrl1.y) - cy
      const ay = p.p1.y - p.p0.y - cy - by

      return {
        cx,
        bx,
        ax,
        cy,
        by,
        ay
      }
    }
    function toCubicCurves (stack) {
      if (!stack.length) { return }
      const _ = stack
      const mappedArr = []
      for (let i = 0; i < _.length; i += 1) {
        if (['M', 'C', 'S', 'Q'].indexOf(_[i].type) !== -1) {
          mappedArr.push(_[i])
        } else if (['V', 'H', 'L', 'Z'].indexOf(_[i].type) !== -1) {
          const ctrl1 = {
            x: (_[i].p0.x + _[i].p1.x) / 2,
            y: (_[i].p0.y + _[i].p1.y) / 2
          }
          mappedArr.push({
            p0: _[i].p0,
            cntrl1: ctrl1,
            cntrl2: ctrl1,
            p1: _[i].p1,
            type: 'C',
            length: _[i].length
          })
        } else {
          console.log('wrong cmd type')
        }
      }
      return mappedArr
    }

    function cubicBezierTransition (p0, co, f) {
      const p3 = pw(f, 3)
      const p2 = pw(f, 2)
      return {
        x: co.ax * p3 + co.bx * p2 + co.cx * f + p0.x,
        y: co.ay * p3 + co.by * p2 + co.cy * f + p0.y
      }
    }
    function bezierTransition (p0, p1, p2, f) {
      return {
        x: (p0.x - 2 * p1.x + p2.x) * f * f + (2 * p1.x - 2 * p0.x) * f + p0.x,
        y: (p0.y - 2 * p1.y + p2.y) * f * f + (2 * p1.y - 2 * p0.y) * f + p0.y
      }
    }
    function linearTBetweenPoints (p1, p2, f) {
      return {
        x: p1.x + ((p2.x - p1.x)) * f,
        y: p1.y + ((p2.y - p1.y)) * f
      }
    }

    function intermediateValue (v1, v2, f) {
      return v1 + (v2 - v1) * f
    }
    function getBBox (cmxArr) {
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity

      // const exe = []
      let d
      let point
      for (let i = 0; i < cmxArr.length; i += 1) {
        d = cmxArr[i]
        if (['V', 'H', 'L', 'v', 'h', 'l'].indexOf(d.type) !== -1) {
          [d.p0 ? d.p0 : (cmxArr[i - 1].p1), d.p1].forEach(function (point) {
            if (point.x < minX) { minX = point.x }
            if (point.x > maxX) { maxX = point.x }

            if (point.y < minY) { minY = point.y }
            if (point.y > maxY) { maxY = point.y }
          })
        } else if (['Q', 'C', 'q', 'c'].indexOf(d.type) !== -1) {
          const co = cubicBezierCoefficients(d)
          let exe = cubicBezierTransition.bind(null, d.p0, co)
          let ii = 0
          let point

          while (ii < 1) {
            point = exe(ii)
            ii += 0.05
            if (point.x < minX) { minX = point.x }
            if (point.x > maxX) { maxX = point.x }

            if (point.y < minY) { minY = point.y }
            if (point.y > maxY) { maxY = point.y }
          }
        } else {
          point = d.p0
          if (point.x < minX) { minX = point.x }
          if (point.x > maxX) { maxX = point.x }

          if (point.y < minY) { minY = point.y }
          if (point.y > maxY) { maxY = point.y }
        }
      }

      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      }
    }

    const _slicedToArray = (function () {
      function sliceIterator (arr, i) {
        const _arr = []
        let _n = true
        let _d = false
        let _e
        try {
          for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
            _arr.push(_s.value)
            if (i && _arr.length === i) break
          }
        } catch (err) {
          _d = true
          _e = err
        } finally {
          try {
            if (!_n && _i.return) _i.return()
          } finally {
            if (_d) {
              // throw _e
              console.log('Error -' + _e)
            }
          }
        }
        return _arr
      }
      return function (arr, i) {
        if (Array.isArray(arr)) {
          return arr
        } else if (Symbol.iterator in Object(arr)) {
          return sliceIterator(arr, i)
        }
        throw new TypeError('Invalid attempt to destructure non-iterable instance')
      }
    }())

    const TAU = Math.PI * 2

    const mapToEllipse = function mapToEllipse (_ref, rx, ry, cosphi, sinphi, centerx, centery) {
      let { x, y } = _ref

      x *= rx
      y *= ry

      const xp = cosphi * x - sinphi * y
      const yp = sinphi * x + cosphi * y

      return {
        x: xp + centerx,
        y: yp + centery
      }
    }

    const approxUnitArc = function approxUnitArc (ang1, ang2) {
      const a = 4 / 3 * Math.tan(ang2 / 4)

      const x1 = Math.cos(ang1)
      const y1 = Math.sin(ang1)
      const x2 = Math.cos(ang1 + ang2)
      const y2 = Math.sin(ang1 + ang2)

      return [{
        x: x1 - y1 * a,
        y: y1 + x1 * a
      }, {
        x: x2 + y2 * a,
        y: y2 - x2 * a
      }, {
        x: x2,
        y: y2
      }]
    }

    const vectorAngle = function vectorAngle (ux, uy, vx, vy) {
      const sign = ux * vy - uy * vx < 0 ? -1 : 1
      const umag = Math.sqrt(ux * ux + uy * uy)
      const vmag = Math.sqrt(ux * ux + uy * uy)
      const dot = ux * vx + uy * vy

      let div = dot / (umag * vmag)

      if (div > 1) {
        div = 1
      }

      if (div < -1) {
        div = -1
      }

      return sign * Math.acos(div)
    }

    const getArcCenter = function getArcCenter (px, py, cx, cy, rx, ry, largeArcFlag, sweepFlag, sinphi, cosphi, pxp, pyp) {
      const rxsq = pw(rx, 2)
      const rysq = pw(ry, 2)
      const pxpsq = pw(pxp, 2)
      const pypsq = pw(pyp, 2)

      let radicant = rxsq * rysq - rxsq * pypsq - rysq * pxpsq

      if (radicant < 0) {
        radicant = 0
      }

      radicant /= rxsq * pypsq + rysq * pxpsq
      radicant = Math.sqrt(radicant) * (largeArcFlag === sweepFlag ? -1 : 1)

      const centerxp = radicant * rx / ry * pyp
      const centeryp = radicant * -ry / rx * pxp

      const centerx = cosphi * centerxp - sinphi * centeryp + (px + cx) / 2
      const centery = sinphi * centerxp + cosphi * centeryp + (py + cy) / 2

      const vx1 = (pxp - centerxp) / rx
      const vy1 = (pyp - centeryp) / ry
      const vx2 = (-pxp - centerxp) / rx
      const vy2 = (-pyp - centeryp) / ry

      const ang1 = vectorAngle(1, 0, vx1, vy1)
      let ang2 = vectorAngle(vx1, vy1, vx2, vy2)

      if (sweepFlag === 0 && ang2 > 0) {
        ang2 -= TAU
      }

      if (sweepFlag === 1 && ang2 < 0) {
        ang2 += TAU
      }

      return [centerx, centery, ang1, ang2]
    }

    const arcToBezier = function arcToBezier (_ref2) {
      let { px, py, cx, cy, rx, ry } = _ref2
      const _ref2$xAxisRotation = _ref2.xAxisRotation
      const xAxisRotation = _ref2$xAxisRotation === undefined ? 0 : _ref2$xAxisRotation
      const _ref2$largeArcFlag = _ref2.largeArcFlag
      const largeArcFlag = _ref2$largeArcFlag === undefined ? 0 : _ref2$largeArcFlag
      const _ref2$sweepFlag = _ref2.sweepFlag
      const sweepFlag = _ref2$sweepFlag === undefined ? 0 : _ref2$sweepFlag
      const curves = []

      if (rx === 0 || ry === 0) {
        return []
      }

      const sinphi = Math.sin(xAxisRotation * TAU / 360)
      const cosphi = Math.cos(xAxisRotation * TAU / 360)

      const pxp = cosphi * (px - cx) / 2 + sinphi * (py - cy) / 2
      const pyp = -sinphi * (px - cx) / 2 + cosphi * (py - cy) / 2

      if (pxp === 0 && pyp === 0) {
        return []
      }

      rx = Math.abs(rx)
      ry = Math.abs(ry)

      const lambda = pw(pxp, 2) / pw(rx, 2) + pw(pyp, 2) / pw(ry, 2)

      if (lambda > 1) {
        rx *= Math.sqrt(lambda)
        ry *= Math.sqrt(lambda)
      }

      const _getArcCenter = getArcCenter(px, py, cx, cy, rx, ry, largeArcFlag, sweepFlag, sinphi, cosphi, pxp, pyp)

      const _getArcCenter2 = _slicedToArray(_getArcCenter, 4)

      const centerx = _getArcCenter2[0]
      const centery = _getArcCenter2[1]
      let ang1 = _getArcCenter2[2]
      let ang2 = _getArcCenter2[3]

      const segments = Math.max(Math.ceil(Math.abs(ang2) / (TAU / 4)), 1)

      ang2 /= segments

      for (let i = 0; i < segments; i++) {
        curves.push(approxUnitArc(ang1, ang2))
        ang1 += ang2
      }

      return curves.map((curve) => {
        const _mapToEllipse = mapToEllipse(curve[0], rx, ry, cosphi, sinphi, centerx, centery)

        const x1 = _mapToEllipse.x
        const y1 = _mapToEllipse.y

        const _mapToEllipse2 = mapToEllipse(curve[1], rx, ry, cosphi, sinphi, centerx, centery)

        const x2 = _mapToEllipse2.x
        const y2 = _mapToEllipse2.y

        const _mapToEllipse3 = mapToEllipse(curve[2], rx, ry, cosphi, sinphi, centerx, centery)

        const x = _mapToEllipse3.x
        const y = _mapToEllipse3.y

        return {
          x1,
          y1,
          x2,
          y2,
          x,
          y
        }
      })
    }

    function rotatePoint (point, centre, newAngle, distance) {
      const p = {}
      let x = point.x
      let y = point.y
      let cx = centre.x
      let cy = centre.y
      // let currAngle = this.getAngle(centre, point)
      // currAngle += (Math.PI / 2)

      var radians = (Math.PI / 180) * newAngle
      var cos = Math.cos(-radians)
      var sin = Math.sin(-radians)

      p.x = (cos * (x - cx)) + (sin * (y - cy)) + cx
      p.y = (cos * (y - cy)) - (sin * (x - cx)) + cy

      return { x: (cos * (x - cx)) + (sin * (y - cy)) + cx,
        y: (cos * (y - cy)) - (sin * (x - cx)) + cy
      }

      // console.log(point)
      // console.log(currAngle)
      // console.log(currAngle + newAngle * (Math.PI / 180))
      // p.x = Math.cos(currAngle + newAngle * (Math.PI / 180) + Math.PI/2) * distance
      // p.y = Math.sin(currAngle + newAngle * (Math.PI / 180) + Math.PI/2) * distance

    // return p
    }

    function rotateBBox (BBox, transform) {
      let point1 = { x: BBox.x, y: BBox.y }
      let point2 = { x: BBox.x + BBox.width, y: BBox.y }
      let point3 = { x: BBox.x, y: BBox.y + BBox.height }
      let point4 = { x: BBox.x + BBox.width, y: BBox.y + BBox.height }
      const { translate, rotate } = transform
      const cen = { x: rotate[1] || 0, y: rotate[2] || 0 }
      const rotateAngle = rotate[0]

      if (translate && translate.length > 0) {
        cen.x += translate[0]
        cen.y += translate[1]
      }

      point1 = rotatePoint(point1, cen, rotateAngle, getDistance(point1, cen))
      point2 = rotatePoint(point2, cen, rotateAngle, getDistance(point2, cen))
      point3 = rotatePoint(point3, cen, rotateAngle, getDistance(point3, cen))
      point4 = rotatePoint(point4, cen, rotateAngle, getDistance(point4, cen))

      const xVec = [point1.x, point2.x, point3.x, point4.x].sort((bb, aa) => bb - aa)
      const yVec = [point1.y, point2.y, point3.y, point4.y].sort((bb, aa) => bb - aa)
      return {
        x: xVec[0],
        y: yVec[0],
        width: xVec[3] - xVec[0],
        height: yVec[3] - yVec[0]
      }
    }

    function T2dGeometry () {}
    T2dGeometry.prototype = {
      pow: pw,
      getAngle: get2DAngle,
      getDistance,
      scaleAlongOrigin,
      scaleAlongPoint,
      linearTransitionBetweenPoints: linearTBetweenPoints,
      bezierTransition,
      bezierLength,
      cubicBezierTransition,
      cubicBezierLength,
      cubicBezierCoefficients,
      arcToBezier,
      intermediateValue,
      getBBox,
      toCubicCurves,
      rotatePoint,
      rotateBBox
    }

    function getGeometry () {
      return new T2dGeometry()
    }

    return getGeometry()
  }

  return geometry
}))


/***/ }),

/***/ "./src/path.js":
/*!*********************!*\
  !*** ./src/path.js ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* eslint-disable no-undef */
;(function path (root, factory) {
  const i2d = root
  if ( true && module.exports) {
    module.exports = factory(__webpack_require__(/*! ./geometry.js */ "./src/geometry.js"), __webpack_require__(/*! ./queue.js */ "./src/queue.js"), __webpack_require__(/*! ./easing.js */ "./src/easing.js"), __webpack_require__(/*! ./chaining.js */ "./src/chaining.js"))
  } else if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! ./geometry.js */ "./src/geometry.js"), __webpack_require__(/*! ./queue.js */ "./src/queue.js"), __webpack_require__(/*! ./easing.js */ "./src/easing.js"), __webpack_require__(/*! ./chaining.js */ "./src/chaining.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (geometry => factory(geometry, queue, easing, chain)).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
  } else {}
}(this, (geometry, queue, easing, chain) => {
  'use strict'
  let morphIdentifier = 0
  const t2DGeometry = geometry('2D')
  const queueInstance = queue()
  const easying = easing()

  function animeId () {
    morphIdentifier += 1
    return 'morph_' + morphIdentifier
  }

  function pathParser (path) {
    let pathStr = path.replace(/e-/g, '$')
    pathStr = pathStr.replace(/ /g, ',')
    pathStr = pathStr.replace(/-/g, ',-')
    pathStr = pathStr.split(/([a-zA-Z,])/g).filter((d) => {
      if (d === '' || d === ',') {
        return false
      }
      return true
    }).map((d) => {
      const dd = d.replace(/\$/g, 'e-')
      return dd
    })

    for (let i = 0; i < pathStr.length; i += 1) {
      if (pathStr[i].split('.').length > 2) {
        const splitArr = pathStr[i].split('.')
        const arr = [`${splitArr[0]}.${splitArr[1]}`]
        for (let j = 2; j < splitArr.length; j += 1) {
          arr.push(`.${splitArr[j]}`)
        }
        pathStr.splice(i, 1, arr[0], arr[1])
      }
    }

    return pathStr
  }

  function addVectors (v1, v2) {
    return {
      x: v1.x + v2.x,
      y: v1.y + v2.y
    }
  }

  function subVectors (v1, v2) {
    return {
      x: v1.x - v2.x,
      y: v1.y - v2.y
    }
  }

  function fetchXY () {
    const x = parseFloat(this.pathArr[this.currPathArr += 1])
    const y = parseFloat(this.pathArr[this.currPathArr += 1])
    return {
      x,
      y
    }
  }

  function relative (flag, p1, p2) {
    return flag ? p2 : p1
  }

  function m (rel, p0) {
    const temp = relative(rel, this.pp ? this.pp : { x: 0, y: 0 }, {
      x: 0,
      y: 0
    })
    this.cntrl = null
    this.cp = addVectors(p0, temp)
    this.start = this.cp
    this.segmentLength = 0
    this.length = this.segmentLength

    if (this.currPathArr !== 0 && this.pp) {
      this.stackGroup.push(this.stack)
      this.stack = []
    } else {
      this.stackGroup.push(this.stack)
    }

    this.stack.push({
      type: 'M',
      p0: this.cp,
      length: this.segmentLength,
      pointAt (f) {
        return this.p0
      }
    })

    this.pp = this.cp

    return this
  }

  function v (rel, p1) {
    const temp = relative(rel, this.pp, {
      x: this.pp.x,
      y: 0
    })
    this.cntrl = null
    this.cp = addVectors(p1, temp)
    this.segmentLength = t2DGeometry.getDistance(this.pp, this.cp)
    this.stack.push({
      type: 'V',
      p0: this.pp,
      p1: this.cp,
      length: this.segmentLength,
      pointAt (f) {
        return t2DGeometry.linearTransitionBetweenPoints(this.p0, this.p1, f)
      }
    })
    this.length += this.segmentLength
    this.pp = this.cp
    return this
  }

  function l (rel, p1) {
    const temp = relative(rel, this.pp, {
      x: 0,
      y: 0
    })
    this.cntrl = null
    this.cp = addVectors(p1, temp)
    this.segmentLength = t2DGeometry.getDistance(this.pp, this.cp)
    this.stack.push({
      type: rel ? 'L' : 'l',
      p0: this.pp,
      p1: this.cp,
      relative: {
        p1: p1
      },
      length: this.segmentLength,
      pointAt (f) {
        return t2DGeometry.linearTransitionBetweenPoints(this.p0, this.p1, f)
      }
    })
    this.length += this.segmentLength
    this.pp = this.cp
    return this
  }

  function h (rel, p1) {
    const temp = relative(rel, this.pp, {
      x: 0,
      y: this.pp.y
    })
    this.cp = addVectors(p1, temp)
    this.cntrl = null
    this.segmentLength = t2DGeometry.getDistance(this.pp, this.cp)
    this.stack.push({
      type: rel ? 'H' : 'h',
      p0: this.pp,
      p1: this.cp,
      length: this.segmentLength,
      relative: {
        p1: p1
      },
      pointAt (f) {
        return t2DGeometry.linearTransitionBetweenPoints(this.p0, this.p1, f)
      }
    })

    this.length += this.segmentLength
    this.pp = this.cp
    return this
  }

  function z () {
    this.cp = this.start
    this.segmentLength = t2DGeometry.getDistance(this.pp, this.cp)
    this.stack.push({
      p0: this.pp,
      p1: this.cp,
      type: 'Z',
      length: this.segmentLength,
      pointAt (f) {
        return t2DGeometry.linearTransitionBetweenPoints(this.p0, this.p1, f)
      }
    })
    this.length += this.segmentLength
    this.pp = this.cp

    // this.stackGroup.push(this.stack)

    return this
  }

  function q (rel, c1, ep) {
    const temp = relative(rel, this.pp, {
      x: 0,
      y: 0
    })
    const cntrl1 = addVectors(c1, temp)
    const endPoint = addVectors(ep, temp)

    this.cp = endPoint

    this.segmentLength = t2DGeometry.bezierLength(this.pp, cntrl1, this.cp)

    this.cp = endPoint
    this.stack.push({
      type: rel ? 'Q' : 'q',
      p0: this.pp,
      cntrl1,
      cntrl2: cntrl1,
      p1: this.cp,
      relative: {
        cntrl1: c1,
        p1: ep
      },
      length: this.segmentLength,
      pointAt (f) {
        return t2DGeometry.bezierTransition(this.p0, this.cntrl1, this.p1, f)
      }
    })

    this.length += this.segmentLength
    this.pp = this.cp
    this.cntrl = null
    return this
  }

  function c (rel, c1, c2, ep) {
    const temp = relative(rel, this.pp, {
      x: 0,
      y: 0
    })
    const cntrl1 = addVectors(c1, temp)
    const cntrl2 = addVectors(c2, temp)
    const endPoint = addVectors(ep, temp)

    const co = t2DGeometry.cubicBezierCoefficients({
      p0: this.pp,
      cntrl1,
      cntrl2,
      p1: endPoint
    })

    this.cntrl = cntrl2
    this.cp = endPoint
    this.segmentLength = t2DGeometry.cubicBezierLength(this.pp, co)
    this.stack.push({
      type: rel ? 'C' : 'c',
      p0: this.pp,
      cntrl1,
      cntrl2,
      p1: this.cp,
      length: this.segmentLength,
      co: co,
      relative: {
        cntrl1: c1,
        cntrl2: c2,
        p1: ep
      },
      pointAt (f) {
        return t2DGeometry.cubicBezierTransition(this.p0, this.co, f)
      }
    })
    this.length += this.segmentLength
    this.pp = this.cp
    return this
  }

  function s (rel, c2, ep) {
    const temp = relative(rel, this.pp, {
      x: 0,
      y: 0
    })

    const cntrl1 = addVectors(this.pp, subVectors(this.pp, this.cntrl ? this.cntrl : this.pp))
    const cntrl2 = addVectors(c2, temp)
    const endPoint = addVectors(ep, temp)

    this.cp = endPoint
    const co = t2DGeometry.cubicBezierCoefficients({
      p0: this.pp,
      cntrl1,
      cntrl2,
      p1: endPoint
    })
    this.segmentLength = t2DGeometry.cubicBezierLength(
      this.pp, co)

    this.stack.push({
      type: rel ? 'S' : 's',
      p0: this.pp,
      cntrl1,
      cntrl2,
      p1: this.cp,
      co: co,
      length: this.segmentLength,
      relative: {
        cntrl2: c2,
        p1: ep
      },
      pointAt (f) {
        return t2DGeometry.cubicBezierTransition(this.p0, this.co, f)
      }
    })
    // this.stack.segmentLength += this.segmentLength
    this.length += this.segmentLength
    this.pp = this.cp
    this.cntrl = cntrl2
    return this
  }

  function a (rel, rx, ry, xRotation, arcLargeFlag, sweepFlag, ep) {
    const temp = relative(rel, this.pp, {
      x: 0,
      y: 0
    })
    const self = this
    const endPoint = addVectors(ep, temp)
    this.cp = endPoint

    const arcToQuad = t2DGeometry.arcToBezier({
      px: this.pp.x,
      py: this.pp.y,
      cx: endPoint.x,
      cy: endPoint.y,
      rx,
      ry,
      xAxisRotation: xRotation,
      largeArcFlag: arcLargeFlag,
      sweepFlag
    })

    arcToQuad.forEach((d, i) => {
      const pp = (i === 0 ? self.pp : {
        x: arcToQuad[0].x,
        y: arcToQuad[0].y
      })
      const cntrl1 = {
        x: d.x1,
        y: d.y1
      }
      const cntrl2 = {
        x: d.x2,
        y: d.y2
      }
      const cp = {
        x: d.x,
        y: d.y
      }
      const segmentLength = t2DGeometry.cubicBezierLength(pp, t2DGeometry.cubicBezierCoefficients({
        p0: pp,
        cntrl1,
        cntrl2,
        p1: cp
      }))
      self.stack.push({
        type: 'C',
        p0: pp,
        cntrl1,
        cntrl2,
        p1: cp,
        length: segmentLength,
        pointAt (f) {
          return t2DGeometry.bezierTransition(this.p0, this.cntrl1, this.cntrl2, this.p1, f)
        }

      })
      self.length += segmentLength
    })
    this.pp = this.cp
    return this
  }

  function Path (path) {
    this.stack = []
    this.length = 0
    this.stackGroup = []
    if (path) {
      this.path = path
      this.parse()
    }
  }
  Path.prototype = {
    z,
    m,
    v,
    h,
    l,
    q,
    s,
    c,
    a,
    fetchXY
  }

  Path.prototype.parse = function parse () {
    this.currPathArr = -1
    this.stack = []
    this.length = 0
    this.pathArr = pathParser(this.path)
    this.stackGroup = []

    while (this.currPathArr < this.pathArr.length - 1) {
      this.case(this.pathArr[this.currPathArr += 1])
    }
    return this.stack
  }
  Path.prototype.fetchPathString = function () {
    let p = ''
    let c
    for (let i = 0; i < this.stack.length; i++) {
      c = this.stack[i]
      if (c.type === 'M') {
        p += c.type + ' ' + c.p0.x + ',' + c.p0.y + ' '
      } else if (c.type === 'Z') {
        p += 'z'
      } else if (c.type === 'C') {
        p += c.type + ' ' + c.cntrl1.x + ',' + c.cntrl1.y + ' ' + c.cntrl2.x + ',' + c.cntrl2.y + ' ' + c.p1.x + ',' + c.p1.y + ' '
      } else if (c.type === 'c') {
        p += c.type + ' ' + c.relative.cntrl1.x + ',' + c.relative.cntrl1.y + ' ' + c.relative.cntrl2.x + ',' + c.relative.cntrl2.y + ' ' + c.relative.p1.x + ',' + c.relative.p1.y + ' '
      } else if (c.type === 'Q') {
        p += c.type + ' ' + c.cntrl1.x + ',' + c.cntrl1.y + ' ' + c.p1.x + ',' + c.p1.y + ' '
      } else if (c.type === 'q') {
        p += c.type + ' ' + c.relative.cntrl1.x + ',' + c.relative.cntrl1.y + ' ' + c.relative.p1.x + ',' + c.relative.p1.y + ' '
      } else if (c.type === 'S') {
        p += c.type + ' ' + c.cntrl2.x + ',' + c.cntrl2.y + ' ' + c.p1.x + ',' + c.p1.y + ' '
      } else if (c.type === 's') {
        p += c.type + ' ' + c.relative.cntrl2.x + ',' + c.relative.cntrl2.y + ' ' + c.relative.p1.x + ',' + c.relative.p1.y + ' '
      } else if (c.type === 'V') {
        p += c.type + ' ' + c.p1.y + ' '
      } else if (c.type === 'v') {
        p += c.type + ' ' + c.relative.p1.y + ' '
      } else if (c.type === 'H') {
        p += c.type + ' ' + c.p1.x + ' '
      } else if (c.type === 'h') {
        p += c.type + ' ' + c.relative.p1.x + ' '
      } else if (c.type === 'L') {
        p += c.type + ' ' + c.p1.x + ',' + c.p1.y + ' '
      } else if (c.type === 'l') {
        p += c.type + ' ' + c.relative.p1.x + ',' + c.relative.p1.y + ' '
      }
    }
    return p
  }
  Path.prototype.getTotalLength = function getTotalLength () {
    return this.length
  }
  Path.prototype.getAngleAtLength = function getAngleAtLength (length, dir) {
    if (length > this.length) { return null }

    const point1 = this.getPointAtLength(length)
    const point2 = this.getPointAtLength(length + (dir === 'src' ? (-1 * length * 0.01) : (length * 0.01)))

    return Math.atan2(point2.y - point1.y, point2.x - point1.x)
  }
  Path.prototype.getPointAtLength = function getPointAtLength (length) {
    let coOr = { x: 0, y: 0 }
    let tLength = length

    this.stack.every((d, i) => {
      tLength -= d.length
      if (Math.floor(tLength) >= 0) {
        return true
      }

      coOr = d.pointAt((d.length + tLength) / (d.length === 0 ? 1 : d.length))
      return false
    })
    return coOr
  }
  Path.prototype.isValid = function isValid (_) {
    return ['m', 'M', 'v', 'V', 'l', 'L', 'h', 'H', 'q', 'Q', 'c', 'C', 's', 'S', 'a', 'A', 'z', 'Z'].indexOf(_) !== -1
  }
  Path.prototype.case = function pCase (currCmd) {
    let currCmdI = currCmd
    if (this.isValid(currCmdI)) {
      this.PC = currCmdI
    } else {
      currCmdI = this.PC
      this.currPathArr = this.currPathArr - 1
    }
    switch (currCmdI) {
      case 'm':
        this.m(false, this.fetchXY())
        break
      case 'M':
        this.m(true, this.fetchXY())
        break
      case 'v':
        this.v(false, {
          x: 0,
          y: parseFloat(this.pathArr[this.currPathArr += 1])
        })
        break
      case 'V':
        this.v(true, {
          x: 0,
          y: parseFloat(this.pathArr[this.currPathArr += 1])
        })
        break
      case 'l':
        this.l(false, this.fetchXY())
        break
      case 'L':
        this.l(true, this.fetchXY())
        break
      case 'h':
        this.h(false, {
          x: parseFloat(this.pathArr[this.currPathArr += 1]),
          y: 0
        })
        break
      case 'H':
        this.h(true, {
          x: parseFloat(this.pathArr[this.currPathArr += 1]),
          y: 0
        })
        break
      case 'q':
        this.q(false, this.fetchXY(), this.fetchXY())
        break
      case 'Q':
        this.q(true, this.fetchXY(), this.fetchXY())
        break
      case 'c':
        this.c(false, this.fetchXY(), this.fetchXY(), this.fetchXY())
        break
      case 'C':
        this.c(true, this.fetchXY(), this.fetchXY(), this.fetchXY())
        break
      case 's':
        this.s(false, this.fetchXY(), this.fetchXY())
        break
      case 'S':
        this.s(true, this.fetchXY(), this.fetchXY())
        break
      case 'a':
        let rx = parseFloat(this.pathArr[this.currPathArr += 1])
        let ry = parseFloat(this.pathArr[this.currPathArr += 1])
        let xRotation = parseFloat(this.pathArr[this.currPathArr += 1])
        let arcLargeFlag = parseFloat(this.pathArr[this.currPathArr += 1])
        let sweepFlag = parseFloat(this.pathArr[this.currPathArr += 1])
        this.a(false, rx, ry, xRotation, arcLargeFlag, sweepFlag, this.fetchXY())
        break
      case 'A':
        rx = parseFloat(this.pathArr[this.currPathArr += 1])
        ry = parseFloat(this.pathArr[this.currPathArr += 1])
        xRotation = parseFloat(this.pathArr[this.currPathArr += 1])
        arcLargeFlag = parseFloat(this.pathArr[this.currPathArr += 1])
        sweepFlag = parseFloat(this.pathArr[this.currPathArr += 1])
        this.a(true, rx, ry, xRotation, arcLargeFlag, sweepFlag, this.fetchXY())
        break
      case 'z':
        this.z()
        break
      default:
        break
    }
  }

  function relativeCheck (type) {
    return ['S', 'C', 'V', 'L', 'H', 'Q'].indexOf(type) > -1
  }

  let CubicBezierTransition = function CubicBezierTransition (type, p0, c1, c2, co, length) {
    this.type = type
    this.p0 = p0
    this.c1_src = c1
    this.c2_src = c2
    this.co = co
    this.length_src = length
  }
  CubicBezierTransition.prototype.execute = function (f) {
    const co = this.co
    const p0 = this.p0
    const c1 = this.c1_src
    const c2 = this.c2_src
    const c1Temp = {
      x: (p0.x + ((c1.x - p0.x)) * f),
      y: (p0.y + ((c1.y - p0.y)) * f)
    }
    const c2Temp = {
      x: (c1.x + ((c2.x - c1.x)) * f),
      y: (c1.y + ((c2.y - c1.y)) * f)
    }
    this.cntrl1 = c1Temp
    this.cntrl2 = { x: c1Temp.x + (c2Temp.x - c1Temp.x) * f, y: c1Temp.y + ((c2Temp.y - c1Temp.y)) * f }
    this.p1 = { x: co.ax * t2DGeometry.pow(f, 3) + co.bx * t2DGeometry.pow(f, 2) + co.cx * f + p0.x,
      y: co.ay * t2DGeometry.pow(f, 3) + co.by * t2DGeometry.pow(f, 2) + co.cy * f + p0.y
    }
    this.length = this.length_src * f

    this.relative = {
      cntrl1: (relativeCheck(this.type) ? this.cntrl1 : subVectors(this.cntrl1, this.p0)),
      cntrl2: (relativeCheck(this.type) ? this.cntrl2 : subVectors(this.cntrl2, this.p0)),
      p1: (relativeCheck(this.type) ? this.p1 : subVectors(this.p1, this.p0))
    }
    return this
  }
  CubicBezierTransition.prototype.pointAt = function (f) {
    return t2DGeometry.cubicBezierTransition(this.p0, this.co, f)
  }

  let BezierTransition = function BezierTransition (type, p0, p1, p2, length, f) {
    this.type = type
    this.p0 = p0
    this.p1_src = p1
    this.p2_src = p2
    this.length_src = length
    this.length = 0
  }
  BezierTransition.prototype.execute = function (f) {
    let p0 = this.p0
    let p1 = this.p1_src
    let p2 = this.p2_src
    this.length = this.length_src * f
    this.cntrl1 = { x: p0.x + ((p1.x - p0.x)) * f, y: p0.y + ((p1.y - p0.y)) * (f) }
    this.cntrl2 = this.cntrl1
    this.p1 = { x: (p0.x - 2 * p1.x + p2.x) * f * f + (2 * p1.x - 2 * p0.x) * f + p0.x, y: (p0.y - 2 * p1.y + p2.y) * f * f + (2 * p1.y - 2 * p0.y) * f + p0.y }
    this.relative = {
      cntrl1: (relativeCheck(this.type) ? this.cntrl1 : subVectors(this.cntrl1, this.p0)),
      p1: (relativeCheck(this.type) ? this.p1 : subVectors(this.p1, this.p0))
    }
    return this
  }
  BezierTransition.prototype.pointAt = function (f) {
    return t2DGeometry.bezierTransition(this.p0, this.cntrl1, this.p1, f)
  }

  let LinearTransitionBetweenPoints = function LinearTransitionBetweenPoints (type, p0, p2, length, f) {
    this.type = type
    this.p0 = p0
    this.p1 = p0
    this.p2_src = p2
    this.length_src = length
    this.length = 0
  }
  LinearTransitionBetweenPoints.prototype.execute = function (f) {
    let p0 = this.p0
    let p2 = this.p2_src

    this.p1 = { x: p0.x + (p2.x - p0.x) * f, y: p0.y + (p2.y - p0.y) * f }
    this.length = this.length_src * f
    this.relative = {
      p1: (relativeCheck(this.type) ? this.p1 : subVectors(this.p1, this.p0))
    }
    return this
  }
  LinearTransitionBetweenPoints.prototype.pointAt = function (f) {
    return t2DGeometry.linearTransitionBetweenPoints(this.p0, this.p1, f)
  }

  function animatePathTo (targetConfig) {
    const self = this
    const { duration, ease, end, loop, direction, d } = targetConfig
    const src = d || self.attr.d
    let totalLength = 0

    self.arrayStack = []

    if (!src) { throw Error('Path Not defined') }

    const chainInstance = chain.sequenceChain()
    const newPathInstance = isTypePath(src) ? src : new Path(src)
    const arrExe = newPathInstance.stackGroup.reduce((p, c) => {
      p = p.concat(c)
      return p
    }, [])
    const mappedArr = []

    for (let i = 0; i < arrExe.length; i += 1) {
      if (arrExe[i].type === 'Z') {
        mappedArr.push({
          run (f) {
            newPathInstance.stack.splice(this.id, newPathInstance.stack.length - 1)
            newPathInstance.stack[this.id] = this.render.execute(f)
            self.setAttr('d', newPathInstance)
          },
          id: i,
          render: new LinearTransitionBetweenPoints(arrExe[i].type, arrExe[i].p0, arrExe[0].p0, arrExe[i].segmentLength),
          length: arrExe[i].length
        })
        totalLength += 0
      } else if (['V', 'v', 'H', 'h', 'L', 'l'].indexOf(arrExe[i].type) !== -1) {
        mappedArr.push({
          run (f) {
            newPathInstance.stack.splice(this.id, newPathInstance.stack.length - 1)
            newPathInstance.stack[this.id] = this.render.execute(f)
            self.setAttr('d', newPathInstance)
          },
          id: i,
          render: new LinearTransitionBetweenPoints(arrExe[i].type, arrExe[i].p0, arrExe[i].p1, arrExe[i].length),
          length: arrExe[i].length
        })
        totalLength += arrExe[i].length
      } else if (arrExe[i].type === 'Q' || arrExe[i].type === 'q') {
        mappedArr.push({
          run (f) {
            newPathInstance.stack.splice(this.id, newPathInstance.stack.length - 1)
            newPathInstance.stack[this.id] = this.render.execute(f)
            self.setAttr('d', newPathInstance)
          },
          id: i,
          render: new BezierTransition(arrExe[i].type, arrExe[i].p0, arrExe[i].cntrl1, arrExe[i].p1, arrExe[i].length),
          length: arrExe[i].length
        })
        totalLength += arrExe[i].length
      } else if (arrExe[i].type === 'C' || arrExe[i].type === 'S' || arrExe[i].type === 'c' || arrExe[i].type === 's') {
        const co = t2DGeometry.cubicBezierCoefficients(arrExe[i])
        mappedArr.push({
          run (f) {
            newPathInstance.stack.splice(this.id, newPathInstance.stack.length - 1)
            newPathInstance.stack[this.id] = this.render.execute(f)
            self.setAttr('d', newPathInstance)
          },
          id: i,
          co,
          render: new CubicBezierTransition(
            arrExe[i].type,
            arrExe[i].p0,
            arrExe[i].cntrl1,
            arrExe[i].cntrl2,
            co,
            arrExe[i].length
          ),
          length: arrExe[i].length
        })
        totalLength += arrExe[i].length
      } else if (arrExe[i].type === 'M') {
        mappedArr.push({
          run () {
            newPathInstance.stack.splice(this.id, newPathInstance.stack.length - 1)
            newPathInstance.stack[this.id] = {
              type: 'M',
              p0: arrExe[i].p0,
              length: 0,
              pointAt (f) {
                return this.p0
              }
            }
          },
          id: i,
          length: 0
        })
        totalLength += 0
      } else {
        // console.log('M Or Other Type')
      }
    }

    mappedArr.forEach(function (d) {
      d.duration = (d.length / totalLength) * duration
    })
    chainInstance.duration(duration)
      .add(mappedArr)
      .ease(ease)
      .loop(loop || 0)
      .direction(direction || 'default')

    if (typeof end === 'function') { chainInstance.end(end.bind(self)) }

    chainInstance.commit()

    return this
  }

  function morphTo (targetConfig) {
    const self = this
    const { duration } = targetConfig
    const { ease } = targetConfig
    const loop = targetConfig.loop ? targetConfig.loop : 0
    const direction = targetConfig.direction ? targetConfig.direction : 'default'
    const destD = targetConfig.attr.d ? targetConfig.attr.d : self.attr.d

    let srcPath = isTypePath(self.attr.d) ? self.attr.d.stackGroup : (new Path(self.attr.d)).stackGroup
    let destPath = isTypePath(destD) ? destD.stackGroup : (new Path(destD)).stackGroup

    const chainInstance = []

    self.arrayStack = []

    if (srcPath.length > 1) {
      srcPath = srcPath.sort((aa, bb) => bb.segmentLength - aa.segmentLength)
    }
    if (destPath.length > 1) {
      destPath = destPath.sort((aa, bb) => bb.segmentLength - aa.segmentLength)
    }

    const maxGroupLength = srcPath.length > destPath.length ? srcPath.length : destPath.length

    mapper(toCubicCurves(srcPath[0]), toCubicCurves(destPath[0]))

    for (let j = 1; j < maxGroupLength; j += 1) {
      if (srcPath[j]) {
        mapper(toCubicCurves(srcPath[j]), [{
          type: 'M',
          p0: srcPath[j][0].p0
        }])
      }
      if (destPath[j]) {
        mapper([{
          type: 'M',
          p0: destPath[j][0].p0
        }], toCubicCurves(destPath[j]))
      }
    }

    function toCubicCurves (stack) {
      if (!stack.length) { return }
      const _ = stack
      const mappedArr = []
      for (let i = 0; i < _.length; i += 1) {
        if (['M', 'C', 'S', 'Q'].indexOf(_[i].type) !== -1) {
          mappedArr.push(_[i])
        } else if (['V', 'H', 'L', 'Z'].indexOf(_[i].type) !== -1) {
          const ctrl1 = {
            x: (_[i].p0.x + _[i].p1.x) / 2,
            y: (_[i].p0.y + _[i].p1.y) / 2
          }
          mappedArr.push({
            p0: _[i].p0,
            cntrl1: ctrl1,
            cntrl2: ctrl1,
            p1: _[i].p1,
            type: 'C',
            length: _[i].length
          })
        } else {
          // console.log('wrong cmd type')
        }
      }
      return mappedArr
    }

    function buildMTransitionobj (src, dest) {
      chainInstance.push({
        run (path, f) {
          const point = this.pointTansition(f)
          path.m(true, { x: point.x, y: point.y })
        },
        pointTansition: t2DGeometry.linearTransitionBetweenPoints.bind(null, src.p0, dest.p0)
      })
    }

    function buildTransitionObj (src, dest) {
      chainInstance.push({
        run (path, f) {
          const t = this
          const c1 = t.ctrl1Transition(f)
          const c2 = t.ctrl2Transition(f)
          const p1 = t.destTransition(f)
          path.c(true, { x: c1.x, y: c1.y }, { x: c2.x, y: c2.y }, { x: p1.x, y: p1.y })
        },
        srcTransition: t2DGeometry.linearTransitionBetweenPoints.bind(
          null,
          src.p0,
          dest.p0
        ),
        ctrl1Transition: t2DGeometry.linearTransitionBetweenPoints.bind(
          null,
          src.cntrl1,
          dest.cntrl1
        ),
        ctrl2Transition: t2DGeometry.linearTransitionBetweenPoints.bind(
          null,
          src.cntrl2,
          dest.cntrl2
        ),
        destTransition: t2DGeometry.linearTransitionBetweenPoints.bind(
          null,
          src.p1,
          dest.p1
        )
      })
    }

    function normalizeCmds (cmd, n) {
      if (cmd.length === n) { return cmd }
      const totalLength = cmd.reduce((pp, cc) => pp + cc.length, 0)
      const arr = []

      for (let i = 0; i < cmd.length; i += 1) {
        const len = cmd[i].length
        let counter = Math.floor((n / totalLength) * len)
        if (counter <= 1) {
          arr.push(cmd[i])
        } else {
          let t = cmd[i]
          let split
          while (counter > 1) {
            const cmdX = t
            split = splitBezier([cmdX.p0, cmdX.cntrl1, cmdX.cntrl2, cmdX.p1].slice(0), 1 / counter)
            arr.push({
              p0: cmdX.p0,
              cntrl1: split.b1[0],
              cntrl2: split.b1[1],
              p1: split.b1[2],
              type: 'C'
            })
            t = {
              p0: split.b1[2],
              cntrl1: split.b2[0],
              cntrl2: split.b2[1],
              p1: split.b2[2],
              type: 'C'
            }
            counter -= 1
          }
          arr.push(t)
        }
      }
      return arr
    }

    function splitBezier (arr, perc) {
      const coll = []
      const arrayLocal = arr
      while (arrayLocal.length > 0) {
        for (let i = 0; i < arrayLocal.length - 1; i += 1) {
          coll.unshift(arrayLocal[i])
          arrayLocal[i] = interpolate(arrayLocal[i], arrayLocal[i + 1], perc)
        }
        coll.unshift(arrayLocal.pop())
      }
      return {
        b1: [{
          x: coll[5].x,
          y: coll[5].y
        }, {
          x: coll[2].x,
          y: coll[2].y
        }, {
          x: coll[0].x,
          y: coll[0].y
        }],
        b2: [{
          x: coll[1].x,
          y: coll[1].y
        }, {
          x: coll[3].x,
          y: coll[3].y
        }, {
          x: coll[6].x,
          y: coll[6].y
        }]
      }
    }

    function interpolate (p0, p1, percent) {
      return {
        x: p0.x + (p1.x - p0.x) * (percent !== undefined ? percent : 0.5),
        y: p0.y + (p1.y - p0.y) * (percent !== undefined ? percent : 0.5)
      }
    }

    // function getRightBeginPoint (src, dest) {
    //   let closestPoint = 0,
    //     minDistance = 99999999

    //   for (let i = 0; i < dest.length; i += 1) {
    //     if (t2DGeometry.getDistance(src[0].p0, dest[i].p0) < minDistance) {
    //       minDistance = t2DGeometry.getDistance(src[0].p0, dest[i].p0)
    //       closestPoint = i
    //     }
    //   }

    //   return closestPoint
    // }

    function getDirection (data) {
      let dir = 0

      for (let i = 0; i < data.length; i += 1) {
        if (data[i].type !== 'M') { dir += (data[i].p1.x - data[i].p0.x) * (data[i].p1.y + data[i].p0.y) }
      }

      return dir
    }

    function reverse (data) {
      const dataLocal = data.reverse()
      const newArray = [{
        type: 'M',
        p0: dataLocal[0].p1
      }]

      dataLocal.forEach((d) => {
        if (d.type === 'C') {
          const dLocal = d
          const tp0 = dLocal.p0
          const tc1 = dLocal.cntrl1
          dLocal.p0 = d.p1
          dLocal.p1 = tp0
          dLocal.cntrl1 = d.cntrl2
          dLocal.cntrl2 = tc1

          newArray.push(dLocal)
        }
      })
      return newArray
    }

    function centroid (path) {
      let sumX = 0
      let sumY = 0
      let counterX = 0
      let counterY = 0

      path.forEach((d) => {
        if (d.p0) {
          sumX += d.p0.x
          sumY += d.p0.y
          counterX += 1
          counterY += 1
        }
        if (d.p1) {
          sumX += d.p1.x
          sumY += d.p1.y
          counterX += 1
          counterY += 1
        }
      })

      return {
        x: sumX / counterX,
        y: sumY / counterY
      }
    }

    function getQuadrant (centroidP, point) {
      if (point.x >= centroidP.x && point.y <= centroidP.y) {
        return 1
      } else if (point.x <= centroidP.x && point.y <= centroidP.y) {
        return 2
      } else if (point.x <= centroidP.x && point.y >= centroidP.y) {
        return 3
      }
      return 4
    }

    function getSrcBeginPoint (src, dest) {
      const centroidOfSrc = centroid(src)
      const centroidOfDest = centroid(dest)
      const srcArr = src
      const destArr = dest
      for (let i = 0; i < src.length; i += 1) {
        srcArr[i].quad = getQuadrant(centroidOfSrc, src[i].p0)
      }
      for (let i = 0; i < dest.length; i += 1) {
        destArr[i].quad = getQuadrant(centroidOfDest, dest[i].p0)
      }
      let minDistance = 0

      src.forEach((d, i) => {
        const dis = t2DGeometry.getDistance(d.p0, centroidOfSrc)
        if ((d.quad === 1 && dis >= minDistance)) {
          minDistance = dis
        }
      })
      minDistance = 0
      dest.forEach((d, i) => {
        const dis = t2DGeometry.getDistance(d.p0, centroidOfDest)
        if (d.quad === 1 && dis > minDistance) {
          minDistance = dis
        }
      })

      return {
        src: setStartingPoint(src, 0), // srcStartingIndex
        dest: setStartingPoint(dest, 0), // destStartingIndex
        srcCentroid: centroidOfSrc,
        destCentroid: centroidOfDest
      }
    }

    function setStartingPoint (path, closestPoint) {
      if (closestPoint <= 0) { return path }
      let pathLocal = path
      const subSet = pathLocal.splice(0, closestPoint)
      subSet.shift()
      pathLocal = pathLocal.concat(subSet)
      pathLocal.unshift({
        type: 'M',
        p0: pathLocal[0].p0
      })
      pathLocal.push({
        type: 'M',
        p0: pathLocal[0].p0
      })

      return pathLocal
    }

    function mapper (sExe, dExe) {
      let nsExe
      let ndExe
      let maxLength = sExe.length > dExe.length ? sExe.length : (dExe.length)

      if (dExe.length > 2 && sExe.length > 2) {
        if (maxLength > 50) {
          maxLength += 30
        } else {
          maxLength = (maxLength >= 20 ? maxLength + 15 : maxLength + 4)
        }
        nsExe = normalizeCmds(sExe, maxLength)
        ndExe = normalizeCmds(dExe, maxLength)
      } else {
        nsExe = sExe
        ndExe = dExe
      }

      if (getDirection(nsExe) < 0) { nsExe = reverse(nsExe) }
      if (getDirection(ndExe) < 0) { ndExe = reverse(ndExe) }

      const res = getSrcBeginPoint(nsExe, ndExe, this)
      nsExe = res.src.length > 1 ? res.src : [{
        type: 'M',
        p0: res.destCentroid
      }]
      ndExe = res.dest.length > 1 ? res.dest : [{
        type: 'M',
        p0: res.srcCentroid
      }]

      const length = ndExe.length < nsExe.length ? nsExe.length : ndExe.length

      for (let i = 0; i < nsExe.length; i += 1) {
        nsExe[i].index = i
      }
      for (let i = 0; i < ndExe.length; i += 1) {
        ndExe[i].index = i
      }
      for (let i = 0; i < length; i += 1) {
        const sP0 = nsExe[nsExe.length - 1].p0 ? nsExe[nsExe.length - 1].p0
          : nsExe[nsExe.length - 1].p1
        const dP0 = ndExe[ndExe.length - 1].p0 ? ndExe[ndExe.length - 1].p0
          : ndExe[ndExe.length - 1].p1
        const sCmd = nsExe[i] ? nsExe[i] : {
          type: 'C',
          p0: sP0,
          p1: sP0,
          cntrl1: sP0,
          cntrl2: sP0,
          length: 0
        }
        const dCmd = ndExe[i] ? ndExe[i] : {
          type: 'C',
          p0: dP0,
          p1: dP0,
          cntrl1: dP0,
          cntrl2: dP0,
          length: 0
        } // ndExe[ndExe.length - 1]

        if (sCmd.type === 'M' && dCmd.type === 'M') {
          buildMTransitionobj(sCmd, dCmd)
        } else if (sCmd.type === 'M' || dCmd.type === 'M') {
          if (sCmd.type === 'M') {
            buildTransitionObj({
              type: 'C',
              p0: sCmd.p0,
              p1: sCmd.p0,
              cntrl1: sCmd.p0,
              cntrl2: sCmd.p0,
              length: 0
            }, dCmd)
          } else {
            buildTransitionObj(sCmd, {
              type: 'C',
              p0: dCmd.p0,
              p1: dCmd.p0,
              cntrl1: dCmd.p0,
              cntrl2: dCmd.p0,
              length: 0
            })
          }
        } else { buildTransitionObj(sCmd, dCmd) }
      }
    }

    queueInstance.add(animeId(), {
      run (f) {
        let ppath = new Path()
        for (let i = 0, len = chainInstance.length; i < len; i++) {
          chainInstance[i].run(ppath, f)
        }
        self.setAttr('d', ppath)
      },
      duration: duration,
      loop: loop,
      direction: direction
    }, easying(ease))
  }

  function isTypePath (pathInstance) {
    return pathInstance instanceof Path
  }

  return {
    instance: function (d) {
      return new Path(d)
    },
    isTypePath,
    animatePathTo,
    morphTo
  }
}))


/***/ }),

/***/ "./src/queue.js":
/*!**********************!*\
  !*** ./src/queue.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* eslint-disable no-undef */
;(function (root, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (() => factory()).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
  } else {}
}(this, () => {
  'use strict'
  let animatorInstance = null
  let tweens = []
  const vDoms = {}
  const vDomIds = []
  let animeFrameId

  let onFrameExe = []

  window.requestAnimationFrame = (function requestAnimationFrameG () {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function requestAnimationFrame (callback, element) {
        return window.setTimeout(callback, 1000 / 60)
      }
  })()
  window.cancelAnimFrame = (function cancelAnimFrameG () {
    return (
      window.cancelAnimationFrame ||
      window.webkitCancelAnimationFrame ||
      window.mozCancelAnimationFrame ||
      window.oCancelAnimationFrame ||
      window.msCancelAnimationFrame ||
      function cancelAnimFrame (id) {
        return window.clearTimeout(id)
      }
    )
  })()

  function Tween (Id, executable, easying) {
    this.executable = executable
    this.duration = executable.duration ? executable.duration : 0
    this.delay = executable.delay ? executable.delay : 0
    this.lastTime = 0 - (executable.delay ? executable.delay : 0)
    this.loopTracker = 0
    this.loop = executable.loop ? executable.loop : 0
    this.direction = executable.direction
    this.easying = easying
    this.end = executable.end ? executable.end : null

    if (this.direction === 'reverse') { this.factor = 1 } else { this.factor = 0 }
  }

  Tween.prototype.execute = function execute (f) {
    this.executable.run(f)
  }

  Tween.prototype.resetCallBack = function resetCallBack (_) {
    if (typeof _ !== 'function') return
    this.callBack = _
  }

  // function endExe (_) {
  //   this.endExe = _
  //   return this
  // }

  function onRequestFrame (_) {
    if (typeof _ !== 'function') {
      throw new Error('Wrong input')
    }
    onFrameExe.push(_)
    if (onFrameExe.length > 0 && !animeFrameId) {
      this.startAnimeFrames()
    }
  }
  function removeRequestFrameCall (_) {
    if (typeof _ !== 'function') {
      throw new Error('Wrong input')
    }
    let index = onFrameExe.indexOf(_)
    if (index !== -1) {
      onFrameExe.splice(index, 1)
    }
  }

  function add (uId, executable, easying) {
    let exeObj = new Tween(uId, executable, easying)
    exeObj.currTime = performance.now()
    tweens[tweens.length] = exeObj
    this.startAnimeFrames()
  }

  function startAnimeFrames () {
    if (!animeFrameId) {
      animeFrameId = window.requestAnimationFrame(exeFrameCaller)
    }
  }
  function stopAnimeFrame () {
    if (animeFrameId) {
      window.cancelAnimFrame(animeFrameId)
      animeFrameId = null
    }
  }

  function ExeQueue () {
  }

  ExeQueue.prototype = {
    startAnimeFrames,
    stopAnimeFrame,
    add,
    // remove: remove,
    // end: endExe,
    onRequestFrame,
    removeRequestFrameCall,
    clearAll () {
      tweens = []
      onFrameExe = []
      // if (this.endExe) { this.endExe() }
      // this.stopAnimeFrame()
    }
  }

  ExeQueue.prototype.addVdom = function AaddVdom (_) {
    let ind = vDomIds.length + 1
    vDoms[ind] = _
    vDomIds.push(ind)
    this.startAnimeFrames()
    return ind
  }
  ExeQueue.prototype.removeVdom = function removeVdom (_) {
    let index = vDomIds.indexOf(_)
    if (index !== -1) {
      vDomIds.splice(index, 1)
      vDoms[_].root.destroy()
      delete vDoms[_]
    }
    if (vDomIds.length === 0 && tweens.length === 0 && onFrameExe.length === 0) {
      this.stopAnimeFrame()
    }
  }
  ExeQueue.prototype.vDomChanged = function AvDomChanged (vDom) {
    if (vDoms[vDom] && vDoms[vDom].stateModified !== undefined) {
      vDoms[vDom].stateModified = true
    }
  }
  ExeQueue.prototype.execute = function Aexecute () {
    this.startAnimeFrames()
  }

  let d
  let t
  let abs = Math.abs
  let counter = 0
  let tweensN = []
  function exeFrameCaller () {
    try {
      tweensN = []
      counter = 0
      t = performance.now()
      for (let i = 0; i < tweens.length; i += 1) {
        d = tweens[i]
        d.lastTime += (t - d.currTime)
        d.currTime = t
        if (d.lastTime < d.duration && d.lastTime >= 0) {
          d.execute(abs(d.factor - d.easying(d.lastTime, d.duration)))
          tweensN[counter++] = d
        } else if (d.lastTime > d.duration) {
          loopCheck(d)
        } else {
          tweensN[counter++] = d
        }
      }
      tweens = tweensN
      if (onFrameExe.length > 0) {
        onFrameExeFun()
      }
      vDomUpdates()
    } catch (err) {
      console.error(err)
    } finally {
      animeFrameId = window.requestAnimationFrame(exeFrameCaller)
    }
  }

  function loopCheck (d) {
    if (d.loopTracker >= d.loop - 1) {
      d.execute(1 - d.factor)
      if (d.end) { d.end() }
    } else {
      d.loopTracker += 1
      d.lastTime = (d.lastTime - d.duration)
      if (d.direction === 'alternate') {
        d.factor = 1 - d.factor
      } else if (d.direction === 'reverse') {
        d.factor = 1
      } else {
        d.factor = 0
      }
      d.execute(abs(d.factor - d.easying(d.lastTime, d.duration)))
      tweensN[counter++] = d
    }
  }

  function onFrameExeFun () {
    for (let i = 0; i < onFrameExe.length; i += 1) {
      onFrameExe[i](t)
    }
  }

  function vDomUpdates () {
    for (let i = 0, len = vDomIds.length; i < len; i += 1) {
      if (vDomIds[i] && vDoms[vDomIds[i]] && vDoms[vDomIds[i]].stateModified) {
        vDoms[vDomIds[i]].execute()
        vDoms[vDomIds[i]].stateModified = false
      } else if (vDomIds[i] && vDoms[vDomIds[i]] && vDoms[vDomIds[i]].root) {
        var elementExists = document.getElementById(vDoms[vDomIds[i]].root.container.id)
        if (!elementExists) {
          animatorInstance.removeVdom(vDomIds[i])
        }
      }
    }
  }

  function animateQueue () {
    if (!animatorInstance) { animatorInstance = new ExeQueue() }
    return animatorInstance
  }

  return animateQueue
}))


/***/ }),

/***/ "./src/renderer.js":
/*!*************************!*\
  !*** ./src/renderer.js ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* eslint-disable no-undef */
;(function renderer (root, factory) {
  if ( true && module.exports) {
    module.exports = factory(__webpack_require__(/*! ./geometry.js */ "./src/geometry.js"), __webpack_require__(/*! ./queue.js */ "./src/queue.js"), __webpack_require__(/*! ./easing.js */ "./src/easing.js"), __webpack_require__(/*! ./chaining.js */ "./src/chaining.js"), __webpack_require__(/*! ./vDom.js */ "./src/vDom.js"), __webpack_require__(/*! ./colorMap.js */ "./src/colorMap.js"), __webpack_require__(/*! ./path.js */ "./src/path.js"), __webpack_require__(/*! ./shaders.js */ "./src/shaders.js"), __webpack_require__(/*! earcut */ "./node_modules/earcut/src/earcut.js"))
  } else if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! ./geometry.js */ "./src/geometry.js"), __webpack_require__(/*! ./queue.js */ "./src/queue.js"), __webpack_require__(/*! ./easing.js */ "./src/easing.js"), __webpack_require__(/*! ./chaining.js */ "./src/chaining.js"), __webpack_require__(/*! ./vDom.js */ "./src/vDom.js"), __webpack_require__(/*! ./colorMap.js */ "./src/colorMap.js"), __webpack_require__(/*! ./path.js */ "./src/path.js"), __webpack_require__(/*! ./shaders.js */ "./src/shaders.js"), __webpack_require__(/*! earcut */ "./node_modules/earcut/src/earcut.js")], __WEBPACK_AMD_DEFINE_RESULT__ = ((geometry, queue, easing, chain, vDom, colorMap, path, shaders, earcut) => factory(geometry, queue, easing, chain, vDom, colorMap, path, shaders, earcut)).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
  } else {}
}(this, (geometry, queue, ease, chain, VDom, colorMap, path, shaders, earcut) => {
  'use strict'
  const i2d = {}
  const t2DGeometry = geometry('2D')
  const easing = ease()
  const queueInstance = queue()
  let Id = 0
  let animeIdentifier = 0
  let ratio

  function domId () {
    Id += 1
    return Id
  }
  function animeId () {
    animeIdentifier += 1
    return animeIdentifier
  }

  function fetchEls (nodeSelector, dataArray) {
    let d
    const coll = []
    for (let i = 0; i < this.stack.length; i += 1) {
      d = this.stack[i]
      coll.push(d.fetchEls(nodeSelector, dataArray))
    }
    const collection = new CreateElements()
    collection.wrapper(coll)

    return collection
  }

  function cfetchEls (nodeSelector, dataArray) {
    const nodes = []
    const wrap = new CreateElements()
    if (this.children.length > 0) {
      if (nodeSelector.charAt(0) === '.') {
        const classToken = nodeSelector.substring(1, nodeSelector.length)
        this.children.forEach((d) => {
          if ((dataArray && d.dataObj && dataArray.indexOf(d.dataObj) !== -1 && d.attr.class === classToken) || (!dataArray && d.attr.class === classToken)) {
            nodes.push(d)
          }
        })
      } else if (nodeSelector.charAt(0) === '#') {
        const idToken = nodeSelector.substring(1, nodeSelector.length)
        this.children.every((d) => {
          if ((dataArray && d.dataObj && dataArray.indexOf(d.dataObj) !== -1 && d.attr.id === idToken) || (!dataArray && d.attr.id === idToken)) {
            nodes.push(d)
            return false
          }
          return true
        })
      } else {
        this.children.forEach((d) => {
          if ((dataArray && d.dataObj && dataArray.indexOf(d.dataObj) !== -1 && d.nodeName === nodeSelector) || (!dataArray && d.nodeName === nodeSelector)) {
            nodes.push(d)
          }
        })
      }
    }

    return wrap.wrapper(nodes)
  }

  function cfetchEl (nodeSelector, data) {
    let nodes
    if (this.children.length > 0) {
      if (nodeSelector.charAt(0) === '.') {
        const classToken = nodeSelector.substring(1, nodeSelector.length)
        this.children.every((d) => {
          if ((data && d.dataObj && data === d.dataObj && d.attr.class === classToken) || (!data && d.attr.class === classToken)) {
            nodes = d
            return false
          }
          return true
        })
      } else if (nodeSelector.charAt(0) === '#') {
        const idToken = nodeSelector.substring(1, nodeSelector.length)
        this.children.every((d) => {
          if ((data && d.dataObj && data === d.dataObj && d.attr.id === idToken) || (!data && d.attr.id === idToken)) {
            nodes = d
            return false
          }
          return true
        })
      } else {
        this.children.forEach((d) => {
          if ((data && d.dataObj && data === d.dataObj && d.nodeName === nodeSelector) || (!data && d.nodeName === nodeSelector)) {
            nodes = d
          }
        })
      }
    }

    return nodes
  }

  function join (data, el, arg) {
    let d
    const coll = []
    for (let i = 0; i < this.stack.length; i += 1) {
      d = this.stack[i]

      coll.push(d.join(data, el, arg))
    }
    const collection = new CreateElements()
    collection.wrapper(coll)

    return collection
  }

  function createEl (config) {
    let d
    const coll = []
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
      let cRes = {}
      d = this.stack[i]
      if (typeof config === 'function') {
        cRes = config.call(d, d.dataObj, i)
      } else {
        const keys = Object.keys(config)
        for (let j = 0, lenJ = keys.length; j < lenJ; j += 1) {
          const key = keys[j]
          if (typeof config[key] !== 'object') {
            cRes[key] = config[key]
          } else {
            cRes[key] = JSON.parse(JSON.stringify(config[key]))
          }
        }
      }
      coll.push(d.createEl(cRes))
    }
    const collection = new CreateElements()
    collection.wrapper(coll)

    return collection
  }

  function createEls (data, config) {
    let d
    const coll = []
    let res = data
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
      let cRes = {}
      d = this.stack[i]

      if (typeof data === 'function') {
        res = data.call(d, d.dataObj, i)
      }
      if (typeof config === 'function') {
        cRes = config.call(d, d.dataObj, i)
      } else {
        const keys = Object.keys(config)
        for (let j = 0, lenJ = keys.length; j < lenJ; j += 1) {
          const key = keys[j]
          cRes[key] = config[key]
        }
      }
      coll.push(d.createEls(res, cRes))
    }
    const collection = new CreateElements()
    collection.wrapper(coll)

    return collection
  }

  function forEach (callBck) {
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
      callBck.call(this.stack[i], this.stack[i].dataObj, i)
    }
    return this
  }

  function setAttribute (key, value) {
    let d
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
      d = this.stack[i]
      if (arguments.length > 1) {
        if (typeof value === 'function') {
          d.setAttr(key, value.call(d, d.dataObj, i))
        } else {
          d.setAttr(key, value)
        }
      } else if (typeof key === 'function') {
        d.setAttr(key.call(d, d.dataObj, i))
      } else {
        const keys = Object.keys(key)
        for (let j = 0, lenJ = keys.length; j < lenJ; j += 1) {
          const keykey = keys[j]
          if (typeof key[keykey] === 'function') {
            d.setAttr(keykey, key[keykey].call(d, d.dataObj, i))
          } else {
            d.setAttr(keykey, key[keykey])
          }
        }
      }
    }
    return this
  }
  function setStyle (key, value) {
    let d
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
      d = this.stack[i]
      if (arguments.length > 1) {
        if (typeof value === 'function') {
          d.setStyle(key, value.call(d, d.dataObj, i))
        } else {
          d.setStyle(key, value)
        }
      } else {
        if (typeof key === 'function') {
          d.setStyle(key.call(d, d.dataObj, i))
        } else {
          const keys = Object.keys(key)
          for (let j = 0, lenJ = keys.length; j < lenJ; j += 1) {
            const keykey = keys[j]
            if (typeof key[keykey] === 'function') {
              d.setStyle(keykey, key[keykey].call(d, d.dataObj, i))
            } else {
              d.setStyle(keykey, key[keykey])
            }
          }
        }

        if (typeof key === 'function') {
          d.setStyle(key.call(d, d.dataObj, i))
        } else {
          d.setStyle(key)
        }
      }
    }
    return this
  }
  function translate (value) {
    let d
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
      d = this.stack[i]
      if (typeof value === 'function') {
        d.translate(value.call(d, d.dataObj, i))
      } else {
        d.translate(value)
      }
    }
    return this
  }
  function rotate (value) {
    let d
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
      d = this.stack[i]
      if (typeof value === 'function') {
        d.rotate(value.call(d, d.dataObj, i))
      } else {
        d.rotate(value)
      }
    }
    return this
  }
  function scale (value) {
    let d
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
      d = this.stack[i]
      if (typeof value === 'function') {
        d.scale(value.call(d, d.dataObj, i))
      } else {
        d.scale(value)
      }
    }
    return this
  }

  function exec (value) {
    let d
    if (typeof value !== 'function') {
      return
    }
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
      d = this.stack[i]
      value.call(d, d.dataObj, i)
    }
    return this
  }
  function on (eventType, hndlr) {
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
      this.stack[i].on(eventType, hndlr)
    }
    return this
  }

  // function in (coOr) {
  //   for (let i = 0, len = this.stack.length; i < len; i += 1) {
  //     this.stack[i].in(coOr)
  //   }
  //   return this
  // }
  function remove () {
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
      this.stack[i].remove()
    }
    return this
  }

  function addListener (eventType, hndlr) {
    this[eventType] = hndlr
  }

  function performJoin (data, nodes, cond) {
    const dataIds = data.map(cond)
    const res = {
      new: [],
      update: [],
      old: []
    }
    for (let i = 0; i < nodes.length; i += 1) {
      const index = dataIds.indexOf(cond(nodes[i].dataObj, i))
      if (index !== -1) {
        nodes[i].dataObj = data[index]
        res.update.push(nodes[i])
        dataIds[index] = null
      } else {
        // nodes[i].dataObj = data[index]
        res.old.push(nodes[i])
      }
    }
    res.new = data.filter((d, i) => {
      const index = dataIds.indexOf(cond(d, i))
      if (index !== -1) {
        dataIds[index] = null
        return true
      } return false
    })
    return res
  }

  let CompositeArray = {}
  CompositeArray.push = {
    value: function (data) {
      if (Object.prototype.toString.call(data) !== '[object Array]') {
        data = [data]
      }
      for (let i = 0, len = data.length; i < len; i++) {
        this.data.push(data[i])
      }
      if (this.config.action.enter) {
        let nodes = {}
        this.selector.split(',').forEach(function (d) {
          nodes[d] = data
        })
        this.config.action.enter.call(this, nodes)
      }
    },
    enumerable: false,
    configurable: false,
    writable: false
  }
  CompositeArray.pop = {
    value: function () {
      let self = this
      let elData = this.data.pop()
      if (this.config.action.exit) {
        let nodes = {}
        this.selector.split(',').forEach(function (d) {
          nodes[d] = self.fetchEls(d, [elData])
        })
        this.config.action.exit.call(this, nodes)
      }
    },
    enumerable: false,
    configurable: false,
    writable: false
  }
  CompositeArray.remove = {
    value: function (data) {
      if (Object.prototype.toString.call(data) !== '[object Array]') {
        data = [data]
      }
      let self = this
      for (let i = 0, len = data.length; i < len; i++) {
        if (this.data.indexOf(data[i]) !== -1) {
          this.data.splice(this.data.indexOf(data[i]), 1)
        }
      }
      if (this.config.action.exit) {
        let nodes = {}
        this.selector.split(',').forEach(function (d) {
          nodes[d] = self.fetchEls(d, data)
        })
        this.config.action.exit.call(this, nodes)
      }
    },
    enumerable: false,
    configurable: true,
    writable: false
  }
  CompositeArray.update = {
    value: function () {
      let self = this
      if (this.config.action.update) {
        let nodes = {}
        this.selector.split(',').forEach(function (d) {
          nodes[d] = self.fetchEls(d, self.data)
        })
        this.config.action.update.call(this, nodes)
      }
    },
    enumerable: false,
    configurable: true,
    writable: false
  }
  CompositeArray.join = {
    value: function (data) {
      dataJoin.call(this, data, this.selector, this.config)
    },
    enumerable: false,
    configurable: true,
    writable: false
  }

  function dataJoin (data, selector, config) {
    const self = this
    const selectors = selector.split(',')
    let { joinOn } = config
    let joinResult = {
      new: {},
      update: {},
      old: {}
    }
    if (!joinOn) { joinOn = function (d, i) { return i } }
    for (let i = 0, len = selectors.length; i < len; i++) {
      let d = selectors[i]
      const nodes = self.fetchEls(d)
      const join = performJoin(data, nodes.stack, joinOn)
      joinResult.new[d] = join.new
      joinResult.update[d] = (new CreateElements()).wrapper(join.update)
      joinResult.old[d] = (new CreateElements()).wrapper(join.old)
    }

    if (config.action) {
      if (config.action.enter) {
        config.action.enter.call(self, joinResult.new)
      }
      if (config.action.exit) {
        config.action.exit.call(self, joinResult.old)
      }
      if (config.action.update) {
        config.action.update.call(self, joinResult.update)
      }
    }
    // this.joinOn = joinOn
    CompositeArray.config = {
      value: config,
      enumerable: false,
      configurable: true,
      writable: true
    }
    CompositeArray.selector = {
      value: selector,
      enumerable: false,
      configurable: true,
      writable: false
    }
    CompositeArray.data = {
      value: data,
      enumerable: false,
      configurable: true,
      writable: true
    }
    return Object.create(self, CompositeArray)
  }

  const animate = function animate (self, targetConfig) {
    const tattr = targetConfig.attr ? targetConfig.attr : {}
    const tstyles = targetConfig.style ? targetConfig.style : {}
    const runStack = []
    let value

    if (typeof tattr !== 'function') {
      for (let key in tattr) {
        if (key !== 'transform') {
          let value = tattr[key]
          if (typeof value === 'function') {
            runStack[runStack.length] = function setAttr_ (f) {
              self.setAttr(key, value.call(self, f))
            }
          } else {
            if (key === 'd') {
              self.morphTo(targetConfig)
            } else {
              runStack[runStack.length] = attrTransition(self, key, tattr[key])
            }
          }
        } else {
          value = tattr[key]
          if (typeof value === 'function') {
            runStack[runStack.length] = transitionSetAttr(self, key, value)
          } else {
            const trans = self.attr.transform
            if (!trans) {
              self.attr.transform = {}
            }
            const subTrnsKeys = Object.keys(tattr.transform)
            for (let j = 0, jLen = subTrnsKeys.length; j < jLen; j += 1) {
              runStack[runStack.length] = transformTransition(
                self,
                subTrnsKeys[j],
                tattr.transform[subTrnsKeys[j]]
              )
            }
          }
        }
      }
    } else {
      runStack[runStack.length] = tattr.bind(self)
    }

    if (typeof tstyles !== 'function') {
      for (let style in tstyles) {
        runStack[runStack.length] = styleTransition(self, style, tstyles[style])
      }
    } else {
      runStack[runStack.length] = tstyles.bind(self)
    }

    return {
      run (f) {
        for (let j = 0, len = runStack.length; j < len; j += 1) {
          runStack[j](f)
        }
      },
      duration: targetConfig.duration,
      delay: targetConfig.delay ? targetConfig.delay : 0,
      end: targetConfig.end ? targetConfig.end.bind(self, self.dataObj) : null,
      loop: targetConfig.loop ? targetConfig.loop : 0,
      direction: targetConfig.direction ? targetConfig.direction : 'default',
      ease: targetConfig.ease ? targetConfig.ease : 'default'
    }
  }

  let transitionSetAttr = function transitionSetAttr (self, key, value) {
    return function inner (f) {
      self.setAttr(key, value.call(self, f))
    }
  }

  let transformTransition = function transformTransition (self, subkey, value) {
    const exe = []
    const trans = self.attr.transform
    if (typeof value === 'function') {
      return function inner (f) {
        self[subkey](value.call(self, f))
      }
    }
    value.forEach((tV, i) => {
      let val
      if (trans[subkey]) {
        if (trans[subkey][i] !== undefined) {
          val = trans[subkey][i]
        } else {
          val = (subkey === 'scale' ? 1 : 0)
        }
      } else {
        val = (subkey === 'scale' ? 1 : 0)
      }
      exe.push(t2DGeometry.intermediateValue.bind(
        null,
        val,
        tV
      ))
    })

    return function inner (f) {
      self[subkey](exe.map(d => d(f)))
    }
  }

  let attrTransition = function attrTransition (self, key, value) {
    let srcVal = self.attr[key]
    // if (typeof value === 'function') {
    //   return function setAttr_ (f) {
    //     self.setAttr(key, value.call(self, f))
    //   }
    // }
    return function setAttr_ (f) {
      self.setAttr(key, t2DGeometry.intermediateValue(srcVal, value, f))
    }
  }

  let styleTransition = function styleTransition (self, key, value) {
    let srcValue
    let destUnit
    let destValue
    if (typeof value === 'function') {
      return function inner (f) {
        self.setStyle(key, value.call(self, self.dataObj, f))
      }
    } else {
      srcValue = self.style[key]
      if (isNaN(value)) {
        if (colorMap.isTypeColor(value)) {
          const colorExe = self instanceof WebglNodeExe ? colorMap.transitionObj(srcValue, value) : colorMap.transition(srcValue, value)
          return function inner (f) {
            self.setStyle(key, colorExe(f))
          }
        }
        srcValue = srcValue.match(/(\d+)/g)
        destValue = value.match(/(\d+)/g)
        destUnit = value.match(/\D+$/)

        srcValue = parseInt(srcValue.length > 0 ? srcValue[0] : 0, 10)
        destValue = parseInt(destValue.length > 0 ? destValue[0] : 0, 10)
        destUnit = destUnit.length > 0 ? destUnit[0] : 'px'
      } else {
        srcValue = (self.style[key] !== undefined ? self.style[key] : 1)
        destValue = value
        destUnit = 0
      }
      return function inner (f) {
        self.setStyle(key, t2DGeometry.intermediateValue(srcValue, destValue, f) + destUnit)
      }
    }
  }

  const animateTo = function animateTo (targetConfig) {
    queueInstance.add(animeId(), animate(this, targetConfig), easing(targetConfig.ease))
    return this
  }

  const animateExe = function animateExe (targetConfig) {
    return animate(this, targetConfig)
  }

  function resolveObject (config, node, i) {
    let obj = {}
    let key
    for (key in config) {
      if (key !== 'end') {
        if (typeof config[key] === 'function') {
          obj[key] = config[key].call(node, node.dataObj, i)
        } else {
          obj[key] = config[key]
        }
      }
    }
    return obj
  }

  const animateArrayTo = function animateArrayTo (config) {
    let node
    let newConfig

    for (let i = 0; i < this.stack.length; i += 1) {
      newConfig = {}
      node = this.stack[i]

      newConfig = resolveObject(config, node, i)
      if (config.attr && typeof config.attr !== 'function') { newConfig.attr = resolveObject(config.attr, node, i) }
      if (config.style && typeof config.style !== 'function') { newConfig.style = resolveObject(config.style, node, i) }
      if (config.end) { newConfig.end = config.end }
      if (config.ease) { newConfig.ease = config.ease }

      node.animateTo(newConfig)
    }
    return this
  }
  const animateArrayExe = function animateArrayExe (config) {
    let node
    let newConfig
    let exeArray = []

    for (let i = 0; i < this.stack.length; i += 1) {
      newConfig = {}
      node = this.stack[i]

      newConfig = resolveObject(config, node, i)
      if (config.attr && typeof config.attr !== 'function') { newConfig.attr = resolveObject(config.attr, node, i) }
      if (config.style && typeof config.style !== 'function') { newConfig.style = resolveObject(config.style, node, i) }
      if (config.end) { newConfig.end = config.end }
      if (config.ease) { newConfig.ease = config.ease }

      exeArray.push(node.animateExe(newConfig))
    }
    return exeArray
  }

  const animatePathArrayTo = function animatePathArrayTo (config) {
    let node
    let keys = Object.keys(config)
    for (let i = 0, len = this.stack.length; i < len; i += 1) {
      node = this.stack[i]
      let conf = {}
      for (let j = 0; j < keys.length; j++) {
        let value = config[keys[j]]
        if (typeof value === 'function') {
          value = value.call(node, node.dataObj, i)
        }
        conf[keys[j]] = value
      }
      node.animatePathTo(conf)
    }

    return this
  }

  const textArray = function textArray (value) {
    let node
    if (typeof value !== 'function') {
      for (let i = 0; i < this.stack.length; i += 1) {
        node = this.stack[i]
        node.text(value)
      }
    } else {
      for (let i = 0; i < this.stack.length; i += 1) {
        node = this.stack[i]
        node.text(value.call(node, node.dataObj, i))
      }
    }
    return this
  }

  // function DomPattern (self, pattern, repeatInd) {
  // }
  // DomPattern.prototype.exe = function () {
  //   return this.pattern
  // }

  // function createDomPattern (url, config) {
  //   // new DomPattern(this, patternObj, repeatInd)
  //   let patternEl = this.createEl({
  //     el: 'pattern'
  //   })
  //   patternEl.createEl({
  //     el: 'image',
  //     attr: {
  //       'xlink:href': url
  //     }
  //   })
  // }

  function DomGradients (config, type, pDom) {
    this.config = config
    this.type = type || 'linear'
    this.pDom = pDom
  }
  DomGradients.prototype.exe = function exe () {
    return `url(#${this.config.id})`
  }
  DomGradients.prototype.linearGradient = function linearGradient () {
    const self = this

    if (!this.defs) { this.defs = this.pDom.createEl({ el: 'defs' }) }

    this.linearEl = this.defs.join([1], 'linearGradient', {
      action: {
        enter (data) {
          this.createEls(data.linearGradient, {
            el: 'linearGradient'
          })
            .setAttr({
              id: self.config.id,
              x1: `${self.config.x1}%`,
              y1: `${self.config.y1}%`,
              x2: `${self.config.x2}%`,
              y2: `${self.config.y2}%`
            })
        },
        exit (oldNodes) {
          oldNodes.linearGradient.remove()
        },
        update (nodes) {
          nodes.linearGradient.setAttr({
            id: self.config.id,
            x1: `${self.config.x1}%`,
            y1: `${self.config.y1}%`,
            x2: `${self.config.x2}%`,
            y2: `${self.config.y2}%`
          })
        }
      }
    })
    this.linearEl = this.linearEl.fetchEl('linearGradient')

    this.linearEl.fetchEls('stop').remove()

    this.linearEl.createEls(this.config.colorStops, {
      el: 'stop',
      attr: {
        offset (d, i) { return `${d.value}%` },
        'stop-color': function stopColor (d, i) { return d.color }
      }
    })

    return this
  }

  DomGradients.prototype.radialGradient = function radialGradient () {
    const self = this

    if (!this.defs) { this.defs = this.pDom.createEl({ el: 'defs' }) }

    this.radialEl = this.defs.join([1], 'radialGradient', {
      action: {
        enter (data) {
          this.createEls(data.radialGradient, {
            el: 'radialGradient'
          }).setAttr({
            id: self.config.id,
            cx: `${self.config.innerCircle.x}%`,
            cy: `${self.config.innerCircle.y}%`,
            r: `${self.config.outerCircle.r}%`,
            fx: `${self.config.outerCircle.x}%`,
            fy: `${self.config.outerCircle.y}%`
          })
        },
        exit (oldNodes) {
          oldNodes.radialGradient.remove()
        },
        update (nodes) {
          nodes.radialGradient.setAttr({
            id: self.config.id,
            cx: `${self.config.innerCircle.x}%`,
            cy: `${self.config.innerCircle.y}%`,
            r: `${self.config.outerCircle.r}%`,
            fx: `${self.config.outerCircle.x}%`,
            fy: `${self.config.outerCircle.y}%`
          })
        }
      }
    })

    this.radialEl = this.radialEl.fetchEl('radialGradient')

    this.radialEl.fetchEls('stop').remove()

    this.radialEl.createEls(this.config.colorStops, {
      el: 'stop',
      attr: {
        offset (d, i) { return `${d.value}%` },
        'stop-color': function stopColor (d, i) { return d.color }
      }
    })

    return this
  }
  DomGradients.prototype.colorStops = function colorStops (colorSts) {
    if (Object.prototype.toString.call(colorSts) !== '[object Array]') {
      return false
    }

    this.config.colorStops = colorSts

    if (this.type === 'linear') {
      return this.linearGradient()
    } else if (this.type === 'radial') {
      return this.radialGradient()
    }
    return false
  }

  const nameSpace = {
    svg: 'http://www.w3.org/2000/svg',
    xlink: 'http://www.w3.org/1999/xlink',
    xhtml: 'http://www.w3.org/1999/xhtml'
  }

  const buildDom = function buildSVGElement (ele) {
    return document.createElementNS(nameSpace.svg, ele)
  }

  const DomExe = function DomExe (dom, config, id, vDomIndex) {
    this.dom = dom
    this.nodeName = dom.nodeName
    this.attr = {}
    this.style = {}
    this.changedAttribute = {}
    this.changedStyles = {}
    this.id = id
    this.nodeType = 'svg'
    this.dom.nodeId = id
    this.children = []
    this.vDomIndex = vDomIndex

    if (config.style) { this.setStyle(config.style) }
    if (config.attr) { this.setAttr(config.attr) }
  }
  DomExe.prototype.node = function node () {
    this.execute()
    return this.dom
  }

  function updateAttrsToDom (self, key) {
    let ind = key.indexOf(':')
    let value = self.changedAttribute[key]
    if (ind >= 0) {
      self.dom.setAttributeNS(nameSpace[key.slice(0, ind)], key.slice(ind + 1), value)
    } else {
      if (key === 'text') {
        self.dom.textContent = value
      } else if (key === 'd') {
        if (path.isTypePath(value)) {
          self.dom.setAttribute(key, value.fetchPathString())
        } else {
          self.dom.setAttribute(key, value)
        }
      } else {
        if (key === 'onerror' || key === 'onload') {
          self.dom[key] = function fun (e) {
            value.call(self, e)
          }
        } else {
          self.dom.setAttribute(key, value)
        }
      }
    }
  }

  function updateTransAttrsToDom (self) {
    let cmd = ''
    for (let trnX in self.attr.transform) {
      if (trnX === 'rotate') {
        cmd += `${trnX}(${self.attr.transform.rotate[0] + ' ' + (self.attr.transform.rotate[1] || 0) + ' ' + (self.attr.transform.rotate[2] || 0)}) `
      } else {
        cmd += `${trnX}(${self.attr.transform[trnX].join(' ')}) `
      }
    }
    self.dom.setAttribute('transform', cmd)
  }

  DomExe.prototype.transFormAttributes = function transFormAttributes () {
    let self = this
    for (let key in self.changedAttribute) {
      if (key !== 'transform') {
        updateAttrsToDom(self, key)
      } else {
        updateTransAttrsToDom(self)
      }
    }
    this.changedAttribute = {}
  }
  DomExe.prototype.scale = function DMscale (XY) {
    if (!this.attr.transform) { this.attr.transform = {} }
    this.attr.transform.scale = XY
    this.changedAttribute.transform = this.attr.transform
    this.attrChanged = true
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  DomExe.prototype.skewX = function DMskewX (x) {
    if (!this.attr.transform) { this.attr.transform = {} }
    this.attr.transform.skewX = [x]
    this.changedAttribute.transform = this.attr.transform
    this.attrChanged = true
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  DomExe.prototype.skewY = function DMskewY (y) {
    if (!this.attr.transform) { this.attr.transform = {} }
    this.attr.transform.skewY = [y]
    this.changedAttribute.transform = this.attr.transform
    this.attrChanged = true
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }

  DomExe.prototype.translate = function DMtranslate (XY) {
    if (!this.attr.transform) { this.attr.transform = {} }
    this.attr.transform.translate = XY
    this.changedAttribute.transform = this.attr.transform
    this.attrChanged = true
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  DomExe.prototype.rotate = function DMrotate (angle, x, y) {
    if (!this.attr.transform) { this.attr.transform = {} }
    if (Object.prototype.toString.call(angle) === '[object Array]' && angle.length > 0) {
      this.attr.transform.rotate = [angle[0] || 0, angle[1] || 0, angle[2] || 0]
    } else {
      this.attr.transform.rotate = [angle, x || 0, y || 0]
    }
    this.changedAttribute.transform = this.attr.transform
    this.attrChanged = true
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  DomExe.prototype.setStyle = function DMsetStyle (attr, value) {
    if (arguments.length === 2) {
      if (typeof value === 'function') {
        value = value.call(this, this.dataObj)
      }
      this.style[attr] = value
      this.changedStyles[attr] = value
    } else if (arguments.length === 1 && typeof attr === 'object') {
      let key
      for (key in attr) {
        this.style[key] = attr[key]
        this.changedStyles[key] = attr[key]
      }
    }

    this.styleChanged = true
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  function pointsToString (points) {
    if (Object.prototype.toString.call(points) !== '[object Array]') {
      return
    }
    return points.reduce(function (p, c) {
      return p + c.x + ',' + c.y + ' '
    }, '')
  }
  DomExe.prototype.setAttr = function DMsetAttr (attr, value) {
    if (arguments.length === 2) {
      if (attr === 'points') {
        value = pointsToString(value)
      }
      this.attr[attr] = value
      this.changedAttribute[attr] = value
    } else if (arguments.length === 1 && typeof attr === 'object') {
      for (let key in attr) {
        if (key === 'points') {
          attr[key] = pointsToString(attr[key])
        }
        this.attr[key] = attr[key]
        this.changedAttribute[key] = attr[key]
      }
    }
    this.attrChanged = true
    queueInstance.vDomChanged(this.vDomIndex)

    return this
  }
  DomExe.prototype.getAttr = function DMgetAttribute (_) {
    return this.attr[_]
  }
  DomExe.prototype.getStyle = function DMgetStyle (_) {
    return this.style[_]
  }
  DomExe.prototype.execute = function DMexecute () {
    if (!this.styleChanged && !this.attrChanged) {
      for (let i = 0, len = this.children.length; i < len; i += 1) {
        this.children[i].execute()
      }
      return
    }
    this.transFormAttributes()

    for (let i = 0, len = this.children.length; i < len; i += 1) {
      this.children[i].execute()
    }

    for (let style in this.changedStyles) {
      if (this.changedStyles[style] instanceof DomGradients) {
        this.changedStyles[style] = this.changedStyles[style].exe()
      }
      this.dom.style.setProperty(style, this.changedStyles[style], '')
    }

    this.changedStyles = {}
  }
  DomExe.prototype.child = function DMchild (nodes) {
    const parent = this.dom
    const self = this
    if (nodes instanceof CreateElements) {
      var fragment = document.createDocumentFragment()
      for (let i = 0, len = nodes.stack.length; i < len; i++) {
        fragment.appendChild(nodes.stack[i].dom)
        nodes.stack[i].parentNode = self
        this.children[this.children.length] = nodes.stack[i]
      }
      parent.appendChild(fragment)
    } else if (nodes instanceof DomExe) {
      parent.appendChild(nodes.dom)
      nodes.parentNode = self
      this.children.push(nodes)
    } else {
      console.log('wrong node type')
    }

    return this
  }
  DomExe.prototype.fetchEl = cfetchEl
  DomExe.prototype.fetchEls = cfetchEls
  DomExe.prototype.animateTo = animateTo
  DomExe.prototype.animateExe = animateExe
  DomExe.prototype.animatePathTo = path.animatePathTo
  DomExe.prototype.morphTo = path.morphTo

  DomExe.prototype.exec = function Cexe (exe) {
    if (typeof exe !== 'function') {
      console.error('Wrong Exe type')
    }
    exe.call(this, this.dataObj)
    return this
  }

  DomExe.prototype.createRadialGradient = function DMcreateRadialGradient (config) {
    const gradientIns = new DomGradients(config, 'radial', this)
    gradientIns.radialGradient()
    return gradientIns
  }
  DomExe.prototype.createLinearGradient = function DMcreateLinearGradient (config) {
    const gradientIns = new DomGradients(config, 'linear', this)
    gradientIns.linearGradient()
    return gradientIns
  }

  DomExe.prototype.join = dataJoin

  DomExe.prototype.on = function DMon (eventType, hndlr) {
    const self = this
    if (eventType === 'drag') {
      this.drag = hndlr
      if (!hndlr) {
        dragStack.splice(dragStack.indexOf(self), 1)
      } else {
        dragStack.push(self)
      }
    } else {
      const hnd = hndlr.bind(this)
      this.dom.addEventListener(eventType, (event) => {
        hnd(self.dataObj, event)
      })
    }
    return this
  }

  DomExe.prototype.html = function DMhtml (value) {
    if (!arguments.length) { return this.dom.innerHTML }
    this.dom.innerHTML(value)
    return this
  }
  DomExe.prototype.text = function DMtext (value) {
    if (!arguments.length) { return this.attr.text }
    this.attr['text'] = value
    this.changedAttribute['text'] = value
    return this
  }

  DomExe.prototype.remove = function DMremove () {
    this.parentNode.removeChild(this)
  }
  DomExe.prototype.createEls = function DMcreateEls (data, config) {
    const e = new CreateElements({ type: 'SVG' }, data, config, this.vDomIndex)
    this.child(e)
    queueInstance.vDomChanged(this.vDomIndex)
    return e
  }
  DomExe.prototype.createEl = function DMcreateEl (config) {
    const e = createDomElement(config, this.vDomIndex)
    this.child(e)
    queueInstance.vDomChanged(this.vDomIndex)
    return e
  }
  DomExe.prototype.removeChild = function DMremoveChild (obj) {
    const { children } = this
    const index = children.indexOf(obj)
    if (index !== -1) {
      this.dom.removeChild(children.splice(index, 1)[0].dom)
    }
  }

  function createDomElement (obj, vDomIndex) {
    let dom = null

    switch (obj.el) {
      case 'group':
        dom = buildDom('g')
        break
      default:
        dom = buildDom(obj.el)
        break
    }

    const node = new DomExe(dom, obj, domId(), vDomIndex)
    if (obj.dataObj) { dom.dataObj = obj.dataObj }
    return node
  }

  function cRender (attr) {
    const self = this

    if (attr.transform) {
      const { transform } = attr
      const hozScale = transform.scale && transform.scale.length > 0 ? transform.scale[0] : 1
      const verScale = transform.scale && transform.scale.length > 1
        ? transform.scale[1] : hozScale || 1
      const hozSkew = transform.skewX ? transform.skewX[0] : 0
      const verSkew = transform.skewY ? transform.skewY[0] : 0
      const hozMove = transform.translate && transform.translate.length > 0
        ? transform.translate[0] : 0
      const verMove = transform.translate && transform.translate.length > 1
        ? transform.translate[1] : hozMove || 0

      self.ctx.transform(hozScale, hozSkew, verSkew, verScale, hozMove, verMove)
      if (transform.rotate) {
        self.ctx.translate(transform.rotate[1] || 0, transform.rotate[2] || 0)
        self.ctx.rotate(transform.rotate[0] * (Math.PI / 180))
        self.ctx.translate(-transform.rotate[1] || 0, -transform.rotate[2] || 0)
      }
    }
    for (let i = 0; i < self.stack.length; i += 1) {
      self.stack[i].execute()
    }
  }

  function RPolyupdateBBox () {
    const self = this
    let translateX = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    const { transform } = self.attr
    if (self.attr.points && self.attr.points.length > 0) {
      let points = self.attr.points

      if (transform && transform.translate) {
        [translateX, translateY] = transform.translate
      }
      if (transform && transform.scale) {
        [scaleX, scaleY] = transform.scale
      }
      let minX = points[0].x
      let maxX = points[0].x
      let minY = points[0].y
      let maxY = points[0].y

      for (let i = 1; i < points.length; i += 1) {
        if (minX > points[i].x) minX = points[i].x
        if (maxX < points[i].x) maxX = points[i].x
        if (minY > points[i].y) minY = points[i].y
        if (maxY < points[i].y) maxY = points[i].y
      }

      self.BBox = {
        x: (translateX + minX * scaleX),
        y: (translateY + minY * scaleY),
        width: (maxX - minX) * scaleX,
        height: (maxY - minY) * scaleY
      }
    } else {
      self.BBox = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
    }

    if (transform && transform.rotate) {
      self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform)
    } else {
      self.BBoxHit = this.BBox
    }
  }

  function domSetAttribute (attr, value) {
    if (value !== undefined) {
      this.attr[attr] = value
    } else {
      delete this.attr[attr]
    }
  }

  function domSetStyle (attr, value) {
    if (value !== undefined) {
      this.style[attr] = value
    } else {
      delete this.style[attr]
    }
  }

  function CanvasGradients (config, type) {
    this.config = config
    this.type = type || 'linear'
    this.mode = (!this.config.mode || this.config.mode === 'percent') ? 'percent' : 'absolute'
  }
  CanvasGradients.prototype.exe = function GRAexe (ctx, BBox) {
    if (this.type === 'linear' && this.mode === 'percent') {
      return this.linearGradient(ctx, BBox)
    } if (this.type === 'linear' && this.mode === 'absolute') {
      return this.absoluteLinearGradient(ctx)
    } else if (this.type === 'radial' && this.mode === 'percent') {
      return this.radialGradient(ctx, BBox)
    } else if (this.type === 'radial' && this.mode === 'absolute') {
      return this.absoluteRadialGradient(ctx)
    }
    console.error('wrong Gradiant type')
  }
  CanvasGradients.prototype.linearGradient = function GralinearGradient (ctx, BBox) {
    const lGradient = ctx.createLinearGradient(
      BBox.x + BBox.width * (this.config.x1 / 100), BBox.y + BBox.height * (this.config.y1 / 100),
      BBox.x + BBox.width * (this.config.x2 / 100), BBox.y + BBox.height * (this.config.y2 / 100)
    )

    this.config.colorStops.forEach((d) => {
      lGradient.addColorStop((d.value / 100), d.color)
    })

    return lGradient
  }
  CanvasGradients.prototype.absoluteLinearGradient = function absoluteGralinearGradient (ctx) {
    const lGradient = ctx.createLinearGradient(
      this.config.x1, this.config.y1,
      this.config.x2, this.config.y2
    )

    this.config.colorStops.forEach((d) => {
      lGradient.addColorStop(d.value, d.color)
    })

    return lGradient
  }
  CanvasGradients.prototype.radialGradient = function GRAradialGradient (ctx, BBox) {
    const cGradient = ctx.createRadialGradient(
      BBox.x + BBox.width * (this.config.innerCircle.x / 100),
      BBox.y + BBox.height * (this.config.innerCircle.y / 100),
      BBox.width > BBox.height ? BBox.width * this.config.innerCircle.r / 100
        : BBox.height * this.config.innerCircle.r / 100,
      BBox.x + BBox.width * (this.config.outerCircle.x / 100),
      BBox.y + BBox.height * (this.config.outerCircle.y / 100),
      BBox.width > BBox.height ? BBox.width * this.config.outerCircle.r / 100
        : BBox.height * this.config.outerCircle.r / 100
    )

    this.config.colorStops.forEach((d) => {
      cGradient.addColorStop((d.value / 100), d.color)
    })

    return cGradient
  }
  CanvasGradients.prototype.absoluteRadialGradient = function absoluteGraradialGradient (ctx, BBox) {
    const cGradient = ctx.createRadialGradient(
      this.config.innerCircle.x,
      this.config.innerCircle.y,
      this.config.innerCircle.r,
      this.config.outerCircle.x,
      this.config.outerCircle.y,
      this.config.outerCircle.r
    )

    this.config.colorStops.forEach((d) => {
      cGradient.addColorStop((d.value / 100), d.color)
    })

    return cGradient
  }
  CanvasGradients.prototype.colorStops = function GRAcolorStops (colorStopValues) {
    if (Object.prototype.toString.call(colorStopValues) !== '[object Array]') {
      return false
    }
    this.config.colorStops = colorStopValues
    return this
  }

  function createLinearGradient (config) {
    return new CanvasGradients(config, 'linear')
  }

  function createRadialGradient (config) {
    return new CanvasGradients(config, 'radial')
  }

  function pixelObject (data, width, height, x, y) {
    this.pixels = data
    this.width = width
    this.height = height
    this.x = x
    this.y = y
  }
  pixelObject.prototype.get = function (pos) {
    let rIndex = ((pos.y - 1) * (this.width * 4)) + ((pos.x - 1) * 4)
    return 'rgba(' + this.pixels[rIndex] + ', ' + this.pixels[rIndex + 1] + ', ' + this.pixels[rIndex + 2] + ', ' + this.pixels[rIndex + 3] + ')'
  }
  pixelObject.prototype.put = function (color, pos) {
    let rIndex = ((pos.y - 1) * (this.width * 4)) + ((pos.x - 1) * 4)
    this.pixels[rIndex] = color[0]
    this.pixels[rIndex + 1] = color[1]
    this.pixels[rIndex + 2] = color[2]
    this.pixels[rIndex + 3] = color[3]
    return this
  }

  function pixels (pixHndlr) {
    const tObj = this.rImageObj ? this.rImageObj : this.imageObj
    const tCxt = tObj.getContext('2d')
    const pixelData = tCxt.getImageData(0, 0, this.attr.width, this.attr.height)
    return pixHndlr(pixelData)
  }

  function getCanvasImgInstance (width, height) {
    const canvas = document.createElement('canvas')
    canvas.setAttribute('height', height)
    canvas.setAttribute('width', width)
    canvas.style.height = `${height}px`
    canvas.style.width = `${width}px`
    return canvas
  }

  function CanvasPattern (self, pattern, repeatInd) {
    var image = new Image()
    var selfSelf = this
    image.src = pattern
    image.onload = function () {
      selfSelf.pattern = self.ctx.createPattern(image, repeatInd)
      queueInstance.vDomChanged(self.vDomIndex)
    }
  }
  CanvasPattern.prototype.exe = function () {
    return this.pattern
  }

  function createCanvasPattern (patternObj, repeatInd) {
    return new CanvasPattern(this, patternObj, repeatInd)
  }

  function applyStyles () {
    if (this.ctx.fillStyle !== '#000000') { this.ctx.fill() }
    if (this.ctx.strokeStyle !== '#000000') { this.ctx.stroke() }
  }

  function CanvasDom () {
    this.BBox = { x: 0, y: 0, width: 0, height: 0 }
    this.BBoxHit = { x: 0, y: 0, width: 0, height: 0 }
  }
  CanvasDom.prototype = {
    render: cRender,
    on: addListener,
    setAttr: domSetAttribute,
    setStyle: domSetStyle,
    applyStyles
  }

  const imageDataMap = {}

  function RenderImage (ctx, props, stylesProps, onloadExe, onerrorExe, nodeExe) {
    const self = this
    self.ctx = ctx
    self.attr = props
    self.style = stylesProps
    self.nodeName = 'Image'
    self.image = new Image()
    // self.image.crossOrigin="anonymous"
    // self.image.setAttribute('crossOrigin', '*')

    self.image.onload = function onload () {
      this.crossOrigin = 'anonymous'
      self.attr.height = self.attr.height ? self.attr.height : this.height
      self.attr.width = self.attr.width ? self.attr.width : this.width
      if (imageDataMap[self.attr.src]) {
        self.imageObj = imageDataMap[self.attr.src]
      } else {
        const im = getCanvasImgInstance(this.width, this.height)
        const ctxX = im.getContext('2d')
        ctxX.drawImage(this, 0, 0, this.width, this.height)

        self.imageObj = im
        imageDataMap[self.attr.src] = im
      }
      if (self.attr.clip) {
        let ctxX
        const { clip, width, height } = self.attr
        let { sx, sy, swidth, sheight } = clip
        if (!this.rImageObj) {
          self.rImageObj = getCanvasImgInstance(self.attr.width, self.attr.height)
        }
        ctxX = self.rImageObj.getContext('2d')

        sx = sx !== undefined ? sx : 0
        sy = sy !== undefined ? sy : 0
        swidth = swidth !== undefined ? swidth : width
        sheight = sheight !== undefined ? sheight : height
        ctxX.drawImage(
          self.imageObj, sx, sy, swidth, sheight, 0, 0, width, height
        )
      }

      if (self.attr.pixels && self.imageObj) {
        let ctxX
        const { width, height } = self.attr
        if (!self.rImageObj) {
          self.rImageObj = getCanvasImgInstance(self.attr.width, self.attr.height)
          ctxX = self.rImageObj.getContext('2d')
          ctxX.drawImage(
            self.imageObj, 0, 0, width, height
          )
        }
        ctxX = self.rImageObj.getContext('2d')
        ctxX.putImageData(pixels.call(self, self.attr.pixels), 0, 0)
      }

      if (nodeExe.attr.onload && typeof nodeExe.attr.onload === 'function') {
        nodeExe.attr.onload.call(nodeExe, self.image)
      }
      self.nodeExe.BBoxUpdate = true
      queueInstance.vDomChanged(self.nodeExe.vDomIndex)
    }
    self.image.onerror = function onerror (error) {
      if (nodeExe.attr.onerror && typeof nodeExe.attr.onerror === 'function') {
        nodeExe.attr.onerror.call(nodeExe, error)
      }
    }
    if (self.attr.src) { self.image.src = self.attr.src }

    queueInstance.vDomChanged(nodeExe.vDomIndex)

    self.stack = [self]
  }
  RenderImage.prototype = new CanvasDom()
  RenderImage.prototype.constructor = RenderImage
  RenderImage.prototype.setAttr = function RIsetAttr (attr, value) {
    const self = this

    this.attr[attr] = value

    if (attr === 'src') {
      this.image[attr] = value
    }
    // if ((attr === 'onerror' || attr === 'onload') && typeof value === 'function') {
    //   this.image[attr] = function (e) {
    //     value.call(self, this, e)
    //   }
    // }

    if (attr === 'clip') {
      if (!this.rImageObj) {
        this.rImageObj = getCanvasImgInstance(self.attr.width, self.attr.height)
      }
      const ctxX = this.rImageObj.getContext('2d')
      const { clip, width, height } = this.attr
      let { sx, sy, swidth, sheight } = clip
      sx = sx !== undefined ? sx : 0
      sy = sy !== undefined ? sy : 0
      swidth = swidth !== undefined ? swidth : width
      sheight = sheight !== undefined ? sheight : height
      ctxX.clearRect(0, 0, width, height)
      if (this.imageObj) {
        ctxX.drawImage(
          this.imageObj, sx, sy, swidth, sheight, 0, 0, width, height
        )
      }
    }
    if (self.attr.pixels && self.imageObj) {
      let ctxX
      const { width, height } = self.attr
      if (!self.rImageObj) {
        self.rImageObj = getCanvasImgInstance(self.attr.width, self.attr.height)
        ctxX = self.rImageObj.getContext('2d')
        ctxX.drawImage(
          self.imageObj, 0, 0, width, height
        )
      }
      ctxX = self.rImageObj.getContext('2d')
      ctxX.putImageData(pixels.call(self, self.attr.pixels), 0, 0)
    }

    queueInstance.vDomChanged(this.nodeExe.vDomIndex)
  }
  RenderImage.prototype.updateBBox = function RIupdateBBox () {
    const self = this
    let translateX = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    const { transform } = self.attr
    let { x, y, width, height } = self.attr

    if (transform) {
      if (transform.translate) {
        [translateX, translateY] = transform.translate
      }
      if (transform.scale) {
        scaleX = transform.scale[0] !== undefined ? transform.scale[0] : 1
        scaleY = transform.scale[1] !== undefined ? transform.scale[1] : scaleX
      }
    }

    self.BBox = {
      x: (translateX + x) * scaleX,
      y: (translateY + y) * scaleY,
      width: (width || 0) * scaleX,
      height: (height || 0) * scaleY
    }

    if (transform && transform.rotate) {
      self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform)
    } else {
      self.BBoxHit = this.BBox
    }
  }
  RenderImage.prototype.execute = function RIexecute () {
    const { width, height, x, y } = this.attr
    if (this.imageObj) {
      this.ctx.drawImage(
        this.rImageObj ? this.rImageObj : this.imageObj,
        x || 0,
        y || 0,
        width,
        height
      )
    }
  }
  RenderImage.prototype.applyStyles = function RIapplyStyles () {}
  RenderImage.prototype.in = function RIinfun (co) {
    return co.x >= this.attr.x && co.x <= this.attr.x + this.attr.width &&
      co.y >= this.attr.y && co.y <= this.attr.y + this.attr.height
  }

  function RenderText (ctx, props, stylesProps) {
    const self = this
    self.ctx = ctx
    self.attr = props
    self.style = stylesProps
    self.nodeName = 'text'

    self.stack = [self]
  }
  RenderText.prototype = new CanvasDom()
  RenderText.prototype.constructor = RenderText
  RenderText.prototype.text = function RTtext (value) {
    this.attr.text = value
  }
  RenderText.prototype.updateBBox = function RTupdateBBox () {
    const self = this
    let translateX = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    let height = 1
    const { transform } = self.attr
    if (transform && transform.translate) {
      [translateX, translateY] = transform.translate
    }
    if (transform && transform.scale) {
      [scaleX, scaleY] = transform.scale
    }
    if (this.style.font) {
      this.ctx.font = this.style.font
      height = parseInt(this.style.font, 10)
    }

    self.BBox = {
      x: (translateX + (self.attr.x) * scaleX),
      y: (translateY + (self.attr.y - height + 5) * scaleY),
      width: this.ctx.measureText(this.attr.text).width * scaleX,
      height: height * scaleY
    }

    if (transform && transform.rotate) {
      self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform)
    } else {
      self.BBoxHit = this.BBox
    }
  }
  RenderText.prototype.execute = function RTexecute () {
    if (this.attr.text !== undefined && this.attr.text !== null) {
      if (this.ctx.fillStyle !== '#000000') {
        this.ctx.fillText(this.attr.text, this.attr.x, this.attr.y)
      }
      if (this.ctx.strokeStyle !== '#000000') {
        this.ctx.strokeText(this.attr.text, this.attr.x, this.attr.y)
      }
    }
  }
  RenderText.prototype.applyStyles = function RTapplyStyles () {}
  RenderText.prototype.in = function RTinfun (co) {
    return co.x >= this.attr.x && co.x <= this.attr.x + this.attr.width &&
      co.y >= this.attr.y && co.y <= this.attr.y + this.attr.height
  }

  /** ***************** Render Circle */

  const RenderCircle = function RenderCircle (ctx, props, stylesProps) {
    const self = this
    self.ctx = ctx
    self.attr = props
    self.style = stylesProps
    self.nodeName = 'circle'

    self.stack = [self]
  }
  RenderCircle.prototype = new CanvasDom()
  RenderCircle.prototype.constructor = RenderCircle
  RenderCircle.prototype.updateBBox = function RCupdateBBox () {
    const self = this
    let translateX = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    const { transform } = self.attr

    if (transform) {
      if (transform.translate) {
        [translateX, translateY] = transform.translate
      }
      if (transform.scale) {
        [scaleX, scaleY] = transform.scale
      }
    }

    self.BBox = {
      x: (translateX + (self.attr.cx - self.attr.r)) * scaleX,
      y: (translateY + (self.attr.cy - self.attr.r)) * scaleY,
      width: (2 * self.attr.r) * scaleX,
      height: (2 * self.attr.r) * scaleY
    }

    if (transform && transform.rotate) {
      self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform)
    } else {
      self.BBoxHit = this.BBox
    }
  }
  RenderCircle.prototype.execute = function RCexecute () {
    this.ctx.beginPath()
    this.ctx.arc(this.attr.cx, this.attr.cy, this.attr.r, 0, 2 * Math.PI, false)
    this.applyStyles()
    this.ctx.closePath()
  }

  RenderCircle.prototype.in = function RCinfun (co) {
    const r = Math.sqrt((co.x - this.attr.cx) * (co.x - this.attr.cx) +
      (co.y - this.attr.cy) * (co.y - this.attr.cy))
    return r <= this.attr.r
  }

  const RenderLine = function RenderLine (ctx, props, stylesProps) {
    const self = this
    self.ctx = ctx
    self.attr = props
    self.style = stylesProps
    self.nodeName = 'line'

    self.stack = [self]
  }
  RenderLine.prototype = new CanvasDom()
  RenderLine.prototype.constructor = RenderLine
  RenderLine.prototype.updateBBox = function RLupdateBBox () {
    const self = this
    let translateX = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    const { transform } = self.attr
    if (transform && transform.translate) {
      [translateX, translateY] = transform.translate
    }
    if (transform && transform.scale) {
      [scaleX, scaleY] = transform.scale
    }

    self.BBox = {
      x: (translateX + (self.attr.x1 < self.attr.x2 ? self.attr.x1 : self.attr.x2) * scaleX),
      y: (translateY + (self.attr.y1 < self.attr.y2 ? self.attr.y1 : self.attr.y2) * scaleY),
      width: (Math.abs(self.attr.x2 - self.attr.x1)) * scaleX,
      height: (Math.abs(self.attr.y2 - self.attr.y1)) * scaleY
    }

    if (transform && transform.rotate) {
      self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform)
    } else {
      self.BBoxHit = this.BBox
    }
  }
  RenderLine.prototype.execute = function RLexecute () {
    const { ctx } = this
    ctx.beginPath()
    ctx.moveTo(this.attr.x1, this.attr.y1)
    ctx.lineTo(this.attr.x2, this.attr.y2)
    this.applyStyles()
    ctx.closePath()
  }
  RenderLine.prototype.in = function RLinfun (co) {
    return parseFloat(t2DGeometry.getDistance({ x: this.attr.x1, y: this.attr.y1 }, co) +
        t2DGeometry.getDistance(co, { x: this.attr.x2, y: this.attr.y2 })).toFixed(1) ===
      parseFloat(t2DGeometry.getDistance(
        { x: this.attr.x1, y: this.attr.y1 },
        { x: this.attr.x2, y: this.attr.y2 }
      )).toFixed(1)
  }

  function RenderPolyline (ctx, props, stylesProps) {
    const self = this
    self.ctx = ctx
    self.attr = props
    self.style = stylesProps
    self.nodeName = 'polyline'

    self.stack = [self]
  }
  RenderPolyline.prototype = new CanvasDom()
  RenderPolyline.constructor = RenderPolyline
  RenderPolyline.prototype.execute = function polylineExe () {
    let self = this
    if (!this.attr.points) return
    this.ctx.beginPath()
    this.attr.points.forEach(function (d, i) {
      if (i === 0) {
        self.ctx.moveTo(d.x, d.y)
      } else {
        self.ctx.lineTo(d.x, d.y)
      }
    })
    this.applyStyles()
    this.ctx.closePath()
  }
  RenderPolyline.prototype.updateBBox = RPolyupdateBBox
  RenderPolyline.prototype.in = function RPolyLinfun (co) {
    let flag = false
    for (let i = 0, len = this.attr.points.length; i <= len - 2; i++) {
      let p1 = this.attr.points[i]
      let p2 = this.attr.points[i + 1]
      flag = flag || parseFloat(t2DGeometry.getDistance({ x: p1.x, y: p1.y }, co) +
          t2DGeometry.getDistance(co, { x: p2.x, y: p2.y })).toFixed(1) ===
        parseFloat(t2DGeometry.getDistance(
          { x: p1.x, y: p1.y },
          { x: p2.x, y: p2.y }
        )).toFixed(1)
    }
    return flag
  }
  /** ***************** Render Path */

  const RenderPath = function RenderPath (ctx, props, styleProps) {
    const self = this
    self.ctx = ctx
    self.angle = 0
    self.nodeName = 'path'
    self.attr = props
    self.style = styleProps

    if (self.attr.d) {
      if (path.isTypePath(self.attr.d)) {
        self.path = self.attr.d
        self.attr.d = self.attr.d.fetchPathString()
      } else {
        self.path = i2d.Path(self.attr.d)
      }
      self.pathNode = new Path2D(self.attr.d)
    }
    self.stack = [self]

    return self
  }
  RenderPath.prototype = new CanvasDom()
  RenderPath.prototype.constructor = RenderPath
  RenderPath.prototype.updateBBox = function RPupdateBBox () {
    const self = this
    let translateX = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    const { transform } = self.attr
    if (transform && transform.translate) {
      [translateX, translateY] = transform.translate
    }
    if (transform && transform.scale) {
      [scaleX, scaleY] = transform.scale
    }
    self.BBox = self.path ? t2DGeometry.getBBox(self.path.stack) : {
      x: 0, y: 0, width: 0, height: 0
    }
    self.BBox.x = (translateX + self.BBox.x * scaleX)
    self.BBox.y = (translateY + self.BBox.y * scaleY)
    self.BBox.width *= scaleX
    self.BBox.height *= scaleY

    if (transform && transform.rotate) {
      self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform)
    } else {
      self.BBoxHit = this.BBox
    }
  }
  RenderPath.prototype.setAttr = function RPsetAttr (attr, value) {
    this.attr[attr] = value
    if (attr === 'd') {
      if (path.isTypePath(value)) {
        this.path = value
        this.attr.d = value.fetchPathString()
      } else {
        this.path = i2d.Path(this.attr.d)
      }
      this.pathNode = new Path2D(this.attr.d)
    }
  }
  RenderPath.prototype.getPointAtLength = function RPgetPointAtLength (len) {
    return this.path ? this.path.getPointAtLength(len) : { x: 0, y: 0 }
  }
  RenderPath.prototype.getAngleAtLength = function RPgetAngleAtLength (len) {
    return this.path ? this.path.getAngleAtLength(len) : 0
  }
  RenderPath.prototype.getTotalLength = function RPgetTotalLength () {
    return this.path ? this.path.getTotalLength() : 0
  }

  RenderPath.prototype.execute = function RPexecute () {
    if (this.attr.d) {
      if (this.ctx.fillStyle !== '#000000') { this.ctx.fill(this.pathNode) }
      if (this.ctx.strokeStyle !== '#000000') { this.ctx.stroke(this.pathNode) }
    }
  }
  RenderPath.prototype.applyStyles = function RPapplyStyles () {}
  RenderPath.prototype.in = function RPinfun (co) {
    let flag = false
    if (!this.attr.d) {
      return flag
    }
    this.ctx.save()
    this.ctx.scale(1 / ratio, 1 / ratio)
    flag = this.style.fillStyle ? this.ctx.isPointInPath(this.pathNode, co.x, co.y) : flag
    this.ctx.restore()
    return flag
  }
  /** *****************End Render Path */

  /** ***************** Render polygon */

  function polygonExe (points) {
    let polygon = new Path2D()
    let localPoints = points
    let points_ = []

    localPoints = localPoints.replace(/,/g, ' ').split(' ')

    polygon.moveTo(localPoints[0], localPoints[1])
    points_.push({ x: parseFloat(localPoints[0]), y: parseFloat(localPoints[1]) })
    for (let i = 2; i < localPoints.length; i += 2) {
      polygon.lineTo(localPoints[i], localPoints[i + 1])
      points_.push({ x: parseFloat(localPoints[i]), y: parseFloat(localPoints[i + 1]) })
    }
    polygon.closePath()

    return {
      path: polygon,
      points: points_
    }
  }

  const RenderPolygon = function RenderPolygon (ctx, props, styleProps) {
    const self = this
    self.ctx = ctx
    self.nodeName = 'polygon'
    self.attr = props
    self.style = styleProps
    self.stack = [self]
    if (props.points) {
      self.polygon = polygonExe(self.attr.points)
    }
    return this
  }
  RenderPolygon.prototype = new CanvasDom()
  RenderPolygon.prototype.constructor = RenderPolygon
  RenderPolygon.prototype.setAttr = function RPolysetAttr (attr, value) {
    this.attr[attr] = value
    if (attr === 'points') {
      this.polygon = polygonExe(this.attr[attr])
      this.attr.points = this.polygon.points
    }
  }
  RenderPolygon.prototype.updateBBox = RPolyupdateBBox
  RenderPolygon.prototype.execute = function RPolyexecute () {
    if (this.attr.points) {
      if (this.ctx.fillStyle !== '#000000') { this.ctx.fill(this.polygon.path) }
      if (this.ctx.strokeStyle !== '#000000') { this.ctx.stroke(this.polygon.path) }
    }
  }
  RenderPolygon.prototype.applyStyles = function RPolyapplyStyles () {}
  RenderPolygon.prototype.in = function RPolyinfun (co) {
    let flag = false
    if (!this.attr.points) {
      return flag
    }
    this.ctx.save()
    this.ctx.scale(1 / ratio, 1 / ratio)
    flag = this.style.fillStyle ? this.ctx.isPointInPath(this.polygon.path, co.x, co.y) : flag
    this.ctx.restore()
    return flag
  }

  /** ***************** Render polygon */

  /** ***************** Render ellipse */

  const RenderEllipse = function RenderEllipse (ctx, props, styleProps) {
    const self = this
    self.ctx = ctx
    self.nodeName = 'ellipse'
    self.attr = props
    self.style = styleProps
    self.stack = [self]
    return this
  }
  RenderEllipse.prototype = new CanvasDom()
  RenderEllipse.prototype.constructor = RenderEllipse
  RenderEllipse.prototype.updateBBox = function REupdateBBox () {
    const self = this
    let translateX = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    const { transform } = self.attr

    if (transform && transform.translate) {
      [translateX, translateY] = transform.translate
    }
    if (transform && transform.scale) {
      [scaleX, scaleY] = transform.scale
    }
    self.BBox = {
      x: (translateX + (self.attr.cx - self.attr.rx) * scaleX),
      y: (translateY + (self.attr.cy - self.attr.ry) * scaleY),
      width: self.attr.rx * 2 * scaleX,
      height: self.attr.ry * 2 * scaleY
    }
    if (transform && transform.rotate) {
      self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform)
    } else {
      self.BBoxHit = this.BBox
    }
  }
  RenderEllipse.prototype.execute = function REexecute () {
    const { ctx } = this
    ctx.beginPath()
    ctx.ellipse(this.attr.cx, this.attr.cy, this.attr.rx, this.attr.ry, 0, 0, 2 * Math.PI)
    this.applyStyles()
    ctx.closePath()
  }

  // RenderEllipse.prototype.applyStyles = function REapplyStyles () {
  //   if (this.styles.fillStyle) { this.ctx.fill() }
  //   if (this.styles.strokeStyle) { this.ctx.stroke() }
  // }

  RenderEllipse.prototype.in = function REinfun (co) {
    const { cx, cy, rx, ry } = this.attr
    return ((((co.x - cx) * (co.x - cx)) / (rx * rx)) + (((co.y - cy) * (co.y - cy)) / (ry * ry))) <= 1
  }

  /** ***************** Render ellipse */

  /** ***************** Render Rect */

  const RenderRect = function RenderRect (ctx, props, styleProps) {
    const self = this
    self.ctx = ctx
    self.nodeName = 'rect'
    self.attr = props
    self.style = styleProps

    self.stack = [self]
    return this
  }
  RenderRect.prototype = new CanvasDom()
  RenderRect.prototype.constructor = RenderRect
  RenderRect.prototype.updateBBox = function RRupdateBBox () {
    const self = this
    let translateX = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    const { transform } = self.attr

    if (transform && transform.translate) {
      [translateX, translateY] = transform.translate
    }
    if (transform && transform.scale) {
      [scaleX, scaleY] = transform.scale
    }
    self.BBox = {
      x: (translateX + self.attr.x * scaleX),
      y: (translateY + self.attr.y * scaleY),
      width: self.attr.width * scaleX,
      height: self.attr.height * scaleY
    }
    if (transform && transform.rotate) {
      self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, transform)
    } else {
      self.BBoxHit = this.BBox
    }
  }
  RenderRect.prototype.applyStyles = function rStyles () {
    // if (this.style.fillStyle) { this.ctx.fill() }
    // if (this.style.strokeStyle) { this.ctx.stroke() }
  }
  RenderRect.prototype.execute = function RRexecute () {
    const { ctx } = this
    if (ctx.strokeStyle !== '#000000') {
      ctx.strokeRect(this.attr.x, this.attr.y, this.attr.width, this.attr.height)
    }
    if (ctx.fillStyle !== '#000000') {
      ctx.fillRect(this.attr.x, this.attr.y, this.attr.width, this.attr.height)
    }
  }

  RenderRect.prototype.in = function RRinfun (co) {
    const { x, y, width, height } = this.attr
    return co.x >= x && co.x <= x + width && co.y >= y && co.y <= y + height
  }

  /** ***************** Render Rect */

  /** ***************** Render Group */

  const RenderGroup = function RenderGroup (ctx, props, styleProps) {
    const self = this
    self.nodeName = 'group'
    self.ctx = ctx
    self.attr = props
    self.style = styleProps
    self.stack = new Array(0)
    return this
  }
  RenderGroup.prototype = new CanvasDom()
  RenderGroup.prototype.constructor = RenderGroup
  RenderGroup.prototype.updateBBox = function RGupdateBBox (children) {
    const self = this
    let minX
    let maxX
    let minY
    let maxY
    let gTranslateX = 0
    let gTranslateY = 0
    let scaleX = 1
    let scaleY = 1
    const { transform } = self.attr

    self.BBox = {}

    if (transform && transform.translate) {
      gTranslateX = transform.translate[0] !== undefined ? transform.translate[0] : 0
      gTranslateY = transform.translate[1] !== undefined ? transform.translate[1] : gTranslateX
    }
    if (transform && self.attr.transform.scale && self.attr.id !== 'rootNode') {
      scaleX = transform.scale[0] !== undefined ? transform.scale[0] : 1
      scaleY = transform.scale[1] !== undefined ? transform.scale[1] : scaleX
    }

    if (children && children.length > 0) {
      let d
      let boxX
      let boxY
      for (let i = 0; i < children.length; i += 1) {
        d = children[i]

        boxX = d.dom.BBoxHit.x
        boxY = d.dom.BBoxHit.y
        minX = minX === undefined ? boxX : (minX > boxX ? boxX : minX)
        minY = minY === undefined ? boxY : (minY > boxY ? boxY : minY)
        maxX = maxX === undefined ? (boxX + d.dom.BBoxHit.width) : (maxX < (boxX + d.dom.BBoxHit.width) ? (boxX + d.dom.BBoxHit.width) : maxX)
        maxY = maxY === undefined ? (boxY + d.dom.BBoxHit.height) : (maxY < (boxY + d.dom.BBoxHit.height) ? (boxY + d.dom.BBoxHit.height) : maxY)
      }
    }

    minX = minX === undefined ? 0 : minX
    minY = minY === undefined ? 0 : minY
    maxX = maxX === undefined ? 0 : maxX
    maxY = maxY === undefined ? 0 : maxY

    self.BBox.x = (gTranslateX + minX * scaleX)
    self.BBox.y = (gTranslateY + minY * scaleY)
    self.BBox.width = Math.abs(maxX - minX) * scaleX
    self.BBox.height = Math.abs(maxY - minY) * scaleY

    if (self.attr.transform && self.attr.transform.rotate) {
      self.BBoxHit = t2DGeometry.rotateBBox(this.BBox, this.attr.transform)
    } else {
      self.BBoxHit = this.BBox
    }
  }

  RenderGroup.prototype.child = function RGchild (obj) {
    const self = this
    const objLocal = obj
    if (objLocal instanceof CanvasNodeExe) {
      objLocal.dom.parent = self
      self.stack[self.stack.length] = objLocal
    } else if (objLocal instanceof CreateElements) {
      objLocal.stack.forEach((d) => {
        d.dom.parent = self
        self.stack[self.stack.length] = d
      })
    } else { console.log('wrong Object') }
  }

  RenderGroup.prototype.in = function RGinfun (coOr) {
    const self = this
    const co = { x: coOr.x, y: coOr.y }
    const { BBox } = this
    const { transform } = self.attr
    let gTranslateX = 0
    let gTranslateY = 0
    let scaleX = 1
    let scaleY = 1

    if (transform && transform.translate) {
      [gTranslateX, gTranslateY] = transform.translate
    }
    if (transform && transform.scale) {
      scaleX = transform.scale[0] !== undefined ? transform.scale[0] : 1
      scaleY = transform.scale[1] !== undefined ? transform.scale[1] : scaleX
    }

    return co.x >= (BBox.x - gTranslateX) / scaleX &&
      co.x <= ((BBox.x - gTranslateX) + BBox.width) / scaleX &&
      co.y >= (BBox.y - gTranslateY) / scaleY &&
      co.y <= ((BBox.y - gTranslateY) + BBox.height) / scaleY
  }

  /** ***************** End Render Group */

  let CanvasNodeExe = function CanvasNodeExe (context, config, id, vDomIndex) {
    this.style = {}
    this.attr = {}
    this.id = id
    this.nodeName = config.el
    this.nodeType = 'CANVAS'
    this.children = []
    this.ctx = context
    this.vDomIndex = vDomIndex
    this.bbox = config['bbox'] !== undefined ? config['bbox'] : true

    switch (config.el) {
      case 'circle':
        this.dom = new RenderCircle(this.ctx, this.attr, this.style)
        break
      case 'rect':
        this.dom = new RenderRect(this.ctx, this.attr, this.style)
        break
      case 'line':
        this.dom = new RenderLine(this.ctx, this.attr, this.style)
        break
      case 'polyline':
        this.dom = new RenderPolyline(this.ctx, this.attr, this.style)
        break
      case 'path':
        this.dom = new RenderPath(this.ctx, this.attr, this.style)
        break
      case 'group':
        this.dom = new RenderGroup(this.ctx, this.attr, this.style)
        break
      case 'text':
        this.dom = new RenderText(this.ctx, this.attr, this.style)
        break
      case 'image':
        this.dom = new RenderImage(this.ctx, this.attr, this.style, config.onload, config.onerror, this)
        break
      case 'polygon':
        this.dom = new RenderPolygon(this.ctx, this.attr, this.style, this)
        break
      case 'ellipse':
        this.dom = new RenderEllipse(this.ctx, this.attr, this.style, this)
        break
      default:
        this.dom = null
        break
    }

    this.dom.nodeExe = this
    this.BBoxUpdate = true

    if (config.style) { this.setStyle(config.style) }
    if (config.attr) { this.setAttr(config.attr) }
  }

  CanvasNodeExe.prototype.node = function Cnode () {
    this.updateBBox()
    return this.dom
  }
  CanvasNodeExe.prototype.stylesExe = function CstylesExe () {
    let value
    let key

    for (key in this.style) {
      if (typeof this.style[key] !== 'function' && !(this.style[key] instanceof CanvasGradients || this.style[key] instanceof CanvasPattern)) {
        value = this.style[key]
      } else if (typeof this.style[key] === 'function') {
        this.style[key] = this.style[key].call(this, this.dataObj)
        value = this.style[key]
      } else if (this.style[key] instanceof CanvasGradients || this.style[key] instanceof CanvasPattern) {
        value = this.style[key].exe(this.ctx, this.dom.BBox)
      } else {
        console.log('unkonwn Style')
      }

      if (typeof this.ctx[key] !== 'function') {
        this.ctx[key] = value
      } else if (typeof this.ctx[key] === 'function') {
        this.ctx[key](value)
      } else { console.log('junk comp') }
    }
  }

  CanvasNodeExe.prototype.remove = function Cremove () {
    const { children } = this.dom.parent
    const index = children.indexOf(this)
    if (index !== -1) {
      children.splice(index, 1)
    }
    this.dom.parent.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)
  }

  CanvasNodeExe.prototype.attributesExe = function CattributesExe () {
    this.dom.render(this.attr)
  }
  CanvasNodeExe.prototype.setStyle = function CsetStyle (attr, value) {
    if (arguments.length === 2) {
      this.style[attr] = valueCheck(value)
    } else if (arguments.length === 1 && typeof attr === 'object') {
      const styleKeys = Object.keys(attr)
      for (let i = 0, len = styleKeys.length; i < len; i += 1) {
        this.style[styleKeys[i]] = valueCheck(attr[styleKeys[i]])
      }
    }
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }

  function valueCheck (value) {
    return (value === '#000' || value === '#000000' || value === 'black') ? 'rgba(0, 0, 0, 0.9)' : value
  }

  CanvasNodeExe.prototype.setAttr = function CsetAttr (attr, value) {
    if (arguments.length === 2) {
      this.attr[attr] = value
      this.dom.setAttr(attr, value)
    } else if (arguments.length === 1 && typeof attr === 'object') {
      const keys = Object.keys(attr)
      for (let i = 0; i < keys.length; i += 1) {
        this.attr[keys[i]] = attr[keys[i]]
        this.dom.setAttr(keys[i], attr[keys[i]])
      }
    }

    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)

    return this
  }

  CanvasNodeExe.prototype.getAttr = function CgetAttribute (_) {
    return this.attr[_]
  }
  CanvasNodeExe.prototype.getStyle = function DMgetStyle (_) {
    return this.style[_]
  }
  CanvasNodeExe.prototype.rotate = function Crotate (angle, x, y) {
    if (!this.attr.transform) { this.attr.transform = {} }
    if (Object.prototype.toString.call(angle) === '[object Array]') {
      this.attr.transform.rotate = [angle[0] || 0, angle[1] || 0, angle[2] || 0]
    } else {
      this.attr.transform.rotate = [angle, x || 0, y || 0]
    }
    // this.attr.transform.cx = x
    // this.attr.transform.cy = y
    this.dom.setAttr('transform', this.attr.transform)

    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }

  CanvasNodeExe.prototype.scale = function Cscale (XY) {
    if (!this.attr.transform) { this.attr.transform = {} }
    if (XY.length < 1) { return null }
    this.attr.transform.scale = [XY[0], XY[1] ? XY[1] : XY[0]]
    this.dom.setAttr('transform', this.attr.transform)

    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  CanvasNodeExe.prototype.translate = function Ctranslate (XY) {
    if (!this.attr.transform) { this.attr.transform = {} }
    this.attr.transform.translate = XY
    this.dom.setAttr('transform', this.attr.transform)

    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)

    return this
  }
  CanvasNodeExe.prototype.skewX = function CskewX (x) {
    if (!this.attr.transform) { this.attr.transform = {} }
    this.attr.transform.skewX = [x]
    this.dom.setAttr('transform', this.attr.transform)

    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  CanvasNodeExe.prototype.skewY = function CskewY (y) {
    if (!this.attr.transform) { this.attr.transform = {} }
    this.attr.transform.skewY = [y]
    this.dom.setAttr('transform', this.attr.transform)

    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  CanvasNodeExe.prototype.execute = function Cexecute () {
    // let fillStyle = this.ctx.fillStyle
    // let strokeStyle = this.ctx.strokeStyle
    this.ctx.save()
    this.stylesExe()
    this.attributesExe()
    if (this.dom instanceof RenderGroup) {
      for (let i = 0, len = this.children.length; i < len; i += 1) {
        this.children[i].execute()
      }
    }
    // this.dom.applyStyles()
    this.ctx.restore()
  // this.ctx.fillStyle = fillStyle
  // this.ctx.strokeStyle = strokeStyle
  }

  CanvasNodeExe.prototype.child = function child (childrens) {
    const self = this
    const childrensLocal = childrens
    if (self.dom instanceof RenderGroup) {
      for (let i = 0; i < childrensLocal.length; i += 1) {
        childrensLocal[i].dom.parent = self
        self.children[self.children.length] = childrensLocal[i]
      }
    } else { console.error('Trying to insert child to nonGroup Element') }

    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)
    return self
  }
  CanvasNodeExe.prototype.fetchEl = cfetchEl
  CanvasNodeExe.prototype.fetchEls = cfetchEls

  CanvasNodeExe.prototype.updateBBox = function CupdateBBox () {
    let status
    for (let i = 0, len = this.children.length; i < len; i += 1) {
      if (this.bbox) {
        status = this.children[i].updateBBox() || status
      }
    }
    if (this.bbox) {
      if (this.BBoxUpdate || status) {
        this.dom.updateBBox(this.children)
        this.BBoxUpdate = false
        return true
      }
    }

    return false
  }

  CanvasNodeExe.prototype.in = function Cinfun (co) {
    return this.dom.in(co)
  }
  CanvasNodeExe.prototype.on = function Con (eventType, hndlr) {
    this.dom.on(eventType, hndlr)
    return this
  }
  CanvasNodeExe.prototype.exec = function Cexe (exe) {
    if (typeof exe !== 'function') {
      console.error('Wrong Exe type')
    }
    exe.call(this, this.dataObj)
    return this
  }
  CanvasNodeExe.prototype.animateTo = animateTo
  CanvasNodeExe.prototype.animateExe = animateExe
  CanvasNodeExe.prototype.animatePathTo = path.animatePathTo
  CanvasNodeExe.prototype.morphTo = path.morphTo
  CanvasNodeExe.prototype.vDomIndex = null
  CanvasNodeExe.prototype.join = dataJoin
  CanvasNodeExe.prototype.createRadialGradient = createRadialGradient
  CanvasNodeExe.prototype.createLinearGradient = createLinearGradient
  CanvasNodeExe.prototype.createPattern = createCanvasPattern
  CanvasNodeExe.prototype.createEls = function CcreateEls (data, config) {
    const e = new CreateElements({ type: 'CANVAS', ctx: this.dom.ctx }, data, config, this.vDomIndex)
    this.child(e.stack)
    queueInstance.vDomChanged(this.vDomIndex)
    return e
  }
  CanvasNodeExe.prototype.text = function Ctext (value) {
    if (this.dom instanceof RenderText) { this.dom.text(value) }
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  CanvasNodeExe.prototype.createEl = function CcreateEl (config) {
    const e = new CanvasNodeExe(this.dom.ctx, config, domId(), this.vDomIndex)
    this.child([e])
    queueInstance.vDomChanged(this.vDomIndex)
    return e
  }
  CanvasNodeExe.prototype.removeChild = function CremoveChild (obj) {
    let index = -1
    this.children.forEach((d, i) => {
      if (d === obj) { index = i }
    })
    if (index !== -1) {
      const removedNode = this.children.splice(index, 1)[0]
      this.dom.removeChild(removedNode.dom)
    }
    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)
  }

  function CreateElements (contextInfo, data, config, vDomIndex) {
    if (!data) { data = [] }

    let transform
    let key

    const attrKeys = config ? (config.attr ? Object.keys(config.attr) : []) : []
    const styleKeys = config ? (config.style ? Object.keys(config.style) : []) : []
    const bbox = config ? (config['bbox'] !== undefined ? config['bbox'] : true) : true

    this.stack = data.map((d, i) => {
      let node

      if (contextInfo.type === 'SVG') {
        node = createDomElement({
          el: config.el
        }, vDomIndex)
      } else if (contextInfo.type === 'CANVAS') {
        node = new CanvasNodeExe(contextInfo.ctx, {
          el: config.el,
          bbox: bbox
        }, domId(), vDomIndex)
      } else if (contextInfo.type === 'WEBGL') {
        node = new WebglNodeExe(contextInfo.ctx, {
          el: config.el,
          bbox: bbox
        }, domId(), vDomIndex)
      } else {
        console.log('unknow type')
      }

      for (let j = 0, len = attrKeys.length; j < len; j += 1) {
        key = attrKeys[j]
        if (key !== 'transform') {
          if (typeof config.attr[key] === 'function') {
            const resValue = config.attr[key].call(node, d, i)
            node.setAttr(key, resValue)
          } else {
            node.setAttr(key, config.attr[key])
          }
        } else {
          if (typeof config.attr.transform === 'function') {
            transform = config.attr[key].call(node, d, i)
          } else {
            ({ transform } = config.attr)
          }
          for (const trns in transform) {
            node[trns](transform[trns])
          }
        }
      }
      for (let j = 0, len = styleKeys.length; j < len; j += 1) {
        key = styleKeys[j]
        if (typeof config.style[key] === 'function') {
          const resValue = config.style[key].call(node, d, i)
          node.setStyle(key, resValue)
        } else {
          node.setStyle(key, config.style[key])
        }
      }
      node.dataObj = d
      return node
    })
    return this
  }
  CreateElements.prototype = {
    createEls,
    createEl,
    forEach,
    setAttr: setAttribute,
    fetchEls,
    setStyle,
    translate,
    rotate,
    scale,
    exec,
    animateTo: animateArrayTo,
    animateExe: animateArrayExe,
    animatePathTo: animatePathArrayTo,
    remove,
    text: textArray,
    join,
    on
  }

  CreateElements.prototype.wrapper = function wrapper (nodes) {
    const self = this
    if (nodes) {
      for (let i = 0, len = nodes.length; i < len; i++) {
        let node = nodes[i]
        if (node instanceof DomExe ||
          node instanceof CanvasNodeExe ||
          node instanceof WebglNodeExe ||
          node instanceof CreateElements) {
          self.stack.push(node)
        } else { self.stack.push(new DomExe(node, {}, domId())) }
      }
    }
    return this
  }

  function getPixlRatio (ctx) {
    const dpr = window.devicePixelRatio || 1
    const bsr = ctx.webkitBackingStorePixelRatio ||
      ctx.mozBackingStorePixelRatio ||
      ctx.msBackingStorePixelRatio ||
      ctx.oBackingStorePixelRatio ||
      ctx.backingStorePixelRatio || 1

    return dpr / bsr
  }

  let dragObject = {
    dragStart: function (fun) {
      if (typeof fun === 'function') {
        this.onDragStart = fun
      }
      return this
    },
    drag: function (fun) {
      if (typeof fun === 'function') {
        this.onDrag = fun
      }
      return this
    },
    dragEnd: function (fun) {
      if (typeof fun === 'function') {
        this.onDragEnd = fun
      }
      return this
    }
  }

  i2d.dragEvent = function () {
    return Object.create(dragObject)
  }

  let Event = function (x, y) {
    this.x = x
    this.y = y
    this.dx = 0
    this.dy = 0
  }

  i2d.CanvasLayer = function CanvasLayer (context, config = {}) {
    let originalRatio
    let selectedNode
    // const selectiveClearing = config.selectiveClear ? config.selectiveClear : false
    const res = document.querySelector(context)
    const height = config.height ? config.height : res.clientHeight
    const width = config.width ? config.width : res.clientWidth
    const layer = document.createElement('canvas')
    const ctx = layer.getContext('2d')
    ratio = getPixlRatio(ctx)
    originalRatio = ratio

    const onClear = (config.onClear === 'clear' || !config.onClear) ? function (ctx) {
      ctx.clearRect(0, 0, width * ratio, height * ratio)
    } : config.onClear

    layer.setAttribute('height', height * ratio)
    layer.setAttribute('width', width * ratio)
    layer.style.height = `${height}px`
    layer.style.width = `${width}px`
    layer.style.position = 'absolute'

    // ctx.strokeStyle = 'rgba(0, 0, 0, 0)'
    // ctx.fillStyle = 'rgba(0, 0, 0, 0)'

    res.appendChild(layer)

    const vDomInstance = new VDom()
    const vDomIndex = queueInstance.addVdom(vDomInstance)

    const root = new CanvasNodeExe(ctx, {
      el: 'group',
      attr: {
        id: 'rootNode'
      }
    }, domId(), vDomIndex)

    vDomInstance.root(root)

    const execute = root.execute.bind(root)
    root.container = res
    root.domEl = layer
    root.height = height
    root.width = width
    root.type = 'CANVAS'
    root.execute = function executeExe () {
      onClear(ctx)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      root.updateBBox()
      execute()
    }

    root.setAttr = function (prop, value) {
      if (arguments.length === 2) {
        config[prop] = value
      } else if (arguments.length === 1 && typeof prop === 'object') {
        const props = Object.keys(prop)
        for (let i = 0, len = props.length; i < len; i += 1) {
          config[props[i]] = prop[props[i]]
        }
      }
      renderVdom.call(this)
    }

    root.resize = renderVdom

    function renderVdom () {
      let width = config.width ? config.width : this.container.clientWidth
      let height = config.height ? config.height : this.container.clientHeight
      this.domEl.setAttribute('height', height * originalRatio)
      this.domEl.setAttribute('width', width * originalRatio)
      this.domEl.style.height = `${height}px`
      this.domEl.style.width = `${width}px`
      if (config.rescale) {
        let newWidthRatio = (width / this.width)
        let newHeightRatio = (height / this.height)
        this.scale([newWidthRatio, newHeightRatio])
      } else {
        this.execute()
      }
      this.height = height
      this.width = width
    }

    function canvasResize () {
      if (config.resize && typeof config.resize === 'function') {
        config.resize()
      }
      root.resize()
    }

    window.addEventListener('resize', canvasResize)

    root.destroy = function () {
      window.removeEventListener('resize', canvasResize)
      // layer.remove()
      // queueInstance.removeVdom(vDomIndex)
    }

    if (config.events || config.events === undefined) {
      res.addEventListener('mousemove', (e) => {
        e.preventDefault()
        if (selectedNode && selectedNode.dom.drag && selectedNode.dom.drag.dragStartFlag && selectedNode.dom.drag.onDrag) {
          let event = selectedNode.dom.drag.event
          if (selectedNode.dom.drag.event) {
            event.dx = e.offsetX - event.x
            event.dy = e.offsetY - event.y
          }
          event.x = e.offsetX
          event.y = e.offsetY
          event.e = e
          selectedNode.dom.drag.event = event
          selectedNode.dom.drag.onDrag.call(selectedNode, selectedNode.dataObj, event)
        } else {
          const newSelectedNode = vDomInstance.eventsCheck([root], { x: e.offsetX, y: e.offsetY }, e)
          if (selectedNode && newSelectedNode !== selectedNode) {
            if ((selectedNode.dom.mouseout || selectedNode.dom.mouseleave) && selectedNode.hovered) {
              if (selectedNode.dom.mouseout) { selectedNode.dom.mouseout.call(selectedNode, selectedNode.dataObj, e) }
              if (selectedNode.dom.mouseleave) { selectedNode.dom.mouseleave.call(selectedNode, selectedNode.dataObj, e) }
            }
            selectedNode.hovered = false
            if (selectedNode.dom.drag && selectedNode.dom.drag.dragStartFlag) {
              selectedNode.dom.drag.dragStartFlag = false
              selectedNode.dom.drag.onDragEnd.call(selectedNode, selectedNode.dataObj, selectedNode.dom.drag.event)
              selectedNode.dom.drag.event = null
            }
          }
          if (selectedNode && newSelectedNode === selectedNode) {
            if (selectedNode.dom.drag && selectedNode.dom.drag.dragStartFlag && selectedNode.dom.drag.onDrag) {
              let event = selectedNode.dom.drag.event
              if (selectedNode.dom.drag.event) {
                event.dx = e.offsetX - event.x
                event.dy = e.offsetY - event.y
              }
              event.x = e.offsetX
              event.y = e.offsetY
              event.e = e
              selectedNode.dom.drag.event = event
              selectedNode.dom.drag.onDrag.call(selectedNode, selectedNode.dataObj, event)
            }
          }
          if (newSelectedNode) {
            selectedNode = newSelectedNode
            if ((selectedNode.dom.mouseover || selectedNode.dom.mouseenter) &&
              !selectedNode.hovered) {
              if (selectedNode.dom.mouseover) { selectedNode.dom.mouseover.call(selectedNode, selectedNode.dataObj, e) }
              if (selectedNode.dom.mouseenter) { selectedNode.dom.mouseenter.call(selectedNode, selectedNode.dataObj, e) }
              selectedNode.hovered = true
            }
            if (selectedNode.dom.mousemove) {
              selectedNode.dom.mousemove.call(selectedNode, selectedNode.dataObj, e)
            }
          } else {
            selectedNode = undefined
          }
        }
      })
      res.addEventListener('click', (e) => {
        e.preventDefault()
        if (selectedNode && selectedNode.dom.click) { selectedNode.dom.click.call(selectedNode, selectedNode.dataObj, e) }
      })
      res.addEventListener('dblclick', (e) => {
        if (selectedNode && selectedNode.dom.dblclick) { selectedNode.dom.dblclick.call(selectedNode, selectedNode.dataObj, e) }
      })
      res.addEventListener('mousedown', (e) => {
        e.preventDefault()
        if (selectedNode && selectedNode.dom.mousedown) {
          selectedNode.dom.mousedown.call(selectedNode, selectedNode.dataObj, e)
          selectedNode.down = true
        }
        if (selectedNode && selectedNode.dom.drag && selectedNode.dom.drag.onDragStart) {
          selectedNode.dom.drag.dragStartFlag = true
          selectedNode.dom.drag.onDragStart.call(selectedNode, selectedNode.dataObj, e)
          let event = new Event(e.offsetX, e.offsetY)
          event.e = e
          selectedNode.dom.drag.event = event
        }
      })
      res.addEventListener('mouseup', (e) => {
        e.preventDefault()
        if (selectedNode && selectedNode.dom.mouseup && selectedNode.down) {
          selectedNode.dom.mouseup.call(selectedNode, selectedNode.dataObj)
          selectedNode.down = false
        }
        if (selectedNode && selectedNode.dom.drag && selectedNode.dom.drag.dragStartFlag && selectedNode.dom.drag.onDragEnd) {
          selectedNode.dom.drag.dragStartFlag = false
          selectedNode.dom.drag.event = null
          selectedNode.dom.drag.onDragEnd.call(selectedNode, selectedNode.dataObj, selectedNode.dom.drag.event)
          selectedNode.dom.drag.event = null
        // selectedNode = null
        }
      })
      res.addEventListener('mouseleave', (e) => {
        e.preventDefault()
        if (selectedNode && selectedNode.dom.mouseleave) {
          selectedNode.dom.mouseleave.call(selectedNode, selectedNode.dataObj, e)
        }
        if (selectedNode && selectedNode.dom.drag && selectedNode.dom.drag.dragStartFlag && selectedNode.dom.drag.onDragEnd) {
          selectedNode.dom.drag.dragStartFlag = false
          selectedNode.dom.drag.onDragEnd.call(selectedNode, selectedNode.dataObj, selectedNode.dom.drag.event)
          selectedNode.dom.drag.event = null
          selectedNode = null
        }
      })
      res.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        if (selectedNode && selectedNode.dom.contextmenu) { selectedNode.dom.contextmenu.call(selectedNode, selectedNode.dataObj) }
      })
    }

    queueInstance.execute()
    return root
  }

  let dragStack = []
  i2d.SVGLayer = function SVGLayer (context, config = {}) {
    const vDomInstance = new VDom()
    const vDomIndex = queueInstance.addVdom(vDomInstance)
    const res = document.querySelector(context)
    let height = config.height ? config.height : res.clientHeight
    let width = config.width ? config.width : res.clientWidth
    const layer = document.createElementNS(nameSpace.svg, 'svg')
    layer.setAttribute('height', height)
    layer.setAttribute('width', width)
    layer.style.position = 'absolute'
    res.appendChild(layer)
    const root = new DomExe(layer, {}, domId(), vDomIndex)

    root.container = res
    root.type = 'SVG'
    root.width = width
    root.height = height
    vDomInstance.root(root)

    // root.resize = renderVdom

    root.setAttr = function (prop, value) {
      if (arguments.length === 2) {
        config[prop] = value
      } else if (arguments.length === 1 && typeof prop === 'object') {
        const props = Object.keys(prop)
        for (let i = 0, len = props.length; i < len; i += 1) {
          config[props[i]] = prop[props[i]]
        }
      }
      renderVdom.call(this)
    }

    function svgResize () {
      height = config.height ? config.height : res.clientHeight
      width = config.width ? config.width : res.clientWidth
      layer.setAttribute('height', height)
      layer.setAttribute('width', width)
      root.width = width
      root.height = height
      if (config.resize && typeof config.resize === 'function') {
        config.resize()
      }
      renderVdom.call(root)
    }

    function renderVdom () {
      let width = config.width ? config.width : this.container.clientWidth
      let height = config.height ? config.height : this.container.clientHeight
      let newWidthRatio = (width / this.width)
      let newHeightRatio = (height / this.height)
      if (config && config.rescale) {
        this.scale([newWidthRatio, newHeightRatio])
      }
      this.dom.setAttribute('height', height)
      this.dom.setAttribute('width', width)
    }

    window.addEventListener('resize', svgResize)

    root.destroy = function () {
      window.removeEventListener('resize', svgResize)
      layer.remove()
      queueInstance.removeVdom(vDomIndex)
    }

    let dragTargetEl = null

    root.dom.addEventListener('mousedown', function (e) {
      if (dragStack.length) {
        dragStack.forEach(function (d) {
          if (e.target === d.dom) {
            dragTargetEl = d
          }
        })
        if (dragTargetEl) {
          let event = new Event(e.offsetX, e.offsetY)
          event.e = e
          dragTargetEl.drag.event = event
          dragTargetEl.drag.dragStartFlag = true
          dragTargetEl.drag.onDragStart.call(dragTargetEl, dragTargetEl.dataObj, event)
        }
      }
    })

    root.dom.addEventListener('mousemove', function (e) {
      if (dragTargetEl) {
        let event = dragTargetEl.drag.event
        event.dx = e.offsetX - event.x
        event.dy = e.offsetY - event.y
        event.x = e.offsetX
        event.y = e.offsetY
        event.e = e
        dragTargetEl.drag.onDrag.call(dragTargetEl, dragTargetEl.dataObj, event)
      }
    })

    root.dom.addEventListener('mouseup', function (e) {
      if (dragTargetEl) {
        let event = dragTargetEl.drag.event
        event.dx = e.offsetX - event.x
        event.dy = e.offsetY - event.y
        event.x = e.offsetX
        event.y = e.offsetY
        event.e = e
        dragTargetEl.drag.onDragEnd.call(dragTargetEl, dragTargetEl.dataObj, event)
        dragTargetEl = null
      }
    })

    root.dom.addEventListener('mouseleave', function (e) {
      if (dragTargetEl) {
        let event = dragTargetEl.drag.event
        event.dx = e.offsetX - event.x
        event.dy = e.offsetY - event.y
        event.x = e.offsetX
        event.y = e.offsetY
        event.e = e
        dragTargetEl.drag.onDragEnd.call(dragTargetEl, dragTargetEl.dataObj, event)
        dragTargetEl = null
      }
    })

    queueInstance.execute()
    return root
  }

  function loadShader (ctx, shaderSource, shaderType) {
    var shader = ctx.createShader(shaderType)
    ctx.shaderSource(shader, shaderSource)
    ctx.compileShader(shader)
    var compiled = ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)
    if (!compiled) {
      var lastError = ctx.getShaderInfoLog(shader)
      console.error("*** Error compiling shader '" + shader + "':" + lastError)
      ctx.deleteShader(shader)
      return null
    }
    return shader
  }

  function createProgram (ctx, shaders) {
    var program = ctx.createProgram()
    shaders.forEach(function (shader) {
      ctx.attachShader(program, shader)
    })
    ctx.linkProgram(program)

    var linked = ctx.getProgramParameter(program, ctx.LINK_STATUS)
    if (!linked) {
      var lastError = ctx.getProgramInfoLog(program)
      console.error('Error in program linking:' + lastError)
      ctx.deleteProgram(program)
      return null
    }
    return program
  }

  function getProgram (ctx, shaderCode) {
    var shaders = [
      loadShader(ctx, shaderCode.vertexShader, ctx.VERTEX_SHADER),
      loadShader(ctx, shaderCode.fragmentShader, ctx.FRAGMENT_SHADER)
    ]
    return createProgram(ctx, shaders)
  }

  function PointNode (attr, style) {
    this.attr = attr || {}
    this.style = style || {}
  }
  PointNode.prototype.setAttr = function (prop, value) {
    this.attr[prop] = value
  }
  // PointNode.prototype.getAttr = function (key) {
  //   return this.attr[key]
  // }
  // PointNode.prototype.setStyle = function (prop, value) {
  //   this.attr[prop] = value
  // }
  // PointNode.prototype.getStyle = function (key) {
  //   return this.style[key]
  // }

  function RectNode (attr, style) {
    this.attr = attr || {}
    this.style = style || {}
  }
  RectNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value
  // this.nodeExe.parent.shader.updatePosition(this.nodeExe.parent.children.indexOf(this.nodeExe), this.nodeExe)
  }
  // RectNode.prototype.getAttr = function (key) {
  //   return this.attr[key]
  // }
  // RectNode.prototype.setStyle = function (key, value) {
  //   this.style[key] = value
  // }
  // RectNode.prototype.getStyle = function (key) {
  //   return this.style[key]
  // }

  function PolyLineNode (attr, style) {
    this.attr = attr || {}
    this.style = style || {}
  }
  PolyLineNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value
  }
  PolyLineNode.prototype.getAttr = function (key) {
    return this.attr[key]
  }
  PolyLineNode.prototype.setStyle = function (key, value) {
    this.style[key] = value
  }
  PolyLineNode.prototype.getStyle = function (key) {
    return this.style[key]
  }

  function LineNode (attr, style) {
    this.attr = attr || {}
    this.style = style || {}
  }
  LineNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value
  }
  LineNode.prototype.getAttr = function (key) {
    return this.attr[key]
  }
  LineNode.prototype.setStyle = function (key, value) {
    this.style[key] = value
  }
  LineNode.prototype.getStyle = function (key) {
    return this.style[key]
  }

  function polygonPointsMapper (value) {
    return earcut(value.reduce(function (p, c) {
      p.push(c.x)
      p.push(c.y)
      return p
    }, [])).map(function (d) {
      return value[d]
    })
  }

  function PolygonNode (attr, style) {
    this.attr = attr
    this.style = style
    if (this.attr['points']) {
      this.attr.triangulatedPoints = polygonPointsMapper(this.attr['points'])
    }
  }
  PolygonNode.prototype.setAttr = function (key, value) {
    if (key === 'points') {
      this.attr.triangulatedPoints = polygonPointsMapper(value)
    }
  }
  PolygonNode.prototype.getAttr = function (key) {
    return this.attr[key]
  }
  PolygonNode.prototype.getStyle = function (key) {
    return this.style[key]
  }

  function CircleNode (attr, style) {
    this.attr = attr
    this.style = style
  }
  CircleNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value
  }
  CircleNode.prototype.getAttr = function (key) {
    return this.attr[key]
  }
  CircleNode.prototype.getStyle = function (key) {
    return this.style[key]
  }

  let webGLImageTextures = {}

  function isPowerOf2 (value) {
    return (value & (value - 1)) === 0
  }

  function ImageNode (ctx, attr, style) {
    let self = this
    this.attr = attr
    this.style = style
    this.image = new Image()
    // self.image.crossOrigin="anonymous"
    // self.image.setAttribute('crossOrigin', '*')

    this.image.onload = function onload () {
      this.crossOrigin = 'anonymous'
      queueInstance.vDomChanged(self.nodeExe.vDomIndex)
      if (!webGLImageTextures[self.attr.src]) {
        let texture = ctx.createTexture()
        ctx.bindTexture(ctx.TEXTURE_2D, texture)
        ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, self.image)
        if (isPowerOf2(self.image.width) && isPowerOf2(self.image.height)) {
          // Yes, it's a power of 2. Generate mips.
          // console.log('mips')
          ctx.generateMipmap(ctx.TEXTURE_2D)
          ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST_MIPMAP_LINEAR)
          ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST)
        } else {
          ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE)
          ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE)
          ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST)
          ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST)
        }
        webGLImageTextures[self.attr.src] = texture
      }
    // self.loadStatus = true
    }
    this.image.onerror = function onerror (onerrorExe) {
      if (onerrorExe && typeof onerrorExe === 'function') {
        // onerrorExe.call(nodeExe)
      }
    }
    if (this.attr.src) { this.image.src = this.attr.src }
  }
  ImageNode.prototype.setAttr = function (key, value) {
    this.attr[key] = value
    if (key === 'src') {
      this.image.src = this.attr.src
    }
  }
  ImageNode.prototype.getAttr = function (key) {
    return this.attr[key]
  }
  ImageNode.prototype.getStyle = function (key) {
    return this.style[key]
  }

  function writeDataToShaderAttributes (ctx, data) {
    let d
    for (let i = 0, len = data.length; i < len; i++) {
      d = data[i]
      ctx.bindBuffer(d.bufferType, d.buffer)
      ctx.bufferData(d.bufferType, d.data, d.drawType)
      ctx.enableVertexAttribArray(d.attribute)
      ctx.vertexAttribPointer(d.attribute, d.size, d.valueType, true, 0, 0)
    }
  }

  let defaultColor = { r: 0, g: 0, b: 0, a: 255.0 }

  function webGlAttrMapper (ctx, program, attr, attrObj) {
    return {
      bufferType: ctx[attrObj.bufferType],
      buffer: ctx.createBuffer(),
      drawType: ctx[attrObj.drawType],
      valueType: ctx[attrObj.valueType],
      size: attrObj.size,
      attribute: ctx.getAttribLocation(program, attr),
      data: attrObj.data
    }
  }

  function webGlUniformMapper (ctx, program, uniform, uniObj) {
    return {
      type: uniObj.type,
      data: uniObj.data,
      attribute: ctx.getUniformLocation(program, uniform)
    }
  }

  function RenderWebglShader (ctx, shader, vDomIndex) {
    this.ctx = ctx
    this.dom = {}
    this.shader = shader
    this.vDomIndex = vDomIndex
    this.program = getProgram(ctx, shader)
    this.uniforms = {}
    this.drawArrays = shader.drawArrays
    for (let uniform in shader.uniforms) {
      this.uniforms[uniform] = webGlUniformMapper(ctx, this.program, uniform, shader.uniforms[uniform])
    }
    this.inputs = []
    for (let attr in shader.attributes) {
      this.inputs.push(webGlAttrMapper(ctx, this.program, attr, shader.attributes[attr]))
    }
  }

  RenderWebglShader.prototype.execute = function () {
    this.ctx.useProgram(this.program)
    for (let uniform in this.uniforms) {
      this.ctx[this.uniforms[uniform].type](this.uniforms[uniform].attribute, this.uniforms[uniform].data)
    }
    writeDataToShaderAttributes(this.ctx, this.inputs)
    for (let item in this.drawArrays) {
      this.ctx.drawArrays(this.ctx[this.drawArrays[item].type], this.drawArrays[item].start, this.drawArrays[item].end)
    }
  }

  RenderWebglShader.prototype.addUniform = function (key, value) {
    this.uniforms[key] = value
  }
  RenderWebglShader.prototype.addAttribute = function (key, value) {
    this.attribute[key] = value
  }
  RenderWebglShader.prototype.setAttribute = function (key, value) {}
  RenderWebglShader.prototype.setUniformData = function (key, value) {
    this.uniforms[key].data = value
    queueInstance.vDomChanged(this.vDomIndex)
  }

  function RenderWebglPoints (ctx, attr, style, vDomIndex) {
    this.ctx = ctx
    this.dom = {}
    this.attr = attr || {}
    this.style = style || {}
    this.vDomIndex = vDomIndex
    this.program = getProgram(ctx, shaders('point'))
    this.colorBuffer = ctx.createBuffer()
    this.sizeBuffer = ctx.createBuffer()
    this.positionBuffer = ctx.createBuffer()
    this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position')
    this.colorAttributeLocation = ctx.getAttribLocation(this.program, 'a_color')
    this.sizeAttributeLocation = ctx.getAttribLocation(this.program, 'a_size')
    this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution')
    this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate')
    this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale')
    // this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width, this.ctx.canvas.height)
    this.positionArray = []
    this.colorArray = []
    this.pointsSize = []
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
    }]

    if (!this.attr.transform) {
      this.attr.transform = {
        translate: [0.0, 0.0],
        scale: [1.0, 1.0]
      }
    }
  }
  RenderWebglPoints.prototype.remove = function (position) {
    this.positionArray.splice(position * 2, 2)
    this.pointsSize.splice(position, 1)
    this.colorArray.splice(position * 4, 4)
  }
  RenderWebglPoints.prototype.execute = function (stack) {
    let positionArray = this.positionArray
    let colorArray = this.colorArray
    let pointsSize = this.pointsSize
    let node
    let fill
    let styleFlag = false
    let attrFlag = false
    for (var i = 0, len = stack.length; i < len; i++) {
      node = stack[i]
      if (node.propChanged) {
        positionArray[i * 2] = node.attr.x
        positionArray[i * 2 + 1] = node.attr.y
        pointsSize[i] = (node.attr.size || 1.0) * ratio
        attrFlag = true
        node.propChanged = false
      }
      if (node.styleChanged) {
        fill = node.style.fill || defaultColor
        colorArray[i * 4] = fill.r
        colorArray[i * 4 + 1] = fill.g
        colorArray[i * 4 + 2] = fill.b
        colorArray[i * 4 + 3] = (fill.a === undefined ? 255 : fill.a)
        styleFlag = true
        node.styleChanged = false
      }
    }

    if (attrFlag) {
      this.inputs[2].data = new Float32Array(positionArray)
      this.inputs[1].data = new Float32Array(pointsSize)
    }

    if (styleFlag) {
      this.inputs[0].data = new Uint8Array(colorArray)
    }
    if (!this.attr.transform.scale) {
      this.attr.transform.scale = [1.0, 1.0]
    }
    if (!this.attr.transform.translate) {
      this.attr.transform.translate = [0.0, 0.0]
    }
    this.ctx.useProgram(this.program)
    writeDataToShaderAttributes(this.ctx, this.inputs)
    this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio)
    this.ctx.uniform2fv(this.translationUniformLocation, [this.attr.transform.translate[0], this.attr.transform.translate[1]])
    this.ctx.uniform2fv(this.scaleUniformLocation, [this.attr.transform.scale[0], this.attr.transform.scale[1]])
    this.ctx.drawArrays(this.ctx.POINTS, 0, positionArray.length / 2)
  }

  function RenderWebglRects (ctx, attr, style, vDomIndex) {
    this.ctx = ctx
    this.dom = {}
    this.attr = attr || {}
    this.style = style || {}
    this.vDomIndex = vDomIndex
    this.program = getProgram(ctx, shaders('rect'))
    this.colorBuffer = ctx.createBuffer()
    this.positionBuffer = ctx.createBuffer()
    this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position')
    this.colorAttributeLocation = ctx.getAttribLocation(this.program, 'a_color')
    this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution')
    this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate')
    this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale')
    this.positionArray = []
    this.colorArray = []
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
    }]
    if (!this.attr.transform) {
      this.attr.transform = {
        translate: [0.0, 0.0],
        scale: [1.0, 1.0]
      }
    }
  }
  RenderWebglRects.prototype.remove = function (position) {
    this.positionArray.splice(position * 12, 12)
    this.colorArray.splice(position * 24, 24)
  }
  RenderWebglRects.prototype.execute = function (stack) {
    let positionArray = this.positionArray
    let colorArray = this.colorArray
    let fill, r, g, b, a, x1, x2, y1, y2
    let node
    let ti
    let posi
    for (var i = 0, len = stack.length; i < len; i++) {
      node = stack[i]
      if (node.propChanged) {
        x1 = node.attr.x
        x2 = x1 + node.attr.width
        y1 = node.attr.y
        y2 = y1 + node.attr.height
        posi = i * 12
        positionArray[posi] = positionArray[posi + 4] = positionArray[posi + 6] = x1
        positionArray[posi + 1] = positionArray[posi + 3] = positionArray[posi + 9] = y1
        positionArray[posi + 2] = positionArray[posi + 8] = positionArray[posi + 10] = x2
        positionArray[posi + 5] = positionArray[posi + 7] = positionArray[posi + 11] = y2
        node.propChanged = false
      }
      if (node.styleChanged) {
        fill = node.style.fill || defaultColor
        r = fill.r
        g = fill.g
        b = fill.b
        a = (fill.a === undefined ? 255 : fill.a)
        ti = i * 24
        colorArray[ti] = colorArray[ti + 4] = colorArray[ti + 8] = colorArray[ti + 12] = colorArray[ti + 16] = colorArray[ti + 20] = r
        colorArray[ti + 1] = colorArray[ti + 5] = colorArray[ti + 9] = colorArray[ti + 13] = colorArray[ti + 17] = colorArray[ti + 21] = g
        colorArray[ti + 2] = colorArray[ti + 6] = colorArray[ti + 10] = colorArray[ti + 14] = colorArray[ti + 18] = colorArray[ti + 22] = b
        colorArray[ti + 3] = colorArray[ti + 7] = colorArray[ti + 11] = colorArray[ti + 15] = colorArray[ti + 19] = colorArray[ti + 23] = a
        node.styleChanged = false
      }
    }
    if (!this.attr.transform.scale) {
      this.attr.transform.scale = [1.0, 1.0]
    }
    if (!this.attr.transform.translate) {
      this.attr.transform.translate = [0.0, 0.0]
    }
    this.inputs[0].data = new Uint8Array(this.colorArray)
    this.inputs[1].data = new Float32Array(this.positionArray)
    writeDataToShaderAttributes(this.ctx, this.inputs)

    this.ctx.useProgram(this.program)
    this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio)
    this.ctx.uniform2fv(this.translationUniformLocation, [this.attr.transform.translate[0], this.attr.transform.translate[1]])
    this.ctx.uniform2fv(this.scaleUniformLocation, [this.attr.transform.scale[0], this.attr.transform.scale[1]])
    this.ctx.drawArrays(this.ctx.TRIANGLES, 0, positionArray.length / 2)
  }

  function RenderWebglLines (ctx, attr, style, vDomIndex) {
    this.ctx = ctx
    this.dom = {}
    this.attr = attr || {}
    this.style = style || {}
    this.vDomIndex = vDomIndex
    this.program = getProgram(ctx, shaders('line'))
    this.colorBuffer = ctx.createBuffer()
    this.positionBuffer = ctx.createBuffer()
    this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position')
    this.colorAttributeLocation = ctx.getAttribLocation(this.program, 'a_color')
    this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution')
    this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate')
    this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale')
    this.positionArray = []
    this.colorArray = []
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
    }]
    if (!this.attr.transform) {
      this.attr.transform = {
        translate: [0.0, 0.0],
        scale: [1.0, 1.0]
      }
    }
  }
  RenderWebglLines.prototype.remove = function (position) {
    this.positionArray.splice(position * 4, 4)
    this.colorArray.splice(position * 8, 8)
  }
  RenderWebglLines.prototype.execute = function (stack) {
    let positionArray = this.positionArray
    let colorArray = this.colorArray
    let node, r, g, b, a, stroke
    for (var i = 0, len = stack.length; i < len; i++) {
      node = stack[i]
      if (node.propChanged) {
        positionArray[i * 4] = node.attr.x1
        positionArray[i * 4 + 1] = node.attr.y1
        positionArray[i * 4 + 2] = node.attr.x2
        positionArray[i * 4 + 3] = node.attr.y2
      }

      if (node.styleChanged) {
        stroke = node.style.stroke || defaultColor
        r = stroke.r
        g = stroke.g
        b = stroke.b
        a = (stroke.a === undefined ? 255 : stroke.a)
        colorArray[i * 8] = r
        colorArray[i * 8 + 1] = g
        colorArray[i * 8 + 2] = b
        colorArray[i * 8 + 3] = a
        colorArray[i * 8 + 4] = r
        colorArray[i * 8 + 5] = g
        colorArray[i * 8 + 6] = b
        colorArray[i * 8 + 7] = a
        node.styleChanged = false
      }
    }
    if (!this.attr.transform.scale) {
      this.attr.transform.scale = [1.0, 1.0]
    }
    if (!this.attr.transform.translate) {
      this.attr.transform.translate = [0.0, 0.0]
    }
    this.inputs[0].data = new Uint8Array(this.colorArray)
    this.inputs[1].data = new Float32Array(this.positionArray)
    writeDataToShaderAttributes(this.ctx, this.inputs)

    this.ctx.useProgram(this.program)
    this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio)
    this.ctx.drawArrays(this.ctx.LINES, 0, positionArray.length / 2)
  }

  function RenderWebglPolyLines (ctx, attr, style, vDomIndex) {
    this.ctx = ctx
    this.dom = {}
    this.attr = attr || {}
    this.style = style || {}
    this.vDomIndex = vDomIndex
    this.program = getProgram(ctx, shaders('line'))
    this.colorBuffer = ctx.createBuffer()
    this.positionBuffer = ctx.createBuffer()
    this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position')
    this.colorAttributeLocation = ctx.getAttribLocation(this.program, 'a_color')
    this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution')
    this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate')
    this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale')
    this.polyLineArray = []
    // this.colorArray = []
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
    }]
    if (!this.attr.transform) {
      this.attr.transform = {
        translate: [0.0, 0.0],
        scale: [1.0, 1.0]
      }
    }
  }
  RenderWebglPolyLines.prototype.remove = function (position) {
    this.polyLineArray.splice(position, 1)
  }
  RenderWebglPolyLines.prototype.execute = function (stack) {
    let node
    let fill
    let points

    if (!this.attr.transform.scale) {
      this.attr.transform.scale = [1.0, 1.0]
    }
    if (!this.attr.transform.translate) {
      this.attr.transform.translate = [0.0, 0.0]
    }

    this.ctx.useProgram(this.program)
    this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio)
    this.ctx.uniform2fv(this.translationUniformLocation, [this.attr.transform.translate[0], this.attr.transform.translate[1]])
    this.ctx.uniform2fv(this.scaleUniformLocation, [this.attr.transform.scale[0], this.attr.transform.scale[1]])

    for (let i = 0, len = stack.length; i < len; i++) {
      node = stack[i]
      fill = node.style.stroke
      points = node.attr.points
      fill = fill || defaultColor
      if (node.propChanged) {
        let positionArray = []
        for (let j = 0, jlen = points.length; j < jlen; j++) {
          positionArray[j * 2] = points[j].x
          positionArray[j * 2 + 1] = points[j].y
        }
        if (!this.polyLineArray[i]) {
          this.polyLineArray[i] = {}
        }
        this.polyLineArray[i].positionArray = new Float32Array(positionArray)
      }

      if (node.styleChanged) {
        let colorArray = []
        let r = fill.r || 0
        let g = fill.g || 0
        let b = fill.b || 0
        let a = (fill.a === undefined ? 255 : fill.a)
        for (let j = 0, jlen = points.length; j < jlen; j++) {
          colorArray[j * 4] = r
          colorArray[j * 4 + 1] = g
          colorArray[j * 4 + 2] = b
          colorArray[j * 4 + 3] = a
        }
        this.polyLineArray[i].colorArray = new Uint8Array(colorArray)
      }

      this.inputs[0].data = this.polyLineArray[i].colorArray
      this.inputs[1].data = this.polyLineArray[i].positionArray
      writeDataToShaderAttributes(this.ctx, this.inputs)
      this.ctx.drawArrays(this.ctx.LINE_STRIP, 0, this.polyLineArray[i].positionArray.length / 2)
    }
  }

  function RenderWebglPolygons (ctx, attr, style, vDomIndex) {
    this.ctx = ctx
    this.dom = {}
    this.attr = attr || {}
    this.style = style || {}
    this.vDomIndex = vDomIndex
    this.program = getProgram(ctx, shaders('line'))
    this.colorBuffer = ctx.createBuffer()
    this.positionBuffer = ctx.createBuffer()
    this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position')
    this.colorAttributeLocation = ctx.getAttribLocation(this.program, 'a_color')
    this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution')
    this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate')
    this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale')
    this.polygonArray = []
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
    }]
    if (!this.attr.transform) {
      this.attr.transform = {
        translate: [0.0, 0.0],
        scale: [1.0, 1.0]
      }
    }
  }
  RenderWebglPolygons.prototype.remove = function (position) {
    this.polygonArray.splice(position, 1)
  }
  RenderWebglPolygons.prototype.execute = function (stack) {
    this.ctx.useProgram(this.program)

    if (!this.attr.transform.scale) {
      this.attr.transform.scale = [1.0, 1.0]
    }
    if (!this.attr.transform.translate) {
      this.attr.transform.translate = [0.0, 0.0]
    }
    this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio)
    this.ctx.uniform2fv(this.translationUniformLocation, [this.attr.transform.translate[0], this.attr.transform.translate[1]])
    this.ctx.uniform2fv(this.scaleUniformLocation, [this.attr.transform.scale[0], this.attr.transform.scale[1]])

    for (var i = 0, len = stack.length; i < len; i++) {
      let node = stack[i]
      let points = node.attr.triangulatedPoints
      if (node.propChanged) {
        let positionArray = []
        for (let j = 0, jlen = points.length; j < jlen; j++) {
          positionArray[j * 2] = points[j].x
          positionArray[j * 2 + 1] = points[j].y
        }
        if (!this.polygonArray[i]) {
          this.polygonArray[i] = {}
        }
        this.polygonArray[i].positionArray = new Float32Array(positionArray)
      }

      if (node.styleChanged) {
        let colorArray = []
        let fill = node.style.fill
        fill = fill || defaultColor
        let r = fill.r || 0
        let g = fill.g || 0
        let b = fill.b || 0
        let a = (fill.a === undefined ? 255 : fill.a)
        for (let j = 0, jlen = points.length; j < jlen; j++) {
          colorArray[j * 4] = r
          colorArray[j * 4 + 1] = g
          colorArray[j * 4 + 2] = b
          colorArray[j * 4 + 3] = a
        }
        this.polygonArray[i].colorArray = new Uint8Array(colorArray)
      }
      this.inputs[0].data = this.polygonArray[i].colorArray
      this.inputs[1].data = this.polygonArray[i].positionArray
      writeDataToShaderAttributes(this.ctx, this.inputs)

      this.ctx.drawArrays(this.ctx.TRIANGLES, 0, this.polygonArray[i].positionArray.length / 2)
    }
  }

  function RenderWebglCircles (ctx, attr, style, vDomIndex) {
    this.ctx = ctx
    this.dom = {}
    this.attr = attr || {}
    this.style = style || {}
    this.vDomIndex = vDomIndex
    this.program = getProgram(ctx, shaders('circle'))
    this.colorBuffer = ctx.createBuffer()
    this.radiusBuffer = ctx.createBuffer()
    this.positionBuffer = ctx.createBuffer()
    this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position')
    this.colorAttributeLocation = ctx.getAttribLocation(this.program, 'a_color')
    this.radiusAttributeLocation = ctx.getAttribLocation(this.program, 'a_radius')
    this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution')
    this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate')
    this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale')
    this.positionArray = []
    this.colorArray = []
    this.radius = []
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
    }]
    if (!this.attr.transform) {
      this.attr.transform = {
        translate: [0.0, 0.0],
        scale: [1.0, 1.0]
      }
    }
  }
  RenderWebglCircles.prototype.remove = function (position) {
    this.positionArray.splice(position * 2, 2)
    this.radius.splice(position, 1)
    this.colorArray.splice(position * 4, 4)
  }
  RenderWebglCircles.prototype.execute = function (stack) {
    this.ctx.useProgram(this.program)
    if (!this.attr.transform.scale) {
      this.attr.transform.scale = [1.0, 1.0]
    }
    if (!this.attr.transform.translate) {
      this.attr.transform.translate = [0.0, 0.0]
    }
    this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio)
    this.ctx.uniform2fv(this.translationUniformLocation, [this.attr.transform.translate[0], this.attr.transform.translate[1]])
    this.ctx.uniform2fv(this.scaleUniformLocation, [this.attr.transform.scale[0], this.attr.transform.scale[1]])
    let positionArray = this.positionArray
    let colorArray = this.colorArray
    let radius = this.radius
    let attrFlag
    let styleFlag
    for (var i = 0, len = stack.length; i < len; i++) {
      let node = stack[i]
      let fill = node.style.fill
      fill = fill || defaultColor
      if (node.propChanged) {
        positionArray[i * 2] = node.attr.cx
        positionArray[i * 2 + 1] = node.attr.cy
        radius[i] = node.attr.r * ratio
        node.propChanged = false
        attrFlag = true
      }
      if (node.styleChanged) {
        colorArray[i * 4] = fill.r
        colorArray[i * 4 + 1] = fill.g
        colorArray[i * 4 + 2] = fill.b
        colorArray[i * 4 + 3] = (fill.a === undefined ? 255 : fill.a)
        node.styleChanged = false
        styleFlag = true
      }
    }

    if (attrFlag) {
      this.inputs[2].data = new Float32Array(positionArray)
      this.inputs[1].data = new Float32Array(radius)
    }

    if (styleFlag) {
      this.inputs[0].data = new Uint8Array(colorArray)
    }
    writeDataToShaderAttributes(this.ctx, this.inputs)
    this.ctx.drawArrays(this.ctx.POINTS, 0, positionArray.length / 2)
  }

  function RenderWebglImages (ctx, attr, style, vDomIndex) {
    this.ctx = ctx
    this.dom = {}
    this.attr = attr || {}
    this.style = style || {}
    this.vDomIndex = vDomIndex
    this.program = getProgram(ctx, shaders('image'))
    this.texture = ctx.createTexture()
    this.texCoordBuffer = ctx.createBuffer()
    this.positionBuffer = ctx.createBuffer()
    this.positionAttributeLocation = ctx.getAttribLocation(this.program, 'a_position')
    this.texCoordAttributeLocation = ctx.getAttribLocation(this.program, 'a_texCoord')
    this.resolutionUniformLocation = ctx.getUniformLocation(this.program, 'u_resolution')
    this.translationUniformLocation = ctx.getUniformLocation(this.program, 'u_translate')
    this.scaleUniformLocation = ctx.getUniformLocation(this.program, 'u_scale')
    this.imagesArray = []
    this.texArray = new Float32Array([
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0
    ])
    this.inputs = [{
      bufferType: this.ctx.ARRAY_BUFFER,
      buffer: this.positionBuffer,
      drawType: this.ctx.DYNAMIC_DRAW,
      valueType: this.ctx.FLOAT,
      size: 2,
      attribute: this.positionAttributeLocation
    }]
    if (!this.attr.transform) {
      this.attr.transform = {
        translate: [0.0, 0.0],
        scale: [1.0, 1.0]
      }
    }
  }
  RenderWebglImages.prototype.remove = function (position) {
    this.imagesArray.splice(position, 1)
  }
  RenderWebglImages.prototype.execute = function (stack) {
    this.ctx.enable(this.ctx.BLEND)
    this.ctx.blendFunc(this.ctx.ONE, this.ctx.ONE_MINUS_SRC_ALPHA)
    this.ctx.useProgram(this.program)
    if (!this.attr.transform.scale) {
      this.attr.transform.scale = [1.0, 1.0]
    }
    if (!this.attr.transform.translate) {
      this.attr.transform.translate = [0.0, 0.0]
    }
    this.ctx.uniform2f(this.resolutionUniformLocation, this.ctx.canvas.width / ratio, this.ctx.canvas.height / ratio)
    this.ctx.uniform2fv(this.translationUniformLocation, [this.attr.transform.translate[0], this.attr.transform.translate[1]])
    this.ctx.uniform2fv(this.scaleUniformLocation, [this.attr.transform.scale[0], this.attr.transform.scale[1]])
    writeDataToShaderAttributes(this.ctx, [{
      bufferType: this.ctx.ARRAY_BUFFER,
      data: this.texArray,
      buffer: this.texCoordBuffer,
      drawType: this.ctx.STATIC_DRAW,
      valueType: this.ctx.FLOAT,
      size: 2,
      attribute: this.texCoordAttributeLocation
    }])
    let x1, x2, y1, y2
    let activeTexture = null

    for (var i = 0, len = stack.length; i < len; i++) {
      if (!this.imagesArray[i]) {
        this.imagesArray[i] = {
          positionArray: new Float32Array(12)
        }
      }
      let positionArray = this.imagesArray[i].positionArray
      let node = stack[i]
      if (node.propChanged) {
        x1 = node.attr.x
        x2 = x1 + node.attr.width
        y1 = node.attr.y
        y2 = y1 + node.attr.height
        positionArray[0] = positionArray[4] = positionArray[6] = x1
        positionArray[1] = positionArray[3] = positionArray[9] = y1
        positionArray[2] = positionArray[8] = positionArray[10] = x2
        positionArray[5] = positionArray[7] = positionArray[11] = y2
        node.propChanged = false
      }
      if (!webGLImageTextures[node.attr.src]) {
        continue
      }
      this.inputs[0].data = this.imagesArray[i].positionArray
      writeDataToShaderAttributes(this.ctx, this.inputs)
      if (activeTexture !== webGLImageTextures[node.attr.src]) {
        this.ctx.bindTexture(this.ctx.TEXTURE_2D, webGLImageTextures[node.attr.src])
        activeTexture = webGLImageTextures[node.attr.src]
      }
      this.ctx.drawArrays(this.ctx.TRIANGLES, 0, this.imagesArray[i].positionArray.length / 2)
    }
  }

  function RenderWebglGroup (ctx, attr, style, shader, vDomIndex, shaderObject) {
    let e
    this.ctx = ctx
    switch (shader) {
      case 'rects':
        e = new RenderWebglRects(ctx, attr, style, vDomIndex)
        break
      case 'points':
        e = new RenderWebglPoints(ctx, attr, style, vDomIndex)
        break
      case 'lines':
        e = new RenderWebglLines(ctx, attr, style, vDomIndex)
        break
      case 'polylines':
        e = new RenderWebglPolyLines(ctx, attr, style, vDomIndex)
        break
      case 'polygons':
        e = new RenderWebglPolygons(ctx, attr, style, vDomIndex)
        break
      case 'circles':
        e = new RenderWebglCircles(ctx, attr, style, vDomIndex)
        break
      case 'images':
        e = new RenderWebglImages(ctx, attr, style, vDomIndex)
        break
      default:
        e = null
        break
    }
    this.shader = e
  }
  RenderWebglGroup.prototype.execute = function (stack) {
    this.shader.execute(stack)
  }

  function WebglNodeExe (ctx, config, id, vDomIndex) {
    this.ctx = ctx
    this.style = config.style ? config.style : {}
    this.attr = config.attr ? config.attr : {}
    this.id = id
    this.nodeName = config.el
    this.nodeType = 'WEBGL'
    this.children = []
    this.ctx = ctx
    this.vDomIndex = vDomIndex
    this.el = config.el
    this.shaderType = config.shaderType

    switch (config.el) {
      case 'point':
        this.dom = new PointNode(this.attr, this.style)
        break
      case 'rect':
        this.dom = new RectNode(this.attr, this.style)
        break
      case 'line':
        this.dom = new LineNode(this.attr, this.style)
        break
      case 'polyline':
        this.dom = new PolyLineNode(this.attr, this.style)
        break
      case 'polygon':
        this.dom = new PolygonNode(this.attr, this.style)
        break
      case 'circle':
        this.dom = new CircleNode(this.attr, this.style)
        break
      case 'image':
        this.dom = new ImageNode(ctx, this.attr, this.style)
        break
      case 'group':
        this.dom = new RenderWebglGroup(this.ctx, this.attr, this.style, this.shaderType, this.vDomIndex, config.shaderObject)
        break
      default:
        this.dom = null
        break
    }
    this.dom.nodeExe = this
    this.propChanged = true
  }

  WebglNodeExe.prototype.setAttr = function WsetAttr (attr, value) {
    if (arguments.length === 2) {
      this.attr[attr] = value
      this.dom.setAttr(attr, value)
    } else if (arguments.length === 1 && typeof attr === 'object') {
      for (let key in attr) {
        this.attr[key] = attr[key]
        this.dom.setAttr(key, attr[key])
      }
    }
    this.propChanged = true
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  WebglNodeExe.prototype.setStyle = function WsetStyle (attr, value) {
    if (arguments.length === 2) {
      if (attr === 'fill' || attr === 'stroke') {
        value = colorMap.colorToRGB(value)
      }
      this.style[attr] = value
    } else if (arguments.length === 1 && typeof attr === 'object') {
      for (let key in attr) {
        value = attr[key]
        if (key === 'fill' || key === 'stroke') {
          value = colorMap.colorToRGB(attr[key])
        }
        this.style[key] = value
      }
    }
    this.styleChanged = true
    queueInstance.vDomChanged(this.vDomIndex)
    return this
  }
  WebglNodeExe.prototype.getAttr = function WgetAttribute (_) {
    return this.attr[_]
  }
  WebglNodeExe.prototype.getStyle = function WgetStyle (_) {
    return this.style[_]
  }
  WebglNodeExe.prototype.animateTo = animateTo
  WebglNodeExe.prototype.animateExe = animateExe

  WebglNodeExe.prototype.execute = function Cexecute () {
    // this.stylesExe()
    // this.attributesExe()
    if (!this.dom.shader && this.dom instanceof RenderWebglGroup) {
      for (let i = 0, len = this.children.length; i < len; i += 1) {
        this.children[i].execute()
      }
    } else if (this.dom.shader) {
      this.dom.execute(this.children)
    }
  }

  WebglNodeExe.prototype.child = function child (childrens) {
    const self = this
    if (self.dom instanceof RenderWebglGroup) {
      for (let i = 0; i < childrens.length; i += 1) {
        childrens[i].dom.parent = self
        childrens[i].nindex = self.children.length
        self.children[self.children.length] = childrens[i]
      }
    } else { console.log('Error') }

    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)
    return self
  }
  WebglNodeExe.prototype.fetchEl = cfetchEl
  WebglNodeExe.prototype.fetchEls = cfetchEls
  WebglNodeExe.prototype.join = dataJoin
  WebglNodeExe.prototype.createEls = function CcreateEls (data, config) {
    const e = new CreateElements({ type: 'WEBGL', ctx: this.dom.ctx }, data, config, this.vDomIndex)
    this.child(e.stack)
    queueInstance.vDomChanged(this.vDomIndex)
    return e
  }

  WebglNodeExe.prototype.createEl = function WcreateEl (config) {
    const e = new WebglNodeExe(this.ctx, config, domId(), this.vDomIndex)
    this.child([e])
    queueInstance.vDomChanged(this.vDomIndex)
    return e
  }

  WebglNodeExe.prototype.createShaderEl = function createShader (shaderObject) {
    const e = new RenderWebglShader(this.ctx, shaderObject, this.vDomIndex)
    this.child([e])
    queueInstance.vDomChanged(this.vDomIndex)
    return e
  }

  WebglNodeExe.prototype.remove = function Wremove () {
    const { children } = this.dom.parent
    const index = children.indexOf(this)
    if (index !== -1) {
      children.splice(index, 1)
      if (this.dom.parent.dom.shader) {
        this.dom.parent.dom.shader.remove(index)
      }
    }
    this.BBoxUpdate = true
    queueInstance.vDomChanged(this.vDomIndex)
  }
  WebglNodeExe.prototype.removeChild = function WremoveChild (obj) {
    let index = -1
    this.children.forEach((d, i) => {
      if (d === obj) { index = i }
    })
    if (index !== -1) {
      const removedNode = this.children.splice(index, 1)[0]
      this.dom.removeChild(removedNode.dom)
    }

    queueInstance.vDomChanged(this.vDomIndex)
  }

  i2d.WebglLayer = function WebGLLayer (context, config) {
    const res = document.querySelector(context)
    const height = config.height ? config.height : res.clientHeight
    const width = config.width ? config.width : res.clientWidth
    const clearColor = config.clearColor ? color.colorToRGB(config.clearColor) : { r: 0, g: 0, b: 0, a: 0 }
    const layer = document.createElement('canvas')
    const ctx = layer.getContext('webgl', {
      premultipliedAlpha: false,
      depth: false,
      antialias: true,
      alpha: true
    })
    ratio = getPixlRatio(ctx)

    layer.setAttribute('height', height * ratio)
    layer.setAttribute('width', width * ratio)
    layer.style.height = `${height}px`
    layer.style.width = `${width}px`
    layer.style.position = 'absolute'
    res.appendChild(layer)

    const vDomInstance = new VDom()
    const vDomIndex = queueInstance.addVdom(vDomInstance)

    const root = new WebglNodeExe(ctx, {
      el: 'group',
      attr: {
        id: 'rootNode'
      }
    }, domId(), vDomIndex)

    const execute = root.execute.bind(root)
    root.container = res
    root.domEl = layer
    root.height = height
    root.width = width
    root.type = 'WEBGL'
    root.pixelRatio = ratio

    ctx.clearColor(clearColor.r, clearColor.g, clearColor.b, clearColor.a)
    root.execute = function executeExe () {
      this.ctx.viewport(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
      this.ctx.clear(this.ctx.COLOR_BUFFER_BIT | this.ctx.DEPTH_BUFFER_BIT)
      execute()
    }
    root.destroy = function () {
      queueInstance.removeVdom(vDomIndex)
    }
    vDomInstance.root(root)

    if (config.resize) {
      window.addEventListener('resize', function () {
        root.resize()
      })
    }
    queueInstance.execute()
    return root
  }

  i2d.Path = path.instance
  i2d.queue = queueInstance
  i2d.geometry = t2DGeometry
  i2d.chain = chain
  i2d.color = colorMap
  i2d.easy = easing
  // i2d.shader = shader

  return i2d
}))


/***/ }),

/***/ "./src/shaders.js":
/*!************************!*\
  !*** ./src/shaders.js ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* eslint-disable no-undef */
(function easing (root, factory) {
  const i2d = root
  if ( true && module.exports) {
    module.exports = factory()
  } else if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (() => factory()).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
  } else {}
}(this, () => {
  'use strict'
  function shaders (el) {
    let res
    switch (el) {
      case 'point':
        res = {
          vertexShader: `
          attribute vec2 a_position;
          attribute vec4 a_color;
          attribute float a_size;
          
          uniform vec2 u_resolution;
          uniform vec2 u_translate;
          uniform vec2 u_scale;
          
          varying vec4 v_color;
          void main() {
            vec2 zeroToOne = (u_scale * (a_position + u_translate)) / u_resolution;
            vec2 clipSpace = ((zeroToOne) * 2.0) - 1.0;
            gl_Position = vec4((clipSpace * vec2(1, -1)), 0, 1);
            gl_PointSize = a_size;
            v_color = a_color;
          }
          `,
          fragmentShader: `
                    precision mediump float;
                    varying vec4 v_color;
                    void main() {
                        gl_FragColor = v_color;
                    }
                    `
        }
        break
      case 'circle':
        res = {
          vertexShader: `
          attribute vec2 a_position;
          attribute vec4 a_color;
          attribute float a_radius;
          uniform vec2 u_resolution;
          uniform vec2 u_translate;
          uniform vec2 u_scale;
          varying vec4 v_color;
          void main() {
            vec2 zeroToOne = (u_scale * (a_position + u_translate)) / u_resolution;
            vec2 zeroToTwo = zeroToOne * 2.0;
            vec2 clipSpace = zeroToTwo - 1.0;
            gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
            gl_PointSize = a_radius;
            v_color = a_color;
          }
          `,
          fragmentShader: `
                    precision mediump float;
                    varying vec4 v_color;
                    void main() {
                      float r = 0.0, delta = 0.0, alpha = 1.0;
                      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                      r = dot(cxy, cxy);
                      if(r > 1.0) {
                        discard;
                      }
                      delta = 0.09;
                      alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);                      
                      gl_FragColor = v_color * alpha;
                    }
                    `
        }
        break
      case 'image':
        res = {
          vertexShader: `
                    attribute vec2 a_position;
                    attribute vec2 a_texCoord;
                    uniform vec2 u_resolution;
                    uniform vec2 u_translate;
                    uniform vec2 u_scale;
                    varying vec2 v_texCoord;
                    void main() {
                      vec2 zeroToOne = (u_scale * (a_position + u_translate)) / u_resolution;
                      vec2 clipSpace = zeroToOne * 2.0 - 1.0;
                      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                      v_texCoord = a_texCoord;
                    }
          `,
          fragmentShader: `
                    precision mediump float;
                    uniform sampler2D u_image;
                    varying vec2 v_texCoord;
                    void main() {
                      gl_FragColor = texture2D(u_image, v_texCoord);
                    }
                    `
        }
        break
      default:
        res = {
          vertexShader: `
                    attribute vec2 a_position;
                    attribute vec4 a_color;
                    uniform vec2 u_resolution;
                    uniform vec2 u_translate;
                    uniform vec2 u_scale;
                    varying vec4 v_color;
                    void main() {
                    vec2 zeroToOne = (u_scale * (a_position + u_translate)) / u_resolution;
                    vec2 clipSpace = zeroToOne * 2.0 - 1.0;
                    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                    v_color = a_color;
                    }
                    `,
          fragmentShader: `
                    precision mediump float;
                    varying vec4 v_color;
                    void main() {
                        gl_FragColor = v_color;
                    }
                    `
        }
    }
    return res
  }

  return shaders
}))


/***/ }),

/***/ "./src/vDom.js":
/*!*********************!*\
  !*** ./src/vDom.js ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* eslint-disable no-undef */
;(function vDom (root, factory) {
  if ( true && module.exports) {
    module.exports = factory()
  } else if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = (geometry => factory()).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
  } else {}
}(this, (geometry) => {
  'use strict'
  function VDom () {}
  VDom.prototype.execute = function execute () {
    this.root.execute()
    this.stateModified = false
  }
  VDom.prototype.root = function root (_) {
    this.root = _
    this.stateModified = true
  }
  VDom.prototype.eventsCheck = function eventsCheck (nodes, mouseCoor, rawEvent) {
    const self = this
    let node,
      temp

    for (var i = 0; i <= nodes.length - 1; i += 1) {
      var d = nodes[i]
      var coOr = { x: mouseCoor.x, y: mouseCoor.y }
      transformCoOr(d, coOr)
      if (d.in({ x: coOr.x, y: coOr.y })) {
        if (d.children && d.children.length > 0) {
          temp = self.eventsCheck(d.children, { x: coOr.x, y: coOr.y }, rawEvent)
          if (temp) {
            node = temp
          }
        } else {
          node = d
        }
      // callInEvents(d, rawEvent)
      }
    // else {
    //   // callOutEvents(d, rawEvent)
    // }
    }
    return node
  }

  VDom.prototype.transformCoOr = transformCoOr

  // function callInEvents (node, e) {
  //   if ((node.dom.mouseover || node.dom.mouseenter) && !node.hovered) {
  //     if (node.dom.mouseover) {
  //       node.dom.mouseover.call(node, node.dataObj, e)
  //     }
  //     if (node.dom.mouseenter) {
  //       node.dom.mouseenter.call(node, node.dataObj, e)
  //     }
  //     node.hovered = true

  //     if (selectedNode && selectedNode.dom.drag && selectedNode.dom.drag.onDragStart) {
  //       selectedNode.dom.drag.dragStartFlag = true
  //       selectedNode.dom.drag.onDragStart.call(selectedNode, selectedNode.dataObj, e)
  //       let event = {}
  //       event.x = e.offsetX
  //       event.y = e.offsetY
  //       event.dx = 0
  //       event.dy = 0
  //       selectedNode.dom.drag.event = event
  //     }

  //     if (node && node.dom.drag && node.dom.drag.dragStartFlag && node.dom.drag.onDrag) {
  //       let event = node.dom.drag.event
  //       if (node.dom.drag.event) {
  //         event.dx = e.offsetX - event.x
  //         event.dy = e.offsetY - event.y
  //       }
  //       event.x = e.offsetX
  //       event.y = e.offsetY
  //       node.dom.drag.event = event
  //       node.dom.drag.onDrag.call(node, node.dataObj, event)
  //     }
  //   }
  // }

  // function callOutEvents (node, e) {
  //   if ((node.dom.mouseout || node.dom.mouseleave) && node.hovered) {
  //     if (node.dom.mouseout) {
  //       node.dom.mouseout.call(node, node.dataObj, e)
  //     }
  //     if (node.dom.mouseleave) {
  //       node.dom.mouseleave.call(node, node.dataObj, e)
  //     }
  //     node.hovered = false
  //   }
  //   if (node.dom.drag && node.dom.drag.dragStartFlag) {
  //     node.dom.drag.dragStartFlag = false
  //     node.dom.drag.onDragEnd.call(node, node.dataObj, e)
  //     node.dom.drag.event = null
  //   }
  // }

  function transformCoOr (d, coOr) {
    let hozMove = 0
    let verMove = 0
    let scaleX = 1
    let scaleY = 1
    const coOrLocal = coOr

    if (d.attr.transform && d.attr.transform.translate) {
      [hozMove, verMove] = d.attr.transform.translate
      coOrLocal.x -= hozMove
      coOrLocal.y -= verMove
    }

    if (d.attr.transform && d.attr.transform.scale) {
      scaleX = d.attr.transform.scale[0] !== undefined ? d.attr.transform.scale[0] : 1
      scaleY = d.attr.transform.scale[1] !== undefined ? d.attr.transform.scale[1] : scaleX
      coOrLocal.x /= scaleX
      coOrLocal.y /= scaleY
    }

    if (d.attr.transform && d.attr.transform.rotate) {
      const rotate = d.attr.transform.rotate[0]
      // const { BBox } = d.dom
      const cen = {
        x: d.attr.transform.rotate[1],
        y: d.attr.transform.rotate[2]
      }
      // {
      //   x: (BBox.x + (BBox.width / 2) - hozMove) / scaleX,
      //   y: (BBox.y + (BBox.height / 2) - verMove) / scaleY
      // }
      // const dis = t2DGeometry.getDistance(cen, coOr)
      // const angle = Math.atan2(coOr.y - cen.y, coOr.x - cen.x)

      let x = coOrLocal.x
      let y = coOrLocal.y
      let cx = cen.x
      let cy = cen.y

      var radians = (Math.PI / 180) * rotate
      var cos = Math.cos(radians)
      var sin = Math.sin(radians)

      coOrLocal.x = (cos * (x - cx)) + (sin * (y - cy)) + cx
      coOrLocal.y = (cos * (y - cy)) - (sin * (x - cx)) + cy
    }
  }

  const vDomInstance = function vDomInstance () {
    return new VDom()
  }

  return vDomInstance
}))


/***/ })

/******/ });
});