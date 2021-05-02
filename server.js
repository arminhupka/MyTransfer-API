const express = require('express');
const fs = require('fs');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config()

const app = express();

const PORT = process.env.PORT || 8080
const REMOVE_TIME = process.env.REMOVE_TIME || 5000

let mailTransporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: true,
    auth: {
        user: process.env.MAIL_LOGIN,
        pass: process.env.MAIL_PASS
    },
});


app.use(cors());
app.use(express.json());
app.use(fileUpload());

// UPLOAD FILES
app.get('/', (req, res) => {
    res.send('My Transfer API')
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
        }, REMOVE_TIME)

        try {
            const mail = await mailTransporter.sendMail({
                from: '"MyTransfer 🔥" <noreply@kolorvision.pl>',
                to: emailTo,
                subject: "You have file to download",
                html: `<b>${uploadPath}</b>`
            })
            console.log('EMAIL SENT!')
            console.log(mail)
        } catch (err) {
            console.log(err)
            return res.status(500).json({
                error: 'Server Error'
            })
        }

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


// START SERVER
app.listen(PORT, (err) => {
    console.log(`SERVER RUNNING ON ${PORT}!`)
})
