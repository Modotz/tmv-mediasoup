const Participant = require("../schema/Participant")
class Participants {
	static async createParticipant(req, res, next) {
		try {
			const { email, roomId, authority } = req.body
			const findParticipants = await Participant.findOne({ email })

			let isConfirmed = authority == "PPAT" ? true : false

			if (findParticipants && authority != "PPAT") {
				await res.status(409).json({ name: "Is already exists", message: `${email} has already registered` })
			}

			await Participant.create({ email, roomId, authority, isConfirmed })
			await res.status(201).json({ message: `Success Registering ${email}` })
		} catch (error) {
			next(error)
		}
	}

	static async getParticipant(req, res, next) {
		try {
			const { id } = req.params
			const participantData = await Participant.findById(id)
			if (!participantData) {
				throw { name: "Not Found", message: "Participant Not Found" }
			}
			// if (!participantData.isConfirmed) {
			// }
		} catch (error) {
			next(error)
		}
	}

	static async getParticipants(req, res, next) {
		try {
			const { roomid } = req.params
			let participants = await Participant.find({ roomId: roomid })
			await res.status(200).json(participants)
		} catch (error) {
			next(error)
		}
	}
}

module.exports = { Participants }
