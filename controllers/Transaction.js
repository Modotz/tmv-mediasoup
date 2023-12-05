const Transaction = require("../schema/Transaction")
const Room = require("../schema/Room")
const Participant = require("../schema/Participant")
const User = require("../schema/User")
const mongoose = require("mongoose")

class Transactions {
	static async createTransaction(req, res, next) {
		const session = await mongoose.startSession()
		session.startTransaction()
		try {
			const { participants, meetingName, meetingDate, roomId } = req.body
			const { id } = req.user

			const user = await User.findById(id)

			const createTransaction = await Transaction.create([{ name: meetingName, PPAT: id, roomId }], { session })
			console.log("- Transaction : ",createTransaction[0].id)
			const PPATData = {
				email: user.email,
				authority: "PPAT",
				transactionId: createTransaction[0].id,
				roomId,
				isVerified: true,
			}
			let participantsData = participants.map((data) => {
				return { email: data, authority: "Saksi", transactionId: createTransaction[0].id, roomId, isVerified: false }
			})

			participantsData.unshift(PPATData)

			const createParticipants = await Participant.create(participantsData, { session })

			let participantIds = []
			createParticipants.forEach((data) => {
				participantIds.push(data._id)
			})

			const createMeeting = await Room.create(
				[
					{
						name: meetingName,
						PPAT: id,
						roomId,
						transactionId: createTransaction[0].id,
						participants: participantIds,
						startAt: meetingDate,
					},
				],
				{ session }
			)

			await session.commitTransaction()
			session.endSession()
			await res.status(201).json({ message: "Success Creating Transaction" })
		} catch (error) {
			await session.abortTransaction()
			session.endSession()
			next(error)
		}
	}
}

module.exports = { Transactions }
