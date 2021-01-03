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
          
          attribute mat3 a_transformMatrix;
          
          varying vec4 v_color;
          void main() {
            gl_Position = vec4(a_transformMatrix * vec3(a_position, 1), 1);
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
                    attribute mat3 a_transformMatrix;
                    varying vec4 v_color;

                    void main() {
                      gl_Position = vec4(a_transformMatrix * vec3(a_position, 1), 1);
                      gl_PointSize = a_radius; // * a_transform.z * u_transform.z;
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

        // case "ellipse":
        //     res = {
        //         vertexShader: `
        //             precision highp float;
        //               attribute vec2 a_position;
        //               attribute vec4 a_color;
        //               attribute float a_r1;
        //               attribute float a_r2;
        //               uniform vec2 u_resolution;
        //               uniform vec4 u_transform;
        //               attribute vec4 a_transform;
        //               varying vec4 v_color;
        //               varying float v_r1;
        //               varying float v_r2;

        //               void main() {
        //                 vec2 zeroToOne = (a_transform.xy + u_transform.xy + a_position) / u_resolution;
        //                 vec2 clipSpace = (zeroToOne * 2.0 - 1.0);
        //                 gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        //                 gl_PointSize = max(a_r1, a_r2) * a_transform.z * u_transform.z;
        //                 v_color = a_color;
        //                 v_r1 = a_r1;
        //                 v_r2 = a_r2;
        //               }
        //   `,
        //         fragmentShader: `
        //             precision mediump float;
        //             varying vec4 v_color;
        //             varying float v_r1;
        //             varying float v_r2;
        //             void main() {
        //               float r = 0.0, delta = 0.0, alpha = 1.0;
        //               vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        //               r = ((cxy.x * cxy.x) / (v_r1 * v_r1), (cxy.y * cxy.y) / (v_r2 * v_r2));
        //               if(r > 1.0) {
        //                 discard;
        //               }
        //               delta = 0.09;
        //               alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
        //               gl_FragColor = v_color * alpha;
        //             }
        //             `,
        //     };
        //     break;

        case "image":
            res = {
                vertexShader: `
                    precision highp float;
                    attribute vec2 a_position;
                    attribute vec2 a_texCoord;
                    uniform mat3 u_transformMatrix;
                    varying vec2 v_texCoord;

                    void main() {
                      gl_Position = vec4(u_transformMatrix * vec3(a_position, 1), 1);
                      v_texCoord = a_texCoord;
                    }
          `,
                fragmentShader: `
                    precision mediump float;
                    uniform sampler2D u_image;
                    uniform float u_opacity;
                    varying vec2 v_texCoord;
                    void main() {
                      vec4 col = texture2D(u_image, v_texCoord);
                      if (col.a == 0.0) {
                        discard;
                      } else {
                        gl_FragColor = col;
                        gl_FragColor.a *= u_opacity;
                      }
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
                    uniform mat3 u_transformMatrix;

                    void main() {
                      gl_Position = vec4(u_transformMatrix * vec3(a_position, 1), 1);
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

        case "rect":
            res = {
                vertexShader: `
                    precision highp float;
                    attribute vec2 a_position;
                    attribute vec4 a_color;
                    attribute mat3 a_transformMatrix;
                    varying vec4 v_color;

                    void main() {
                      gl_Position = vec4(a_transformMatrix * vec3(a_position, 1), 1);
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

        case "line":
            res = {
                vertexShader: `
                    precision highp float;
                    attribute vec2 a_position;
                    attribute vec4 a_color;
                    attribute mat3 a_transformMatrix;
                    varying vec4 v_color;

                    void main() {
                      gl_Position = vec4(a_transformMatrix * vec3(a_position, 1), 1);
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

        default:
            res = {
                vertexShader: `
                    precision highp float;
                    attribute vec2 a_position;
                    attribute vec4 a_color;
                    attribute mat3 a_transformMatrix;
                    varying vec4 v_color;

                    void main() {
                      gl_Position = vec4(a_transformMatrix * vec3(a_position, 1), 1);
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
