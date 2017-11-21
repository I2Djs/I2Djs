<p align="center"> 
  <img src="https://avatars0.githubusercontent.com/u/33233302?s=400&u=5fce4d3bd8100ad7ea284d12b948e5f09444dd55&v=4">
</p>

# Integrated-2D js [![npm](https://img.shields.io/npm/v/i2djs.svg)](https://www.npmjs.com/package/i2djs) [![Downloads](https://img.shields.io/npm/dm/i2djs.svg)](https://www.npmjs.com/package/i2djs)


Integrated-2D is a Javascript framework, for rendering 2D graphics on SVG and Canvas contexts. It's simple syntax and semantics lets you combine the power of Vector graphics and Bitmap to achieve complex visualisations easily.

For efficient rendering I2D creates elements called mini Virtual Doms, virtual representation of render trees.

## Installing

Download source code from below links

* [i2D.js](https://raw.githubusercontent.com/I2djs/I2D/master/dist/i2d.js) 
* [i2D.min.js](https://raw.githubusercontent.com/I2djs/I2D/master/dist/i2d.min.js)

### npm Installation
```
npm install i2djs
```

### To Begin
Lets create a container in which SVG layer will be rendered. SVG viewport will be set as per container dimension
#### Container
```html
<div id="container" >
</div>
```
#### Create Layer
Lets create SVG Layer using below api. It accepts container ID as an input, gives renderer instance as an output. After the below step, we should see SVG element inside the provided container.

```javascript
var layerRenderer = i2d.SVGLayer('#containerId')
```
```
Note :- We can create many layers. Every layer internally will be represented as a mini Virtual Dom (For efficient rendering)
```

#### Create Shape
Lets use renderer instance to create shapes, animate attributes.. etc.
```javascript
  layerRenderer.createEl({
                  el:'rect',
                  attr:{
                      //Attributes goes here
                      height:100,
                      width:100,
                      x:0,
                      y:0
                  },
                  style:{
                    //Styles goes here
                    fill:'red' //if its Canvas renderer, then it will be canvas style attr 'fillStyle'
                  }
              })
```


Resources
---
[API reference](https://github.com/I2djs/I2D/wiki/API-Reference)

Examples (SVG + Canvas)
---

### Basic Shapes
<table>
    <tr>
        <td width="10%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/shapes.html"><img width="50" src="https://i2djs.github.io/I2Djs/examples/snaps/square.png"></a></td>
        <td width="10%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/shapes.html"><img width="50" src="https://i2djs.github.io/I2Djs/examples/snaps/circle.png"></a></td>
        <td width="10%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/shapes.html"><img width="50" src="https://i2djs.github.io/I2Djs/examples/snaps/line.png"></a></td>
      <td width="10%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/shapes.html"><img width="50" src="https://i2djs.github.io/I2Djs/examples/snaps/polygon.png"></a></td>
      <td width="10%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/shapes.html"><img width="50" src="https://i2djs.github.io/I2Djs/examples/snaps/ellipse.png"></a></td>
      <td width="10%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/shapes.html"><img width="50" src="https://i2djs.github.io/I2Djs/examples/snaps/image.png"></a></td>
      <td width="10%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/text.html"><img width="50" src="https://i2djs.github.io/I2Djs/examples/snaps/text.png"></a></td>
    </tr>
</table>

### Animation 
<table>
    <tr>
      <td width="15%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/circleMovementAnimation.html"><img width="100" src="https://i2djs.github.io/I2Djs/examples/snaps/circleMoveMent.gif"></a></td>
      <td width="15%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/mouseEvent2.html"><img width="100" src="https://i2djs.github.io/I2Djs/examples/snaps/mouse2Animation.gif"></a></td>
      <td width="15%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/mouseEvent.html"><img width="100" src="https://i2djs.github.io/I2Djs/examples/snaps/mouseAnimation.gif"></a></td>
      <td width="15%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/image.html"><img width="100" src="https://i2djs.github.io/I2Djs/examples/snaps/imageAnimation.gif"></a></td>
      <td width="15%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/pathAnimator.html"><img width="100" src="https://i2djs.github.io/I2Djs/examples/snaps/PathAnimation.gif"></a></td>
      <td width="15%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/pathMorph.html"><img width="100" src="https://i2djs.github.io/I2Djs/examples/snaps/PathMorphAnimation.gif"></a></td>
    </tr>
  <tr>
    <td width="15%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/solarSystem.html"><img width="100" src="https://i2djs.github.io/I2Djs/examples/snaps/solarAnimation.gif"></a></td>
  </tr>
</table>

### Graphs
<table>
    <tr>
        <td width="25%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/graph.html"><img width="150" src="https://i2djs.github.io/I2Djs/examples/snaps/graph.gif"></a></td>
        <td width="25%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/hugeGraph.html"><img width="150" src="https://i2djs.github.io/I2Djs/examples/snaps/hugeGraph.gif"></a></td>
        <td width="25%"><a href="https://i2djs.github.io/I2Djs/examples/canvas/networkSystem.html"><img width="150" src="https://i2djs.github.io/I2Djs/examples/snaps/graphAnimation.gif"></a></td>
    </tr>
</table>

### Support & Compatibility
I2D is implemented in ES2016. It supports Universal Module Definition(UMD)(AMD,CommonJS and vanilla environments) , based on the environment it can be imported accordingly.
It is compatible with all modern browsers.
    
