const express = require("express")
const Controller = require("../controllers/index.js")
const { Rooms } = require("../controllers/Room.js")
const { Users } = require("../controllers/User.js")
const authentication = require("../middlewares/authentication.js")
const { Participants } = require("../controllers/Participant.js")
const authorization = require("../middlewares/authorization.js")
const multer = require("multer")
const { Transactions } = require("../controllers/Transaction.js")
const router = express.Router()
const path = require("path")
const fs = require("fs")

const storage = multer.diskStorage({
	destination: async function (req, file, cb) {
		const { transactionid } = req.params
		const directoryPath = path.join(__dirname, "..", "documents", "pdf", transactionid)
		console.log("- What The Fuck")

		try {
			await fs.promises.access(directoryPath)
		} catch (error) {
			if (error.code === "ENOENT") {
				await fs.promises.mkdir(directoryPath, { recursive: true })
			} else {
				console.error("Error accessing directory:", error)
			}
		}

		// Now the directory should exist, set it as the destination
		cb(null, directoryPath)
	},
	filename: function (req, file, cb) {
		// Use the original name of the file
		cb(null, "AJB.pdf")
	},
})

let upload = multer({ storage })
// let upload = multer({ dest: 'documents/pdf' });

// const upload = multer({ storage })

// API Login / Register
router.post("/api/register", Users.register)
router.post("/api/login", Users.login)

// Render Page
router.get("/login", Controller.login)
router.get("/register", Controller.register)
router.get("/", Controller.home)
router.get("/lobby/:room", Controller.lobby)
router.get("/register-meeting", Controller.registerMeeting)
router.post("/google-auth", Controller.googleAuth)
router.get("/verify/:id", Participants.verifyParticipant)
router.get("/notfound", Controller.notfound)
router.post("/verify", Participants.isParticipantValid)
router.get("/verified/:id", Participants.verifiedParticipant)
router.get("/user/:id", Participants.getParticipant)

router.get("/documents/:transactionid", authentication, Controller.getDocuments)
router.post("/documents", authentication, Controller.createDocuments)

router.use(authorization)
router.post("/ajb-file/:transactionid", upload.single("pdf"), Controller.uploadAJBDocument)
router.get("/ajb-file/:transactionid", Controller.getDocuments)

// Api
router.get("/api/user", Users.getUser)
router.post("/api/room", Rooms.createRoom)
router.put("/api/room/:roomid", Rooms.updateTemplateTataTertib)
// router.post("/api/room", upload.single("pdf_file"), Rooms.createRoom)
router.post("/api/participant", Participants.createParticipant)
router.post("/api/transaction", Transactions.createTransaction)
router.get("/api/participants/:roomid", Participants.getParticipants)
router.get("/api/rooms", Rooms.getRooms)
router.get("/api/room/:roomid", Rooms.findRoom)
router.put("/api/room", Rooms.joinRoom)

module.exports = router
