const express = require("express")
const Controller = require("../controllers/index.js")
const router = express.Router()

router.get("/", Controller.home)
router.get("/lobby/:room", Controller.lobby)
router.get("/room/:room", Controller.room)
router.post("/google-auth", Controller.googleAuth)
router.get("/documents", Controller.getDocuments)
router.post("/documents", Controller.createDocuments)

module.exports = router
