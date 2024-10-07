"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// Define a port number
const PORT = 3000;
// Create an instance of express
const app = (0, express_1.default)();
const configure_1 = require("./service/configure");
(0, configure_1.configureRoutes)(app);
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
