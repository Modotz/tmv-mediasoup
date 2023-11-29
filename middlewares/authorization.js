const { decodeToken } = require("../helpers/jwt/jwt")
const User = require("../schema/User")

const authorization = async (req, res, next) => {
	const { access_token } = req.headers
	if (!access_token){
		res.render("notfound")
	}
	try {
		const payload = decodeToken(access_token)
		if (payload.role == "PPAT") {
			req.user = { id: payload.id, role: payload.authorization }
			next()
		} else {
			throw { name: "Forbidden", message: "Access is rejected" }
		}
	} catch (error) {
		next(error)
	}
}

module.exports = authorization
