"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrackingNumber = void 0;
const getTrackingNumber = () => {
    return `TRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};
exports.getTrackingNumber = getTrackingNumber;
// TRK-YYYYMMDD-xxxxxx
