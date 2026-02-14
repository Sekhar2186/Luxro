require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

const app = express();

// ================== CONFIG ==================
const port = process.env.PORT || 4000;

// ================== MIDDLEWARE ==================
app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// ================== DATABASE ==================
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log("MongoDB Error:", err));

// ================== ROOT ==================
app.get("/", (req, res) => {
    res.send("Backend Running 🚀");
});

// ================== IMAGE STORAGE ==================
const storage = multer.diskStorage({
    destination: "/tmp",   // Vercel writable folder
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });

// Upload API
app.post("/upload", upload.single("product"), (req, res) => {
    res.json({
        success: 1,
        image_url: `${req.protocol}://${req.get("host")}/${req.file.filename}`
    });
});

// ================== PRODUCT MODEL ==================
const Product = mongoose.model("Product", {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    new_price: { type: Number, required: true },
    old_price: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    available: { type: Boolean, default: true }
});

// ================== PRODUCT APIs ==================
app.post("/addproduct", async (req, res) => {
    const products = await Product.find({});
    const id = products.length ? products[products.length - 1].id + 1 : 1;

    const product = new Product({ id, ...req.body });
    await product.save();

    res.json({ success: true });
});

app.post("/removeproduct", async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id });
    res.json({ success: true });
});

app.get("/allproducts", async (req, res) => {
    const products = await Product.find({});
    res.json(products);
});

app.get("/newcollection", async (req, res) => {
    const products = await Product.find({});
    res.json(products.slice(1).slice(-8));
});

app.get("/popularinwomen", async (req, res) => {
    const products = await Product.find({ category: "women" });
    res.json(products.slice(0, 4));
});

app.get("/popularinmen", async (req, res) => {
    const products = await Product.find({ category: "men" });
    res.json(products.slice(0, 4));
});

// ================== USER MODEL ==================
const Users = mongoose.model("Users", {
    name: String,
    email: { type: String, unique: true },
    password: String,
    cartData: Object,
    date: { type: Date, default: Date.now }
});

// ================== AUTH APIs ==================
app.post("/signup", async (req, res) => {
    const existingUser = await Users.findOne({ email: req.body.email });
    if (existingUser)
        return res.status(400).json({ success: false, errors: "User already exists" });

    let cart = {};
    for (let i = 0; i < 300; i++) cart[i] = 0;

    const user = new Users({
        name: req.body.username,
        email: req.body.email,
        password: req.body.password,
        cartData: cart
    });

    await user.save();

    const token = jwt.sign({ user: { id: user._id } }, process.env.JWT_SECRET);

    res.json({ success: true, token });
});

app.post("/login", async (req, res) => {
    const user = await Users.findOne({ email: req.body.email });
    if (!user)
        return res.json({ success: false, errors: "Wrong Email" });

    if (req.body.password !== user.password)
        return res.json({ success: false, errors: "Wrong Password" });

    const token = jwt.sign({ user: { id: user._id } }, process.env.JWT_SECRET);

    res.json({ success: true, token });
});

// ================== AUTH MIDDLEWARE ==================
const fetchUser = async (req, res, next) => {
    const token = req.header("auth-token");
    if (!token)
        return res.status(401).json({ errors: "Authenticate using valid token" });

    try {
        const data = jwt.verify(token, process.env.JWT_SECRET);
        req.user = data.user;
        next();
    } catch {
        res.status(401).json({ errors: "Invalid Token" });
    }
};

// ================== CART APIs ==================
app.post("/addtocart", fetchUser, async (req, res) => {
    const user = await Users.findById(req.user.id);
    user.cartData[req.body.itemId] += 1;
    await user.save();
    res.send("Added");
});

app.post("/removefromcart", fetchUser, async (req, res) => {
    const user = await Users.findById(req.user.id);
    if (user.cartData[req.body.itemId] > 0)
        user.cartData[req.body.itemId] -= 1;

    await user.save();
    res.send("Removed");
});

app.post("/getcart", fetchUser, async (req, res) => {
    const user = await Users.findById(req.user.id);
    res.json(user.cartData);
});

// ================== LOCAL SERVER ==================
if (!process.env.VERCEL) {
    app.listen(port, () => {
        console.log("Server Running on Port " + port);
    });
}

// ================== EXPORT FOR VERCEL ==================
module.exports = app;