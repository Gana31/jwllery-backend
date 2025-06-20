import { Router } from "express";
const authRoutes = Router();

import { AddUser, deleteUserByUsername, getalluser, updateProfile, UserLogin } from "../controllers/authContoller.js";
import { auth, roleCheck } from "../middlewares/authMiddleware.js";


authRoutes.post("/login", UserLogin);
authRoutes.post("/AddUser",AddUser)
authRoutes.get("/getalluser",auth,getalluser)
authRoutes.put("/updateProfile",auth, updateProfile)
authRoutes.delete('/userdelete', auth, roleCheck(["admin","Manager"]) ,deleteUserByUsername);

export default authRoutes;
