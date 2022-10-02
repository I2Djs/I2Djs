import { imageDataRGBA as blur } from "stackblur-canvas";

export default {
    blur: function (radius = 1) {
        function blurExec(imageData) {
            return blur(imageData, 0, 0, imageData.width, imageData.height, radius);
        }
        return blurExec;
    },
    greyScale: function (greyScaleType) {
        let exe = null;
        switch (greyScaleType) {
            case "grey-1":
                exe = function (imgData) {
                    const pixels = imgData.data;
                    let lightness;
                    for (let i = 0, len = pixels.length; i < len; i += 4) {
                        lightness = parseInt(
                            pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114
                        );
                        imgData.data[i] = lightness;
                        imgData.data[i + 1] = lightness;
                        imgData.data[i + 2] = lightness;
                    }
                    return imgData;
                };
                break;
            case "grey-2":
                exe = function (imgData) {
                    const pixels = imgData.data;
                    let lightness;
                    for (let i = 0, len = pixels.length; i < len; i += 4) {
                        lightness = parseInt(
                            (3 * pixels[i] + 4 * pixels[i + 1] + pixels[i + 2]) >>> 3
                        );
                        imgData.data[i] = lightness;
                        imgData.data[i + 1] = lightness;
                        imgData.data[i + 2] = lightness;
                    }
                    return imgData;
                };
                break;
            case "grey-3":
            default:
                exe = function (imgData) {
                    const pixels = imgData.data;
                    let lightness;
                    for (let i = 0, len = pixels.length; i < len; i += 4) {
                        lightness = parseInt(
                            0.2126 * pixels[i] + 0.715 * pixels[i + 1] + 0.0722 * pixels[i + 2]
                        );
                        imgData.data[i] = lightness;
                        imgData.data[i + 1] = lightness;
                        imgData.data[i + 2] = lightness;
                    }
                    return imgData;
                };
                break;
        }
        return exe;
    },
};
