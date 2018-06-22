(function easing (root, factory) {
  const i2d = root
  if (typeof module === 'object' && module.exports) {
    module.exports = factory()
  } else if (typeof define === 'function' && define.amd) {
    define('shaders', [], () => factory())
  } else {
    i2d.shaders = factory()
  }
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
