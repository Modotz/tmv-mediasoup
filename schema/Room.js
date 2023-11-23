const mongoose = require("mongoose")
const Schema = mongoose.Schema

const roomSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	roomId: {
		type: String,
		required: true,
	},
	PPAT: {
		type: Schema.Types.ObjectId,
		ref: "User",
	},
	participants: [
		{
			type: Schema.Types.ObjectId,
			ref: "Participant",
		},
	],
	startAt: {
		type: Date,
		required: true,
	},
})

module.exports = mongoose.model("Room", roomSchema)
