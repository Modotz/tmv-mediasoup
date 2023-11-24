const express = require("express")
const Controller = require("../controllers/index.js")
const { Rooms } = require("../controllers/Room.js")
const { Users } = require("../controllers/User.js")
const authentication = require("../middlewares/authentication.js")
const { Participants } = require("../controllers/Participant.js")
const authorization = require("../middlewares/authorization.js")
const router = express.Router()

// API Login / Register
router.post("/api/register", Users.register)
router.post("/api/login", Users.login)

// Render Page
router.get("/login", Controller.login)
router.get("/register", Controller.register)
router.get("/", Controller.home)
router.get("/lobby/:room", Controller.lobby)
// router.get("/room/:room", Controller.room)
router.get("/register-meeting", Controller.registerMeeting)
router.post("/google-auth", Controller.googleAuth)
router.get("/verify/:id", Controller.verify)
router.post("/verify", Participants.verifyParticipant)
router.get("/verified/:id", Participants.verifiedParticipant)
router.get("/user/:id", Participants.getParticipant)

router.use(authentication)

router.get("/documents/:roomid", Controller.getDocuments)

router.use(authorization)
router.post("/documents", Controller.createDocuments)

// Api
router.get("/api/user", Users.getUser)
router.post("/api/room", Rooms.createRoom)
router.post("/api/participant", Participants.createParticipant)
router.get("/api/participants/:roomid", Participants.getParticipants)
router.get("/api/rooms", Rooms.getRooms)
router.get("/api/room/:roomId", Rooms.findRoom)
router.put("/api/room", Rooms.joinRoom)

module.exports = router
