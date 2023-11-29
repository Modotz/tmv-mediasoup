const mongoose = require("mongoose")
const Schema = mongoose.Schema

const transactionSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	PPAT: {
		type: Schema.Types.ObjectId,
		ref: "User",
	},
})

module.exports = mongoose.model("Transaction", transactionSchema)
