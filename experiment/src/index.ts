import express, { Request, Response } from "express";

// Define a port number
const PORT: number = 3000;

// Create an instance of express
const app = express();

import { configureRoutes } from "./service/configure";

configureRoutes(app);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
