"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// Create an instance of express
const app = (0, express_1.default)();
// Define a port number
const PORT = 3000;
// Define a simple route
app.get("/", (req, res) => {
    res.send("Hello, World from TypeScript!");
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
