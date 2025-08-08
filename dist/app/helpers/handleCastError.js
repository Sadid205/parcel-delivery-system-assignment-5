"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCastError = void 0;
const handleCastError = (err) => {
    const errorSources = [];
    errorSources.push({
        path: err.path,
        message: `Invalid ${err.kind}: '${err.value}'`,
    });
    return {
        statusCode: 400,
        message: `Invalid MongoDB Object Id. Please Provide A Valid Object Id`,
        errorSources,
    };
};
exports.handleCastError = handleCastError;
