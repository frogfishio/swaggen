import express, { Request, Response } from "express";

// Create an instance of express
const app = express();

// Define a port number
const PORT: number = 3000;

// Define a simple route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, World from TypeScript!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
