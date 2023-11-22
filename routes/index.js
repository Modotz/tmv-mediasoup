const express = require("express")
const Controller = require("../controllers/index.js")
const { Rooms } = require("../controllers/Room.js")
const { Users } = require("../controllers/User.js")
const authentication = require("../middlewares/authentication.js")
const router = express.Router()

// API Login / Register
router.post("/api/register", Users.register)
router.post("/api/login", Users.login)



// Render Page
router.get("/login", Controller.login)
router.get("/register", Controller.register)
router.get("/", Controller.home)
router.get("/lobby/:room", Controller.lobby)
router.get("/room/:room", Controller.room)
router.post("/google-auth", Controller.googleAuth)

router.use(authentication)
router.get("/documents", Controller.getDocuments)
router.post("/documents", Controller.createDocuments)

// Api
router.get("/api/user", Users.getUser)
router.post("/api/room", Rooms.createRoom)
router.get("/api/room/:roomId", Rooms.findRoom)
router.put("/api/room", Rooms.joinRoom)

module.exports = router
