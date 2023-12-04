const errorHandler = (err, req, res, next) => {
	// console.log("- Error : ", err.name)
	console.log("- Error : ", err)
	if (err.name == "Bad Request") {
		res.status(400).json({ name: err.name, message: err.message })
	} else if (err.name == "Registered" || err.name == "Invalid") {
		res.status(401).json({ name: err.name, message: err.message })
	} else if (err.name == "Forbidden" || err.name == "Unauthorized") {
		res.status(403).json({ name: err.name, message: err.message })
	} else if (err.name == "Not Found") {
		res.status(404).json({ name: err.name, message: err.message })
	} else if (err.name == "Invalid" || err.name == "JsonWebTokenError") {
		res.status(401).json({ name: err.name, message: err.message })
	} else if (err.name == "JsonWebTokenError") {
		res.status(401).json({ name: err.name, message: err.message })
	} else if (err.name == "CastError") {
		res.render("notfound")
	} else if (err.code === "ENOENT") {
		res.status(400).json({ name: "File is not exist", message: "File is not uploaded yet" })
	} else {
		res.status(500).json({ name: "Internal Error Server", message: err })
	}
}

module.exports = errorHandler
