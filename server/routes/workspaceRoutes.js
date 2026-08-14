import express from "express";
import { getuserWorkspaces, addMember } from "../controllers/workspaceController.js";

const workspaceRouter = express.Router();

workspaceRouter.get("/", getuserWorkspaces);
workspaceRouter.post("/add-member", addMember);

export default workspaceRouter;