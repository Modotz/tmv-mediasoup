const { decodeToken } = require("../helpers/jwt/jwt")
const Participant = require("../schema/Participant")
const User = require("../schema/User")

const authentication = async (req, res, next) => {
	const { access_token } = req.headers
	try {
		const payload = decodeToken(access_token)
		if (payload.role == "PPAT") {
			const user = await User.findById(payload.id)
			req.user = { id: user.id }
			next()
		} else {
			const user = await Participant.findById(payload.id)
			req.user = { id: user.id }
			next()
		}
	} catch (error) {
		console.log("- Error What : ", error)
		next(error)
	}
}

module.exports = authentication
