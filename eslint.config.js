// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    {
        rules: {
            "@typescript-eslint/member-ordering": [
                "error",
                {
                    default: {
                        memberTypes: ["signature", "field", "constructor", "method"],
                        order: "alphabetically",
                    },
                },
            ],
        },
    },
    {
        files: ["**/*.cjs"],
        languageOptions: {
            globals: { module: "readonly", require: "readonly" },
            sourceType: "commonjs",
        },
    },
    { ignores: ["dist/**", "node_modules/**", "coverage/**", "styled-system/**"] },
);
