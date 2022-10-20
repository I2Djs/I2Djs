/* eslint-disable no-undef */
function shaders(el) {
    let res;

    switch (el) {
        case "point":
            res = {
                vertexShader: `#version 300 es
                    precision highp float;
                    in vec2 a_position;
                    in vec4 a_color;
                    in float a_size;
                    in mat3 a_transformMatrix;
                    out vec4 v_color;
                    void main() {
                      gl_Position = vec4(a_transformMatrix * vec3(a_position, 1), 1);
                      gl_PointSize = a_size;
                      v_color = a_color;
                    }
                    `,
                fragmentShader: `#version 300 es
                    precision mediump float;
                    in vec4 v_color;
                    out vec4 fragColor;
                    void main() {
                        fragColor = v_color;
                    }
                    `,
            };
            break;

        case "circle":
            res = {
                vertexShader: `#version 300 es
                    precision highp float;
                    in vec2 a_position;
                    in vec4 a_color;
                    in float a_radius;
                    in mat3 a_transformMatrix;
                    out vec4 v_color;

                    void main() {
                      gl_Position = vec4(a_transformMatrix * vec3(a_position, 1), 1);
                      gl_PointSize = a_radius; // * a_transform.z * u_transform.z;
                      v_color = a_color;
                    }
                    `,
                fragmentShader: `#version 300 es
                    precision mediump float;
                    in vec4 v_color;
                    out vec4 fragColor;
                    void main() {
                      float r = 0.0, delta = 0.0, alpha = 1.0;
                      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
                      r = dot(cxy, cxy);
                      if(r > 1.0) {
                        discard;
                      }
                      delta = 0.09;
                      alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
                      fragColor = v_color * alpha;
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
                vertexShader: `#version 300 es
                    precision highp float;
                    in vec2 a_position;
                    in vec2 a_texCoord;
                    uniform mat3 u_transformMatrix;
                    out vec2 v_texCoord;

                    void main() {
                      gl_Position = vec4(u_transformMatrix * vec3(a_position, 1), 1);
                      v_texCoord = a_texCoord;
                    }
          `,
                fragmentShader: `#version 300 es
                    precision mediump float;
                    uniform sampler2D u_image;
                    uniform float u_opacity;
                    in vec2 v_texCoord;
                    out vec4 fragColor;
                    void main() {
                      vec4 col = texture(u_image, v_texCoord);
                      if (col.a == 0.0) {
                        discard;
                      } else {
                        fragColor = col;
                        fragColor.a *= u_opacity;
                      }
                    }
                    `,
            };
            break;

        case "polyline":
        case "polygon":
            res = {
                vertexShader: `#version 300 es
                    precision highp float;
                    in vec2 a_position;
                    uniform mat3 u_transformMatrix;

                    void main() {
                      gl_Position = vec4(u_transformMatrix * vec3(a_position, 1), 1);
                    }
                    `,
                fragmentShader: `#version 300 es
                    precision mediump float;
                    uniform vec4 u_color;
                    out vec4 fragColor;
                    void main() {
                        fragColor = u_color;
                    }
                    `,
            };
            break;

        case "rect":
            res = {
                vertexShader: `#version 300 es
                    precision highp float;
                    in vec2 a_position;
                    in vec4 a_color;
                    in mat3 a_transformMatrix;
                    out vec4 v_color;

                    void main() {
                      gl_Position = vec4(a_transformMatrix * vec3(a_position, 1), 1);
                      v_color = a_color;
                    }
                    `,
                fragmentShader: `#version 300 es
                    precision mediump float;
                    in vec4 v_color;
                    out vec4 fragColor;
                    void main() {
                      fragColor = v_color;
                    }
                    `,
            };
            break;

        case "line":
            res = {
                vertexShader: `#version 300 es
                    precision highp float;
                    in vec2 a_position;
                    in vec4 a_color;
                    in mat3 a_transformMatrix;
                    out vec4 v_color;

                    void main() {
                      gl_Position = vec4(a_transformMatrix * vec3(a_position, 1), 1);
                      v_color = a_color;
                    }
                    `,
                fragmentShader: `#version 300 es
                    precision mediump float;
                    in vec4 v_color;
                    out vec4 fragColor;
                    void main() {
                        fragColor = v_color;
                    }
                    `,
            };
            break;

        default:
            res = {
                vertexShader: `#version 300 es
                    precision highp float;
                    in vec2 a_position;
                    in vec4 a_color;
                    in mat3 a_transformMatrix;
                    out vec4 v_color;

                    void main() {
                      gl_Position = vec4(a_transformMatrix * vec3(a_position, 1), 1);
                      v_color = a_color;
                    }
                    `,
                fragmentShader: `#version 300 es
                    precision mediump float;
                    in vec4 v_color;
                    out vec4 fragColor;
                    void main() {
                      fragColor = v_color;
                    }
                    `,
            };
    }

    return res;
}

export default shaders;
