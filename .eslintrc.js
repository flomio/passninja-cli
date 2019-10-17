module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: './tsconfig.json'
    },
    plugins: ["@typescript-eslint", "prettier"],
    extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended"
    ],
    overrides: [{
        files: ["bin/**/*", "lib/**/**"],
        excludedFiles: './no_compile'
    }],
    rules: {
        "@typescript-eslint/explicit-function-return-type": 0,
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/interface-name-prefix": [1, "never"]
    }
};
