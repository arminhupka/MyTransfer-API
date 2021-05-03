const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose');
const dotenv = require('dotenv');



dotenv.config()


// ROUTERS
const fileRoute = require('./routes/fileRoute')


const app = express();

const PORT = process.env.PORT || 8080;


app.use(cors());
app.use(express.json());
app.use(fileUpload());

app.use(fileRoute)


// START SERVER
mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.kmma2.mongodb.net/MyTransfer?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('CONNECTED TO DB')
        app.listen(PORT, () => {
            console.log(`SERVER RUNNING ON ${PORT}!`)
        })
    })
    .catch((err) => console.log(err))

