const { errorHandling } = require(".")
const { socket } = require("../../socket")
const { createDevice } = require("./mediasoup")

const getMyStream = async (parameter) => {
	try {
		let config = {
			video: { frameRate: { ideal: 30, max: 35 } },
			audio: {
				autoGainControl: false,
				noiseSuppression: true,
				echoCancellation: true,
			},
		}

		let username = parameter.userData.email
		parameter.username = username

		let stream = await navigator.mediaDevices.getUserMedia(config)
		let picture = localStorage.getItem("picture") ? localStorage.getItem("picture") : "/assets/pictures/unknown.jpg"

		let audioCondition = true
		let videoCondition = true
		parameter.initialVideo = true
		parameter.initialAudio = true

		parameter.videoParams.track = stream.getVideoTracks()[0]
		stream.getAudioTracks()[0].enabled = audioCondition
		let user = {
			username,
			socketId: parameter.socketId,
			picture,
			audio: {
				isActive: audioCondition,
				track: stream.getAudioTracks()[0],
				producerId: undefined,
				transportId: undefined,
				consumerId: undefined,
			},
			video: {
				isActive: videoCondition,
				track: stream.getVideoTracks()[0],
				producerId: undefined,
				transportId: undefined,
				consumerId: undefined,
			},
		}

		parameter.picture = picture

		parameter.audioParams.appData.isMicActive = audioCondition
		parameter.audioParams.appData.isVideoActive = videoCondition
		parameter.videoParams.appData.isMicActive = audioCondition
		parameter.videoParams.appData.isVideoActive = videoCondition

		parameter.audioParams.appData.isActive = audioCondition
		parameter.videoParams.appData.isActive = videoCondition

		parameter.videoParams.appData.picture = picture
		parameter.audioParams.appData.picture = picture

		parameter.allUsers = [...parameter.allUsers, user]
		parameter.localStream = stream
		parameter.audioParams.track = stream.getAudioTracks()[0]
	} catch (error) {
		errorHandling({
			type: "major",
			error: `- Error Getting Stream : ${error}`,
			message: `Please make sure you're getting your camera or mic ready!\nThis page will reload after a few seconds!`,
			title: "Error Getting Your Camera or Mic!",
		})
	}
}

const joinRoom = async ({ parameter, socket }) => {
	try {
		parameter.totalUsers++
		parameter.previousVideoLayout = "user-video-container-1"
		parameter.videoLayout = "user-video-container-1"
		socket.emit("joinRoom", { roomName: parameter.roomName, username: parameter.username }, (data) => {
			parameter.rtpCapabilities = data.rtpCapabilities
			parameter.rtpCapabilities.headerExtensions = parameter.rtpCapabilities.headerExtensions.filter(
				(ext) => ext.uri !== "urn:3gpp:video-orientation"
			)
			createDevice({ parameter, socket })
		})
	} catch (error) {
		errorHandling({
			type: "major",
			error: `- Error When Joining Room : ${error}`,
			message: `This Page will reload after a few seconds!\nIf errors still persist, please contact your admin!`,
			title: "Something Went Wrong Went Joining Room!",
		})
	}
}

module.exports = { getMyStream, joinRoom }
