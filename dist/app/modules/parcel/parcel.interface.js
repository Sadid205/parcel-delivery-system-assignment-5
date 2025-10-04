"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IParcelType = exports.IPaidStatus = exports.Status = void 0;
var Status;
(function (Status) {
    Status["REQUESTED"] = "REQUESTED";
    Status["APPROVED"] = "APPROVED";
    Status["DISPATCHED"] = "DISPATCHED";
    Status["IN_TRANSIT"] = "IN_TRANSIT";
    Status["DELIVERED"] = "DELIVERED";
    Status["CANCELLED"] = "CANCELLED";
    Status["BLOCKED"] = "BLOCKED";
    Status["RETURNED"] = "RETURNED";
    Status["RESCHEDULED"] = "RESCHEDULED";
})(Status || (exports.Status = Status = {}));
var IPaidStatus;
(function (IPaidStatus) {
    IPaidStatus["PAID"] = "PAID";
    IPaidStatus["UNPAID"] = "UNPAID";
})(IPaidStatus || (exports.IPaidStatus = IPaidStatus = {}));
var IParcelType;
(function (IParcelType) {
    IParcelType["DOCUMENT"] = "DOCUMENT";
    IParcelType["BOX"] = "BOX";
    IParcelType["FRAGILE"] = "FRAGILE";
    IParcelType["LIQUID"] = "LIQUID";
    IParcelType["FOOD"] = "FOOD";
    IParcelType["ELECTRONICS"] = "ELECTRONICS";
    IParcelType["OTHER"] = "OTHER";
})(IParcelType || (exports.IParcelType = IParcelType = {}));
