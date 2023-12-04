const Transaction = require("../schema/Transaction")
const Room = require("../schema/Room")
const Participant = require("../schema/Participant")
const User = require("../schema/User")

class Transactions {
	static async createTransaction(req, res, next) {
		try {
			// const { transactionTitle } = req.body
			// if (!transactionTitle) {
			// 	throw { name: "Bad Request", message: "Transaction Name Is Required" }
			// }
			// const transaction = await Transaction.create({ name: transactionTitle, PPAT: req.user.id })
			// await res.status(201).json({ transactionId: transaction._id })
			const { participants, meetingName, meetingDate, roomId } = req.body
			const { id } = req.user

			const user = await User.findById(id)

			const createTransaction = await Transaction.create({ name: meetingName, PPAT: id, roomId })
			const PPATData = {
				email: user.email,
				authority: "PPAT",
				transactionId: createTransaction.id,
				roomId,
				isVerified: true,
			}
			let participantsData = participants.map((data) => {
				return { email: data, authority: "Saksi", transactionId: createTransaction.id, roomId, isVerified: false }
			})

			participantsData.unshift(PPATData)

			const createParticipants = await Participant.create(participantsData)

			let participantIds = []
			createParticipants.forEach((data) => {
				participantIds.push(data._id)
			})

			const createMeeting = await Room.create({
				name: meetingName,
				PPAT: id,
				roomId,
				transactionId: createTransaction.id,
				participants: participantIds,
				startAt: meetingDate,
			})

			console.log(createMeeting)

			await res.status(201).json({ message: "Success Creating Transaction" })
		} catch (error) {
			next(error)
		}
	}
}

module.exports = { Transactions }
