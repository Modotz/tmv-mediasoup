const { decodeToken } = require("../helpers/jwt/jwt")
const User = require("../schema/User")

const authorization = async (req, res, next) => {
	const { access_token } = req.headers
	try {
		const payload = decodeToken(access_token)
		if (payload.role == "PPAT") {
			next()
		} else {
			throw { name: "Forbidden", message: "Access is rejected" }
		}
	} catch (error) {
		console.log("- Error What : ", error)
		next(error)
	}
}

module.exports = authorization
