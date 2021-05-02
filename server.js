const express = require('express')
const fs = require('fs')
const cors = require('cors')
const fileUpload = require('express-fileupload');


const app = express();


app.use(cors());
app.use(fileUpload());
app.use(express.json());

// UPLOAD FILES
app.get('/', (req, res) => {
    return res.status(200).send('My Transfer API');
})
app.post('/upload', async (req, res) => {

    const {name, description, emailTo} = req.body;

    let file;
    let uploadPath;

    if (!name || !description || !emailTo) {
        return res.status(400).json({
            error: 'All input must be filled'
        })
    }

    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
            error: 'No files to upload'
        })
    }

    file = req.files.file;
    uploadPath = `${__dirname}/uploads/${file.name}`


    try {
        const uploadedFile = await file.mv(uploadPath);

        setTimeout(() => {
            fs.unlink(uploadPath, () => {
                console.log(`${file.name} removed`)
            });
        }, 1000)

        return res.status(200).json({
            message: 'File uploaded',
            file: uploadPath
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            error: 'Server Error'
        })
    }

})

const PORT = 5500 || process.env.PORT

// START SERVER
app.listen(PORT, (err) => {
    console.log(`SERVER RUNNING ON ${PORT}!`)
})
