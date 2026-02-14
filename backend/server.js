require("dotenv").config();
const app = require("./api/index");

const port = 4000;

app.get("/test", (req, res) => {
    res.send("Test route working");
});


app.listen(port, () => {
    console.log("Server Running on Port " + port);
}); 