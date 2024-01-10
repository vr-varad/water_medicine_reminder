const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cron = require('node-cron');
const nodemailer = require('nodemailer')
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
                    
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    auth: {
      user: process.env.emailUser,
      pass: process.env.emailPassword,
    },
  });
  
  const sendReminderEmail = async (name, emailAddress, reminderDescription,type) => {
    try {
      // Setup email options
      const info = await transporter.sendMail({
        from: process.env.emailUser, // sender address
        to: emailAddress, // list of receivers
        subject: `${type.toUpperCase()} Reminder`, // Subject line
        text: `Hello ${name}`, // plain text body
        html: `<p><b>${reminderDescription}</b></p><p>Best regards,<br>Your Reminder App</p>`, // html body
      })
      console.log('Email sent:', info.response);
    } catch (err) {
      console.error(err);
    }
  };
  
  const sendReminder = async (name, emailAddress) => {
    try {
      const reminderList = await reminderModel.find({}).exec();
      if (reminderList) {
        for (const reminder of reminderList) {
          if (!reminder.isReminded) {
            const now = new Date().toLocaleString(undefined, { timeZone: 'Asia/Kolkata' });
  
            if (reminder.time < now) {
              console.log(1);
              await reminderModel.findByIdAndUpdate(reminder._id, { isReminded: true });
  
              // Send reminder email
              sendReminderEmail(name, emailAddress, reminder.description,reminder.type);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

const task = cron.schedule('* * * * *', async () => {
    try {
        const now = new Date().toLocaleString(undefined, { timeZone: 'Asia/Kolkata' });
        const reminderList = await reminderModel.find({ isReminded: true }).exec();
        if (reminderList) {
            for (const reminder of reminderList) {
                await reminderModel.findByIdAndUpdate(reminder._id, { isReminded: false });
                const newTime = new Date(reminder.time);
                newTime.setDate(newTime.getDate() + 1);

                await reminderModel.findByIdAndUpdate(reminder._id, { time: newTime });
                console.log('done')
            }
        }
    } catch (err) {
        console.error(err);
    }
});



const startReminder = (name,emailAddress)=>{
    setInterval(() => {
    sendReminder(name,emailAddress)
    task.start()}, 1000);
}

app.get('/api/v1/watMedReminder', async (req, res) => {
    try {
        const emailAddress = req.headers['emailaddress'];
        const name = req.headers['name']
        console.log(emailAddress)
        startReminder(name,emailAddress)
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
