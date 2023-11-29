const { decodeToken } = require("../helpers/jwt/jwt")
const Participant = require("../schema/Participant")
const User = require("../schema/User")

const authentication = async (req, res, next) => {
	const { user_token } = req.headers
	try {
		if (!user_token) {
			throw { name: "Invalid", message: "Invalid Token" }
		}
		const payload = decodeToken(user_token)

		const user = await Participant.findById(payload.id)
		req.user = { id: user.id, role: user.authority }
		next()
	} catch (error) {
		next(error)
	}
}

module.exports = authentication
