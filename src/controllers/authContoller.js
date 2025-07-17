import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncError from "../utils/catchAsyncError.js";
import UserModel from "../models/userModel.js";

export const AddUser = catchAsyncError(async (req, res, next) => {
  try {
    const { fullName, username, password } = req.body;

    if (!fullName) {
      return next(new ErrorHandler("Please enter your full name.", 400));
    }

    if (!username) {
      return next(new ErrorHandler("Username is required.", 400));
    }

    if (!password) {
      return next(new ErrorHandler("Password cannot be empty.", 400));
    }

    const user = await UserModel.findOne({ username: req.body.username }).select('+password');; // Use farmernModel

    if (user) {
      return next(new ErrorHandler("The username you entered is already registered.", 401));
    }

    const password1 = req.body.password;
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password1, salt);
    req.body.password = hashedPassword;

    const NewUser = new UserModel(req.body); // Use farmernModel


    const savedUser = await NewUser.save(); // Save using farmernModel
    res.status(201).send({
      message: "User account created successfully",
      success: true,
      user: {
        _id: savedUser._id,
        fullName: savedUser.fullName,
        username: savedUser.username,
        role: savedUser.role,
      },
    });
  } catch (error) {
    console.log(error);
    next(new ErrorHandler("Server error", 500));
  }
});

export const UserLogin = catchAsyncError(async (req, res, next) => {
  try {
    const user = await UserModel.findOne({ username: req.body.username }).select('+password');;

    if (!user) {
      return next(new ErrorHandler("The username you entered is not registered.", 401));
    }
    if (user.isActive == false) {
      return next(new ErrorHandler("Your account is not yet verified by the admin. ", 401))
    }

    const isMatch = bcrypt.compareSync(req.body.password, user.password);

    if (!isMatch) {
      return next(new ErrorHandler("Please check your password and try again.", 401));
    }

    // Generate JWT (valid for 10 hours)
    const tokenValue = jwt.sign({ _id: user._id ,role: user.role,username: user.username}, process.env.JWT_SECRET, {
      expiresIn: "10h",
    });

    // Do NOT save token in user document (stateless JWT)
    // await user.save();

    res.status(200).json({
      message: "Login successful",
      success: true,
      data: {
        token: tokenValue,
        user: {
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          role: user.role,
          isActive: user.isActive,
        },
      }
    });
  } catch (error) {
    console.log(error);
    next(new ErrorHandler("Server error", 500));
  }
});


export const getalluser = catchAsyncError(async (req, res, next) => {
  try {
    const users = await UserModel.find({role:{$ne:'manager'}}).select("-token");
    if (!users) {
      users = []
    }
    const user = users.filter((user) => user._id.toString() !== req.user._id.toString());
    res.status(201).json({
      message: 'user List Fetched',
      success: true,
      users: user
    })
  } catch (error) {
    console.log(error)
    next(new ErrorHandler("interal server error", 500))
  }

})


export const updateProfile = catchAsyncError(async (req, res, next) => {
  try {
    const { fullName, username, password, role, isActive } = req.body;
    if (!username) {
      return next(new ErrorHandler("Username is required", 400));
    }

    const user = await UserModel
      .findOne({ username })
      .select('+password'); // If you want to update password, it should be included

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Regular user can update fullName and password
    if (fullName) user.fullName = fullName;

    if (password) {
      if (password.length < 6) {
        return next(new ErrorHandler("Password must be at least 6 characters long", 400));
      }
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
      user.password = hashedPassword; 
    }

    if ((role || typeof isActive === 'boolean') && !['admin', 'manager'].includes(req.user.role)) {
      return next(new ErrorHandler("Unauthorized: Only admin or manager can update role or status", 403));
    }

    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    // Save all changes
    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      user,
    });
  } catch (error) {

      next(new ErrorHandler("interal server error", 500))
  }
});


export const deleteUserByUsername = catchAsyncError(async (req, res, next) => {
  const { username } = req.body;

  if (!username) {
    return next(new ErrorHandler("Username is required", 400));
  }

  const user = await UserModel.findOneAndDelete({ username });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: `User '${username}' deleted successfully`,
  });
});