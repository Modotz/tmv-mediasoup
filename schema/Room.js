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
	transactionId: {
		type: Schema.Types.ObjectId,
		ref: "Transaction",
		required: true,
	},
	PPAT: {
		type: Schema.Types.ObjectId,
		ref: "User",
		required: true,
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
