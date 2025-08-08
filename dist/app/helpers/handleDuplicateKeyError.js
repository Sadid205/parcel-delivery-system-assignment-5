"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDuplicateKeyError = void 0;
const handleDuplicateKeyError = (err) => {
    var _a;
    const matchedArray = (_a = err.errorResponse) === null || _a === void 0 ? void 0 : _a.errmsg.match(/"([^"]*)"/);
    const errorSources = [];
    for (const key in err.keyPattern) {
        errorSources.push({
            field: key,
            value: err.keyValue[key],
            message: `${key} '${err.keyValue[key]}' Is Already Taken`,
        });
    }
    return {
        statusCode: 400,
        message: `${matchedArray[1]} Already Exists`,
        errorSources,
    };
};
exports.handleDuplicateKeyError = handleDuplicateKeyError;
