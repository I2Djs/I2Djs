module.exports = {
    extends: "standard",
    globals: {
        'Image': true,
        'Path2D': true
    },
    rules: {
        'no-mixed-operators': [
            "error",
            {
                "groups": [
                    ["+", "-", "*", "/", "%", "**"],
                    ["&", "|", "^", "~", "<<", ">>", ">>>"],
                    ["==", "!=", "===", "!==", ">", ">=", "<", "<="],
                    ["&&", "||"],
                    ["in", "instanceof"]
                ],
                "allowSamePrecedence": true
            }
        ]
    }
};