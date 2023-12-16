module.exports = {
    root: true,
    env: {
        browser: true,
        es6: true,
    },
    globals: {
        Image: true,
        Path2D: true,
        Canvas: true,
    },
    extends: ["standard", "plugin:prettier/recommended"],
    rules: {
        "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    },
};
