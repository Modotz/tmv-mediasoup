const Participant = require("../schema/Participant")
const Room = require("../schema/Room")

class Rooms {
	static async findRoom(req, res, next) {
		try {
			const { roomid } = req.params
			if (!roomid) {
				throw { name: "Bad Request", message: "Room ID Is Required" }
			}
			const room = await Room.findById(roomid)
			if (!room) {
				throw { name: "Invalid", message: "Invalid Room" }
			}
			console.log(room)
			let data = { ...room }
			await res.render("detail", { data })
		} catch (error) {
			next(error)
		}
	}

	static async getRooms(req, res, next) {
		try {
			const { id } = req.user
			const rooms = await Room.find({ PPAT: id })
			await res.status(200).json(rooms)
		} catch (error) {
			next(error)
		}
	}

	static async createRoom(req, res, next) {
		try {
			const { meetingDate, meetingName, participants, roomId, transactionId } = req.body
			if (!meetingDate) {
				throw { name: "Bad Request", message: "Meeting Date Is Required" }
			}

			if (!meetingName) {
				throw { name: "Bad Request", message: "Meeting Titla Is Required" }
			}

			if (!participants) {
				throw { name: "Bad Request", message: "Participants Is Required" }
			}

			if (!roomId) {
				throw { name: "Bad Request", message: "Room ID Is Required" }
			}

			if (!transactionId) {
				throw { name: "Bad Request", message: "Transaction ID Is Required" }
			}
			// // Fetch participants asynchronously and collect their IDs
			const participantIds = await Promise.all(
				participants.map(async (email) => {
					const user = await Participant.findOne({ email, roomId })
					return user ? user._id : null // Using _id instead of id
				})
			)

			await Room.create({
				name: meetingName,
				participants: [...participantIds],
				roomId,
				PPAT: req.user.id,
				startAt: meetingDate,
				transactionId,
			})

			await res.status(201).json({ message: "Success Creating Room" })
		} catch (error) {
			next(error)
		}
	}

	static async joinRoom(req, res, next) {
		try {
			const { roomName, type } = req.body
			const { id } = req.user
			if (!roomName) {
				throw { name: "Bad Request", message: "Room ID Is Required" }
			}

			const room = await Room.find({ name: roomName })
			if (type == "Join") {
				const isExist = room[0].participants.find((data) => data == id)
				if (!isExist) {
					room[0].participants.push(id)
					room[0].save()
					await res.status(200).json({ message: "Join Success" })
				} else {
					await res.status(200).json({ message: "Already Joined" })
				}
			} else {
				const newParticipants = room[0].participants.filter((data) => data != id)
				room[0].participants = newParticipants
				room[0].save()
				await res.status(204)
			}
		} catch (error) {
			next(error)
		}
	}

	static async updateTemplateTataTertib(req, res, next) {
		try {
			const { roomid } = req.params
			const { content } = req.body
			await Room.findOneAndUpdate({ _id: roomid }, { templateTataTertib: content })
			await res.status(200).json({ content })
		} catch (error) {
			next(error)
		}
	}
}

module.exports = { Rooms }
