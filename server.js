import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { fileURLToPath } from "url";
import { dirname } from "path";

const app = express();

// Get __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

// Cloudinary config
cloudinary.config({
  cloud_name: "drjgrgsrd",
  api_key: "565293434135749",
  api_secret: "yYzQaBF6VqdTiO_U8FyN5XcT048",
});

// MongoDB connection
mongoose
  .connect(
    "mongodb+srv://harshanand42917:S0d33GWPg0BTvMBQ@cluster0.i6opsi7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    { dbName: "url_shorted_db" }
  )
  .then(() => console.log("MongoDB Connected..!"))
  .catch((err) => console.log(err));

// Routes for rendering views
app.get("/", (req, res) => {
  res.render("login.ejs", { url: null, error: null });
});

app.get("/register", (req, res) => {
  res.render("register.ejs", { url: null, error: null });
});

// Multer config
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});

const upload = multer({ storage: storage });

// MongoDB schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  filename: String,
  public_id: String,
  imgUrl: String,
});

const User = mongoose.model("user", userSchema);

// Register route
app.post("/register", upload.single("file"), async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.render("register.ejs", {
      url: null,
      error: "User already registered",
    });
  }

  // Upload to Cloudinary
  const filePath = req.file.path;
  const cloudinaryRes = await cloudinary.uploader.upload(filePath, {
    folder: "Saved_Images_Folder",
  });

  // Save user
  await User.create({
    name,
    email,
    password,
    filename: req.file.originalname,
    public_id: cloudinaryRes.public_id,
    imgUrl: cloudinaryRes.secure_url,
  });

  res.redirect("/");
});

// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.password !== password) {
    return res.render("login.ejs", {
      url: null,
      error: "Invalid email or password",
    });
  }

  res.render("profile.ejs", { user });
});

// Start server
const port = 1000;
app.listen(port, () => console.log(`Server is running on port ${port}`));
