"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var GameCategory;
(function (GameCategory) {
    GameCategory["basic"] = "basic";
    GameCategory["food"] = "food";
    GameCategory["drinks"] = "drinks";
    GameCategory["alcohol"] = "alcohol";
})(GameCategory = exports.GameCategory || (exports.GameCategory = {}));
var GameState;
(function (GameState) {
    GameState["start"] = "start";
    GameState["talking"] = "talking";
    GameState["decision"] = "decision";
    GameState["end"] = "end";
    GameState["categoryVote"] = "categoryVote";
})(GameState = exports.GameState || (exports.GameState = {}));
var Events;
(function (Events) {
    Events["loadCategories"] = "loadCategories";
    Events["playerChange"] = "playerChange";
    Events["gameChange"] = "gameChange";
    Events["vote"] = "vote";
    Events["changeCategory"] = "changeCategory";
    Events["nameChange"] = "nameChange";
    Events["startCategoryVote"] = "startCategoryVote";
    Events["result"] = "result";
})(Events = exports.Events || (exports.Events = {}));
