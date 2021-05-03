const fs = require('fs');
const nodemailer = require('nodemailer');
const {nanoid} = require('nanoid');
const dotenv = require('dotenv');

dotenv.config()

const PORT = process.env.PORT || 8080;
const HOST = process.env.HEROKU_APP_NAME || `http://localhost:${PORT}`

const fileSchema = require('../models/fileModel');

let mailTransporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: true,
    auth: {
        user: process.env.MAIL_LOGIN,
        pass: process.env.MAIL_PASS
    },
});

exports.uploadFile = async (req, res) => {

    const {name, description, emailTo} = req.body;

    let file;
    let uploadPath;
    let doc;
    let slug = nanoid(5);

    // check if inputs are filled
    if (!name || !description || !emailTo) {
        return res.status(400).json({
            error: 'All input must be filled'
        })
    }

    // check if file is attached
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
            error: 'No files to upload'
        })
    }

    file = req.files.file;
    uploadPath = `${process.cwd()}/uploads/${file.name}`

    try {

        await file.mv(uploadPath);

        doc = new fileSchema({
            slug,
            dlLink: `${HOST}${uploadPath}`
        })

        // save info to db
        await doc.save();

        // send email
        await mailTransporter.sendMail({
            from: '"MyTransfer 🔥" <noreply@kolorvision.pl>',
            to: emailTo,
            subject: "You have file to download",
            html: `<b>${HOST}${uploadPath}</b>`
        })
            .then(() => {
                console.log('EMAIL SENT')
            })
            .catch(err => {
                console.log('ERROR DURING SENDING EMAIL')
            })

        // remove file
        setTimeout(() => {
            doc.deleteOne({slug: doc.slug})
                .then(() => {
                    console.log('doc removed')
                })
                .catch(err => {
                    console.log(err)
                })
            fs.unlink(uploadPath, () => {
                console.log(`${file.name} removed`)
            });
        }, process.env.TIME_TO_REMOVE)

        return res.status(200).json({
            message: 'File uploaded',
            slug
        })


    } catch (err) {
        console.log(err)
        return res.status(500).json({
            error: 'Server Error'
        })
    }
}

exports.getFile = async (req, res) => {
    const {slug} = req.params

    const file = await fileSchema.findOne({slug: slug}).select("-__v");

    if(!file) {
        return res.status(404).json({
            message: 'File not found'
        })
    }

    return res.status(200).json({
        file
    })
}
