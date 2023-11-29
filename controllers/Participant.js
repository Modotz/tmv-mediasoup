const { encodeToken } = require("../helpers/jwt/jwt")
const Participant = require("../schema/Participant")
class Participants {
	static async createParticipant(req, res, next) {
		try {
			const { email, roomId, authority, transactionId } = req.body
			const findParticipants = await Participant.findOne({ email })

			let isConfirmed = authority == "PPAT" ? true : false

			if (findParticipants && authority != "PPAT") {
				await res.status(409).json({ name: "Is already exists", message: `${email} has already registered` })
			}

			await Participant.create({ email, roomId, authority, isConfirmed, transactionId })
			await res.status(201).json({ message: `Success Registering ${email}` })
		} catch (error) {
			next(error)
		}
	}

	static async verifyParticipant(req, res, next) {
		try {
			const { id } = req.params
			let participantData = await Participant.findById(id)
			if (!participantData) {
				res.render("notfound")
				return
			} else {
				res.render("verify", { id })
			}
		} catch (error) {
			next(error)
		}
	}

	static async getParticipant(req, res, next) {
		try {
			const { id } = req.params
			console.log("ID", id)
			let participantData = await Participant.findById(id)
			if (!participantData) {
				await res.render("notfound")
				return
			}
			await res.render("room", { participantData })
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

	static async isParticipantValid(req, res, next) {
		try {
			const { id } = req.body
			let participantData = await Participant.findById(id)
			if (!participantData) {
				throw { name: "Not Found", message: "Participant Not Found" }
			}
			console.log(participantData)
			const encodedToken = { id: participantData._id, role: participantData.authority }
			let access_token = await encodeToken(encodedToken)
			await res.status(200).json({ access_token })
		} catch (error) {
			next(error)
		}
	}

	static async verifiedParticipant(req, res, next) {
		try {
			const { id } = req.params
			console.log("rediredted")
			res.redirect(`/user/${id}`)
		} catch (error) {
			next(error)
		}
	}
}

module.exports = { Participants }
