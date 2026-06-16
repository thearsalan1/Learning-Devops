import express from "express";
import dotenv from "dotenv";
import proxy from "express-http-proxy";
dotenv.config();

const port = process.env.PORT || 5000;

const app = express();
app.use(express.json());

// ✅ Specific routes PEHLE
app.use("/auth", proxy("http://auth-services:8001"));
app.use("/order", proxy("http://order-services:8002"));
app.use("/product", proxy("http://product-services:8003"));

// ✅ "/" LAST mein
app.use("/", (req, res) => {
  return res
    .status(200)
    .json({ message: `hello from ${process.env.SERVER_NAME}` });
});

app.listen(port, () => {
  console.log(`server started ${port}`);
});
