const mongoose = require('mongoose')

const reminderSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      time: {
        type: String,
        required: true,
      },
      noOfDays: {
        type: String,
        default: 'daily',
        required: true,
      },
      isReminded : {
        type: Boolean,
        default: false
      }
})

module.exports = mongoose.model('reminder',reminderSchema)