<p align="center">
  <img src="https://github.com/I2Djs/I2Djs/blob/master/i2djsLogo.png?raw=true" width=500>
</p>

# Integrated-2D js [![npm](https://img.shields.io/npm/v/i2djs.svg)](https://www.npmjs.com/package/i2djs)

### I2dJs - SVG | Canvas | WebGL | PDF

Integrated-2D - is an Open source Javascript framework for rendering 2D graphics on SVG, Canvas, WebGL and PDF contexts. I2D's simple syntax and semantics lets you combine the power of Vector graphics and Bitmap to achieve complex visualizations easily.

I2Djs provides same Application Programming Interface to create and animate elements across different graphic rendering contexts by leveraging their underlying capabilities. Developers can make use of I2D's multi-layered contextual approach with capabilities from more than one context seamlessly for creating powerful composite visualizations under a single roof.

I2D also provides a unique data-driven approach, **join-actions**, for DOM manipulation based on data binding.

Used by : <a href="https://www.pdf-frame.org"> www.pdf-frame.org </a>

## Documentation

<a href="https://nswamy14.gitbook.io/i2djs-v5/"><img width='150' src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/gitbookIcon.png"></a>

## Installing

If npm

```
npm install i2djs --save
```

I2Djs provides source code bundles for ES6 and CJS modules.

-   [i2D.cjs](https://raw.githubusercontent.com/I2djs/I2D/master/dist/i2d.cjs) CommonJS bundle
-   [i2D.esm.js](https://raw.githubusercontent.com/I2djs/I2D/master/dist/i2d.esm.js) ES6 bundle
-   [i2D.esm.min.js](https://raw.githubusercontent.com/I2djs/I2D/master/dist/i2d.esm.min.js) ES6 bundle

In ES6, use below syntax to import modules.

Import all modules into namespace

```
import * as i2d from 'i2djs'
```

Importing individual modules:

```
import {canvasLayer} from 'i2djs'
import {svgLayer} from 'i2djs'
import {webglLayer} from 'i2djs'
import {pdfLayer} from 'i2djs'
```

## Resources

-   [API reference](https://nswamy14.gitbook.io/i2djs-v5)
-   [I2Djs Medium Article](https://medium.com/@narayanaswamy14/i2djs-integrated-2d-js-328549ef642)

## Animation Example

<table>
    <tr>
      <td width="33%"><a href="https://codepen.io/nswamy14/pen/WNvdqJg">
        <img src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/gameloop.gif">
        </a>
      </td>
      <td width="33%"><a href="https://i2djs.github.io/I2Djs/examples/gameResources/I2Djs-matterjs-webgl.html">
        <img src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/anime-2.gif">
        </a>
      </td>
      <td width="33%"><a href="https://i2djs.github.io/I2Djs/examples/gameResources/I2Djs-matterjs2-canvas.html">
        <img src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/anim-1.gif">
        </a>
      </td>
    </tr>
</table>

## PDF Example

<a href="https://xxsmny.csb.app/">PDF Example-1 </a>

## Examples (SVG + Canvas + WebGL + PDF)

[Codepen Examples](https://codepen.io/search/pens?q=i2djs)

<table>
    <tr>
      <td width="15%"><a href="https://i2djs.github.io/I2Djs/examples/webGL/imagePointsDistortion.html"><img src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/imageDistortion.gif"></a></td>
      <td width="15%"><a href="https://codepen.io/nswamy14/pen/YzXYaXq"><img src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/heatmapGif.gif"></a></td>
      <td width="15%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/mouseEvent2.html"><img src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/mouse2Animation.gif"></a></td>
      <td width="15%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/geoMap.html"><img src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/geoMap.png"></a></td>
      <td width="15%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/mouseEvent.html"><img src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/mouseAnimation.gif"></a></td>
      <td width="15%"><a href="https://codepen.io/nswamy14/pen/WNvdqJg"><img src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/imageAnimation.gif"></a></td>
    </tr>
  <tr>
    <td width="15%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/pathAnimator.html"><img  src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/PathAnimation.gif"></a></td>
    <td width="15%"><a href="https://codepen.io/nswamy14/pen/BVxjog"><img src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/attributeAnimation.gif"></a></td>
    <td width="15%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/pathMorph.html"><img  src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/anime-3.gif"></a></td>
    <td width="15%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/distortion.html"><img  src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/distortion.gif"></a></td>
    <td width="15%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/radarAnimation.html"><img  src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/radarScanner.gif"></a></td>
    <td width="15%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/sparklesAnimation.html"><img  src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/sparkles.gif"></a></td>
  </tr>
  <tr>
     <td width="15%"><a href="https://i2djs.github.io/I2Djs/examples/webGL/I2dAnimation.html"><img  src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/I2DAnimation.gif"></a></td>
    <td width="15%"><a href="https://codepen.io/nswamy14/pen/PEyvyK"><img src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/circleMoveMent.gif"></a></td>
    <td width="15%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/graph.html"><img src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/graph.gif"></a></td>
        <td width="15%"><a href="https://i2djs.github.io/I2Djs/examples/webGL/hugegraph.html"><img src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/hugeGraph.gif"></a></td>
        <td width="15%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/networkSystem.html"><img src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/graphAnimation.gif"></a></td>
  </tr>
</table>

### Basic Shapes

<table>
    <tr>
        <td width="10%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/shapes.html"><img width="45" src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/square.png"></a></td>
        <td width="10%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/shapes.html"><img width="50" src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/circle.png"></a></td>
        <td width="10%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/shapes.html"><img width="50" src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/line.png"></a></td>
      <td width="10%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/shapes.html"><img width="50" src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/polygon.png"></a></td>
      <td width="10%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/shapes.html"><img width="50" src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/ellipse.png"></a></td>
      <td width="10%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/shapes.html"><img width="50" src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/image.png"></a></td>
      <td width="10%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/text.html"><img width="50" src="https://raw.githubusercontent.com/I2Djs/I2Djs/snaps/examples/snaps/text.png"></a></td>
    </tr>
</table>

### Scale

| SVG                                                                            | Canvas                                                                             | WebGl                                                                             |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [5000 Particles ](https://i2djs.github.io/I2Djs/examples/svg/distortion2.html) | [30000 Particles ](https://i2djs.github.io/I2Djs/examples/canvas/distortion2.html) | [100000 Particles ](https://i2djs.github.io/I2Djs/examples/webGL/distortion.html) |

### Support & Compatibility

I2D offers both ESM and CommonJS packages, allowing for seamless integration into the desired environment as required.
It is compatible with all modern browsers with latest versions.

### Development Setup

```bash
# install deps
npm install

# Watch on src file changes and update dist files
npm run dev

# build dist files
rollup -c rollup.config.js

#Lint files
npm run lint
---or---
npm run lint-fix
```
