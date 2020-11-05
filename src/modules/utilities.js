import { imageDataRGBA as blur } from "stackblur-canvas";

export default {
    blur: function (radius = 1) {
        function blurExec(imageData) {
            return blur(imageData, 0, 0, imageData.width, imageData.height, radius);
        }
        return blurExec;
    },
    greyScale: function () {},
};
