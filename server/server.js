import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import workspaceRouter from './routes/workspaceRoutes.js';
import { protect } from './middleware/authMiddleware.js';

const app = express();

dotenv.config();

app.use(cors());
app.use(express.json()); 
app.use(clerkMiddleware())

app.get('/', (req, res) => res.send('Welcome to the server!'));

app.use("/api/inngest", serve({client: inngest, functions}));

app.use("/api/workspaces", protect, workspaceRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
