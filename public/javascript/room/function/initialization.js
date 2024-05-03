const { createUserList } = require(".")
const { socket } = require("../../socket")
const { startFR } = require("./face-recognition")
const { createDevice } = require("./mediasoup")

// const getMyStream = async (parameter) => {
// 	try {
// 		function arrayBufferToBase64(buffer) {
// 			var binary = ""
// 			var bytes = new Uint8Array(buffer)
// 			var len = bytes.byteLength
// 			for (var i = 0; i < len; i++) {
// 				binary += String.fromCharCode(bytes[i])
// 			}
// 			return window.btoa(binary)
// 		}

// 		let username = localStorage.getItem("username")
// 		parameter.username = username
// 		// let picture = localStorage.getItem("picture") ? localStorage.getItem("picture") : "/assets/pictures/unknown.jpg"
// 		const baseurl = window.location.origin
// 		const url = window.location.pathname
// 		const parts = url.split("/")
// 		const roomName = parts[2]
// 		const response = await fetch(`${baseurl}/user/${username}`)
// 		if (!response.ok) {
// 			return
// 		}
// 		const pictureBuffer = await response.arrayBuffer()
// 		const pictureUser = new Blob([pictureBuffer], { type: "application/png" })
// 		const pic = `data:image/png;base64,${await arrayBufferToBase64(pictureBuffer)}`
// 		let config = {
// 			video: true,
// 			audio: {
// 				autoGainControl: false,
// 				noiseSuppression: true,
// 				echoCancellation: true,
// 			},
// 		}

// 		let stream = await navigator.mediaDevices.getUserMedia(config)

// 		document.getElementById("video").srcObject = stream

// 		startFR({ videoElementId: "video", name: username, picture: pic })

// 		// let audioCondition = true
// 		// let videoCondition = true
// 		// parameter.initialVideo = true
// 		// parameter.initialAudio = true
// 		// parameter.videoParams.track = stream.getVideoTracks()[0]
// 		// stream.getAudioTracks()[0].enabled = audioCondition
// 		// let user = {
// 		// 	username,
// 		// 	socketId: parameter.socketId,
// 		// 	picture,
// 		// 	audio: {
// 		// 		isActive: audioCondition,
// 		// 		track: stream.getAudioTracks()[0],
// 		// 		producerId: undefined,
// 		// 		transportId: undefined,
// 		// 		consumerId: undefined,
// 		// 	},
// 		// }

// 		// if (videoCondition) {
// 		// 	user.video = {
// 		// 		isActive: videoCondition,
// 		// 		track: stream.getVideoTracks()[0],
// 		// 		producerId: undefined,
// 		// 		transportId: undefined,
// 		// 		consumerId: undefined,
// 		// 	}
// 		// }

// 		// parameter.picture = picture

// 		// parameter.audioParams.appData.isMicActive = audioCondition
// 		// parameter.audioParams.appData.isVideoActive = videoCondition
// 		// parameter.videoParams.appData.isMicActive = audioCondition
// 		// parameter.videoParams.appData.isVideoActive = videoCondition

// 		// parameter.audioParams.appData.isActive = audioCondition
// 		// parameter.videoParams.appData.isActive = videoCondition

// 		// parameter.videoParams.appData.picture = picture
// 		// parameter.audioParams.appData.picture = picture

// 		// parameter.allUsers = [...parameter.allUsers, user]
// 		// parameter.localStream = stream
// 		// parameter.audioParams.track = stream.getAudioTracks()[0]

// 		// parameter.devices.audio.id = localStorage.getItem("selectedAudioDevices")
// 		// parameter.devices.video.id = localStorage.getItem("selectedVideoDevices")
// 		// createUserList({ username: parameter.username, socketId: parameter.socketId, cameraTrigger: videoCondition, picture, micTrigger: audioCondition })
// 	} catch (error) {
// 		console.log("- Error Getting My Stream : ", error)
// 		let ae = document.getElementById("alert-error")
// 		ae.className = "show"
// 		ae.innerHTML = `Error getting your stream\nPlease make sure your camera is working\nThis page will refresh in a few seconds`
// 		// Show Warning
// 		setTimeout(() => {
// 			ae.className = ae.className.replace("show", "")
// 			ae.innerHTML = ``
// 		}, 5000)
// 		return
// 	}
// }

const getMyStream = async (parameter) => {
	try {
		function arrayBufferToBase64(buffer) {
			var binary = ""
			var bytes = new Uint8Array(buffer)
			var len = bytes.byteLength
			for (var i = 0; i < len; i++) {
				binary += String.fromCharCode(bytes[i])
			}
			return window.btoa(binary)
		}

		let username = localStorage.getItem("username")
		parameter.username = username
		// let picture = localStorage.getItem("picture") ? localStorage.getItem("picture") : "/assets/pictures/unknown.jpg"
		const baseurl = window.location.origin
		const url = window.location.pathname
		const parts = url.split("/")
		const roomName = parts[2]
		const response = await fetch(`${baseurl}/user/${username}`)
		if (!response.ok) {
			return
		}
		const pictureBuffer = await response.arrayBuffer()
		const pictureUser = new Blob([pictureBuffer], { type: "application/png" })
		const picture = `data:image/png;base64,${await arrayBufferToBase64(pictureBuffer)}`
		let config = {
			video: true,
			audio: {
				autoGainControl: false,
				noiseSuppression: true,
				echoCancellation: true,
			},
		}

		let stream = await navigator.mediaDevices.getUserMedia(config)

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
			}
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

		parameter.devices.audio.id = localStorage.getItem("selectedAudioDevices")
		parameter.devices.video.id = localStorage.getItem("selectedVideoDevices")
		createUserList({ username: parameter.username, socketId: parameter.socketId, cameraTrigger: videoCondition, picture, micTrigger: audioCondition })
	} catch (error) {
		console.log("- Error Getting My Stream : ", error)
		let ae = document.getElementById("alert-error")
		ae.className = "show"
		ae.innerHTML = `Error getting your stream\nPlease make sure your camera is working\nThis page will refresh in a few seconds`
		// Show Warning
		setTimeout(() => {
			ae.className = ae.className.replace("show", "")
			ae.innerHTML = ``
		}, 5000)
		return
	}
}

const getRoomId = async (parameter) => {
	try {
		const url = window.location.pathname
		const parts = url.split("/")
		const roomName = parts[2]
		parameter.roomName = roomName
	} catch (error) {
		console.log("- Error Getting Room Id : ", error)
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
		console.log("- Error Joining Room : ", error)
	}
}

module.exports = { getMyStream, getRoomId, joinRoom }
