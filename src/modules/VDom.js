/* eslint-disable no-undef */
function VDom() {}

VDom.prototype.execute = function execute() {
    this.root.execute();
    this.stateModified = false;
};

VDom.prototype.rootNode = function root(_) {
    this.root = _;
    this.stateModified = true;
};

VDom.prototype.eventsCheck = function eventsCheck(nodes, mouseCoor, rawEvent) {
    const self = this;
    let node, temp;

    for (var i = 0; i <= nodes.length - 1; i += 1) {
        var d = nodes[i];
        var coOr = {
            x: mouseCoor.x,
            y: mouseCoor.y,
        };
        transformCoOr(d, coOr);

        if (
            d.in({
                x: coOr.x,
                y: coOr.y,
            })
        ) {
            if (d.children && d.children.length > 0) {
                temp = self.eventsCheck(
                    d.children,
                    {
                        x: coOr.x,
                        y: coOr.y,
                    },
                    rawEvent
                );

                if (temp) {
                    node = temp;
                }
            } else {
                node = d;
            }
        }
    }

    return node;
};

VDom.prototype.transformCoOr = transformCoOr;

// VDom.prototype.onchange = function () {
// 	// this.root.invokeOnChange();
// };

function transformCoOr(d, coOr) {
    let hozMove = 0;
    let verMove = 0;
    let scaleX = 1;
    let scaleY = 1;
    const coOrLocal = coOr;

    if (d.attr.transform && d.attr.transform.translate) {
        [hozMove, verMove] = d.attr.transform.translate;
        coOrLocal.x -= hozMove;
        coOrLocal.y -= verMove;
    }

    if (d.attr.transform && d.attr.transform.scale) {
        scaleX = d.attr.transform.scale[0] !== undefined ? d.attr.transform.scale[0] : 1;
        scaleY = d.attr.transform.scale[1] !== undefined ? d.attr.transform.scale[1] : scaleX;
        coOrLocal.x /= scaleX;
        coOrLocal.y /= scaleY;
    }

    if (d.attr.transform && d.attr.transform.rotate) {
        const rotate = d.attr.transform.rotate[0];

        const cen = {
            x: d.attr.transform.rotate[1],
            y: d.attr.transform.rotate[2],
        };
        const x = coOrLocal.x;
        const y = coOrLocal.y;
        const cx = cen.x;
        const cy = cen.y;
        var radians = (Math.PI / 180) * rotate;
        var cos = Math.cos(radians);
        var sin = Math.sin(radians);
        coOrLocal.x = cos * (x - cx) + sin * (y - cy) + cx;
        coOrLocal.y = cos * (y - cy) - sin * (x - cx) + cy;
    }
}

export default VDom;
