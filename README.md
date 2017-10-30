<p align="center"> 
  <img src="https://avatars0.githubusercontent.com/u/32986301?s=200&v=4">
</p>
Integrated-2D Js is a Javascript framework, with same API interface for rendering on both 2D graphic for SVG and Canvas contexts. It's simple syntax and symantics lets you combine the power of Vector graphics and Bitmap to achieve complex visualizations easily.

i2D is based on mini Virtual Doms, every renderer instance creates its own mini Vdom, for efficient rendering.

It even provides Data Join, similar to [D3](https://d3js.org/), to help you bind data to VDom Nodes.

## Installing

Download source code from below links

* [i2D.js](https://raw.githubusercontent.com/g2djs/G2Djs/master/dist/g2d.js) 
* [i2D.min.js](https://raw.githubusercontent.com/g2djs/G2Djs/master/dist/g2d.min.js) 

## Initialising

To begin, we need container in which context will be rendered.

``` <div id="container"> </div> ```

### i2D Layer creation

For SVG Layer:
  ```javascript
    var svgRenderer = i2D.SVGLayer(containerId,config)
  ```
  
For Canvas Layer: 
   ```javascript
    var canvasRenderer = i2D.CanvasLayer(containerId,config)
  ```
  As many layers as needed can be created using above syntax. 
    