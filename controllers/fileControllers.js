const {validationResult} = require('express-validator');
const aws = require('aws-sdk');
const nodemailer = require('nodemailer');
const {nanoid} = require('nanoid');
const dotenv = require('dotenv');

dotenv.config()

aws.config.region = 'eu-central-1'

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

exports.getFile = async (req, res) => {
    const {slug} = req.params

    const file = await fileSchema.findOne({slug: slug}).select("-__v");

    if (!file) {
        return res.status(404).json({
            message: 'File not found'
        })
    }

    return res.status(200).json({
        file
    })
}

exports.uploadS3 = async (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    if(!req.files) {
        return res.status(400).json({ error: "No file to send" });
    }

    const {name, description, emailTo} = req.body;


    let doc;
    let slug = nanoid(10);

    const s3 = new aws.S3({
        accessKeyId: process.env.S3_KEY_ID,
        secretAccessKey: process.env.S3_ACCESS_KEY
    });

    const fileName = req.files.file.name;
    const fileType = req.files.file.mimetype;
    const fileBuffer = req.files.file.data;

    const s3Params = {
        Bucket: process.env.S3_BUCKET,
        Key: `${slug}/${fileName}`,
        Expires: 60,
        ContentType: fileType,
        ACL: 'public-read',
        Body: fileBuffer
    };

    await s3.upload(s3Params, async (error, data) => {

        if (error) {
            console.log(err)
            return res.status(500).send('Server Error')
        }

        doc = new fileSchema({
            slug,
            dlLink: data.Location
        })

        // save info to db
        await doc.save();

        // send email
        await mailTransporter.sendMail({
            from: '"MyTransfer" <noreply@kolorvision.pl>',
            to: emailTo,
            subject: `${name} send you file.`,
            html: `<b>${data.Location}</b>`
        })
            .then(() => {
                console.log('EMAIL SENT')
            })
            .catch(err => {
                console.log(err)
                console.log('ERROR DURING SENDING EMAIL')
            })

        return res.status(200).json({
            message: "File uploaded",
            slug: doc.slug
        })

    })

    // remove folder with content after process.env.TIME_TO_REMOVE time
    const s3deleteParams = {
        Bucket: process.env.S3_BUCKET,
    }

    setTimeout(async () => {
        await doc.deleteOne({slug: doc.slug})
            .then(() => {
                console.log('doc removed')
            })
            .catch(err => {
                console.log(err)
                return res.status(500).json({
                    error: "Server Error"
                })
            })

        await s3.listObjectsV2(s3deleteParams, (err, data) => {
            if (err) {
                console.log(err)
                return res.status(500).json({
                    error: "Server Error"
                })
            }

            s3deleteParams.Delete = {Objects: []}

            data.Contents.forEach((content) => {
                s3deleteParams.Delete.Objects.push({Key: content.Key});
            });

            s3.deleteObjects(s3deleteParams, (err) => {
                if (err) {
                    console.log(err, err.stack)
                    return res.status(500).json({
                        error: "Server Error"
                    })
                }

                console.log('FILE REMOVED')
            })
        })
    }, process.env.TIME_TO_REMOVE);
}
