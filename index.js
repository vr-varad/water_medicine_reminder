const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cron = require('node-cron');
dotenv.config();
const cors = require('cors');

const connectDB = require('./db/connect');
const reminderModel = require('./models/reminderModel');
const port = process.env.PORT || 3001;

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const now = new Date().toLocaleString(undefined, { timeZone: 'Asia/Kolkata' });
                    
const sendReminder = async (phoneNumber) => {
    try {
        const reminderList = await reminderModel.find({}).exec();
        if (reminderList) {
            for (const reminder of reminderList) {
                if (!reminder.isReminded) {
                    const now = new Date().toLocaleString(undefined, { timeZone: 'Asia/Kolkata' });
                    
                    if (reminder.time < now) {
                        console.log(1);
                        await reminderModel.findByIdAndUpdate(reminder._id, { isReminded: true });

                        const accountSid = process.env.accountSid;
                        const authToken = process.env.twilioToken;
                        const client = require('twilio')(accountSid, authToken);

                        client.messages
                            .create({
                                body: reminder.description,
                                from: 'whatsapp:+14155238886',
                                to: `whatsapp:${phoneNumber}`
                            })
                            .then(message => console.log(message.sid));
                    }
                }
            }
        }
    } catch (err) {
        console.error(err);
    }
};


cron.schedule('0 0 * * *', async () => {
    try {
        const now = new Date().toLocaleString(undefined, { timeZone: 'Asia/Kolkata' });
        const reminderList = await reminderModel.find({ isReminded: true, time: { $lt: now } }).exec();

        if (reminderList) {
            for (const reminder of reminderList) {
                await reminderModel.findByIdAndUpdate(reminder._id, { isReminded: false });
                const newTime = new Date(reminder.time);
                newTime.setDate(newTime.getDate() + 1);

                await reminderModel.findByIdAndUpdate(reminder._id, { time: newTime });
            }
        }
    } catch (err) {
        console.error(err);
    }
});


setInterval(() => sendReminder('+919359203984'), 1000);


app.get('/api/v1/watMedReminder', async (req, res) => {
    try {
        const results = await reminderModel.find({});
        return res.status(200).json({
            msg: 'Success',
            noOfReminder: results.length,
            results
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error',
            error
        });
    }
});

app.post('/api/v1/watMedReminder/postReminder', async (req, res) => {
    try {
        const { type, name, description, time, noOfDays } = req.body;
        const data = { type, name, description, time, noOfDays };
        const results = await reminderModel.create(data);
        return res.status(200).json({
            msg: 'Success',
            results
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error',
            error
        });
    }
});

app.delete('/api/v1/watMedReminder/deleteReminder/:id', async (req, res) => {
    try {
        const results = await reminderModel.findByIdAndDelete({ _id: req.params.id });
        return res.status(200).json({
            msg: 'Success',
            results
        });
    } catch (error) {
        return res.status(500).json({
            msg: 'Error',
            error
        });
    }
});

const start = async () => {
    try {
        await connectDB();
        console.log('Connected to database');
        app.listen(port, '0.0.0.0', () => {
            console.log('Server started at port', port);
        });
    } catch (err) {
        console.log(err);
    }
};

start();
