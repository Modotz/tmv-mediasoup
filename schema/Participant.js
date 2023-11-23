const mongoose = require("mongoose")
const Schema = mongoose.Schema

const participantSchema = new Schema({
	email: {
		type: String,
		required: true,
	},
	authority: {
		type: String,
		required: true,
	},
	roomId: {
		type: String,
		required: true,
	},
	isConfirmed: {
		type: Boolean,
		required: true,
	},
})

module.exports = mongoose.model("Participant", participantSchema)
