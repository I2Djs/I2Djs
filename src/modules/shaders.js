/* eslint-disable no-undef */
function shaders(el) {
    let res;

    switch (el) {
        case "point":
            res = {
                vertexShader: `
          precision highp float;
          attribute vec2 a_position;
          attribute vec4 a_color;
          attribute float a_size;
          
          uniform vec2 u_resolution;
          uniform vec2 u_translate;
          uniform vec2 u_scale;
          
          varying vec4 v_color;
          void main() {
            vec2 zeroToOne = (u_translate + (u_scale * a_position)) / u_resolution;
            vec2 clipSpace = ((zeroToOne) * 2.0) - 1.0;
            gl_Position = vec4((clipSpace * vec2(1.0, -1.0)), 0, 1);
            gl_PointSize = a_size * u_scale.x;
            v_color = a_color;
          }
          `,
                fragmentShader: `
                    precision mediump float;
                    varying vec4 v_color;
                    void main() {
                        gl_FragColor = v_color;
                    }
                    `,
            };
            break;

        case "circle":
            res = {
                vertexShader: `
        precision highp float;
          attribute vec2 a_position;
          attribute vec4 a_color;
          attribute float a_radius;
          uniform vec2 u_resolution;
          uniform vec2 u_translate;
          uniform vec2 u_scale;
          varying vec4 v_color;
          void main() {
            vec2 zeroToOne = (u_translate + (u_scale * a_position)) / u_resolution;
            vec2 zeroToTwo = zeroToOne * 2.0;
            vec2 clipSpace = zeroToTwo - 1.0;
            gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
            gl_PointSize = a_radius * u_scale.x;
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
                    `,
            };
            break;

        case "ellipse":
            res = {
                vertexShader: `
        precision highp float;
          attribute vec2 a_position;
          attribute vec4 a_color;
          attribute float a_r1;
          attribute float a_r2;
          uniform vec2 u_resolution;
          uniform vec2 u_translate;
          uniform vec2 u_scale;
          varying vec4 v_color;
          varying float v_r1;
          varying float v_r2;
          void main() {
            vec2 zeroToOne = (u_translate + (u_scale * a_position)) / u_resolution;
            vec2 zeroToTwo = zeroToOne * 2.0;
            vec2 clipSpace = zeroToTwo - 1.0;
            gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
            gl_PointSize = max(a_r1, a_r2);
            v_color = a_color;
            v_r1 = a_r1;
            v_r2 = a_r2;
          }
          `,
                fragmentShader: `
                    precision mediump float;
                    varying vec4 v_color;
                    varying float v_r1;
                    varying float v_r2;
                    void main() {
                      float r = 0.0, delta = 0.0, alpha = 1.0;
                      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                      r = ((cxy.x * cxy.x) / (v_r1 * v_r1), (cxy.y * cxy.y) / (v_r2 * v_r2));
                      if(r > 1.0) {
                        discard;
                      }
                      delta = 0.09;
                      alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
                      gl_FragColor = v_color * alpha;
                    }
                    `,
            };
            break;

        case "image":
            res = {
                vertexShader: `
                    precision highp float;
                    attribute vec2 a_position;
                    attribute vec2 a_texCoord;
                    uniform vec2 u_resolution;
                    uniform vec2 u_translate;
                    uniform vec2 u_scale;
                    varying vec2 v_texCoord;
                    void main() {
                      vec2 zeroToOne = (u_translate + (u_scale * a_position)) / u_resolution;
                      vec2 clipSpace = zeroToOne * 2.0 - 1.0;
                      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                      v_texCoord = a_texCoord;
                    }
          `,
                fragmentShader: `
                    precision mediump float;
                    uniform sampler2D u_image;
                    uniform float u_opacity;
                    varying vec2 v_texCoord;
                    void main() {
                      gl_FragColor = texture2D(u_image, v_texCoord);
                      gl_FragColor.a *= u_opacity;
                    }
                    `,
            };
            break;

        case "polyline":
        case "polygon":
            res = {
                vertexShader: `
                    precision highp float;
                    attribute vec2 a_position;
                    uniform vec2 u_resolution;
                    uniform vec2 u_translate;
                    uniform vec2 u_scale;
                    void main() {
                    vec2 zeroToOne = (u_translate + (u_scale * a_position)) / u_resolution;
                    vec2 clipSpace = zeroToOne * 2.0 - 1.0;
                    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                    }
                    `,
                fragmentShader: `
                    precision mediump float;
                    uniform vec4 u_color;
                    void main() {
                        gl_FragColor = u_color;
                    }
                    `,
            };
            break;

        default:
            res = {
                vertexShader: `
                    precision highp float;
                    attribute vec2 a_position;
                    attribute vec4 a_color;
                    uniform vec2 u_resolution;
                    uniform vec2 u_translate;
                    uniform vec2 u_scale;
                    varying vec4 v_color;
                    void main() {
                    vec2 zeroToOne = (u_translate + (u_scale * a_position)) / u_resolution;
                    vec2 clipSpace = zeroToOne * 2.0 - 1.0;
                    gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0, 1);
                    v_color = a_color;
                    }
                    `,
                fragmentShader: `
                    precision mediump float;
                    varying vec4 v_color;
                    void main() {
                        gl_FragColor = v_color;
                    }
                    `,
            };
    }

    return res;
}

export default shaders;
