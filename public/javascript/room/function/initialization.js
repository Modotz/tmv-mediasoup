const { createUserList } = require(".")
const { socket } = require("../../socket")
const { createDevice } = require("./mediasoup")

const getMyStream = async (parameter) => {
	try {
		// Configuration for Audio
		let audioConfiguration = {
			autoGainControl: false,
			noiseSuppression: true,
			echoCancellation: true,
		}

		// Configuration for Video
		let config = {
			video:
				localStorage.getItem("is_video_active") == "true"
					? {
							deviceId: { exact: localStorage.getItem("selectedVideoDevices") },
							frameRate: { ideal: 30, max: 35 },
					  }
					: false,
			audio: localStorage.getItem("selectedVideoDevices")
				? {
						deviceId: { exact: localStorage.getItem("selectedAudioDevices") },
						...audioConfiguration,
				  }
				: audioConfiguration,
		}

		// Get Username
		let username = localStorage.getItem("username") ? localStorage.getItem("username") : "unknown"
		parameter.username = username

		// Get Mediastream
		let stream = await navigator.mediaDevices.getUserMedia(config)
		let picture = localStorage.getItem("picture") ? localStorage.getItem("picture") : "/assets/pictures/unknown.jpg"

		// Check if Mic and Camera is Active or Not
		let audioCondition
		let videoCondition

		// I Forgot What is this Parameters for
		parameter.initialVideo = true
		parameter.initialAudio = true
		
		// Checking Initial Mic is Active or Not from Lobby Configuration
		if (localStorage.getItem("is_mic_active") == "false") {
			document.getElementById("mic-image").src = "/assets/pictures/micOff.png"
			document.getElementById("user-mic-button").className = "button-small-custom-clicked"
			parameter.initialAudio = false
			audioCondition = false
		} else audioCondition = true

		// Checking Initial Camera is Active or Not from Lobby Configuration
		if (localStorage.getItem("is_video_active") == "false") {
			document.getElementById("turn-on-off-camera-icons").className = "fas fa-video-slash"
			document.getElementById("user-turn-on-off-camera-button").className = "button-small-custom-clicked"
			videoCondition = false
			parameter.initialVideo = false
		} else {
			videoCondition = true

			// If Camera Active, Save Track to Send it to Server Later
			parameter.videoParams.track = stream.getVideoTracks()[0]
		}

		// Enabled / Disabled Mic Based On Lobby Configuration
		stream.getAudioTracks()[0].enabled = audioCondition

		// Save User Information to Parameter
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
		}

		// If Camera is Active from Lobby Configuration, then Save Video Information to Parameter
		if (videoCondition) {
			user.video = {
				isActive: videoCondition,
				track: stream.getVideoTracks()[0],
				producerId: undefined,
				transportId: undefined,
				consumerId: undefined,
			}
		}

		// Save Picture Url to Parameter
		parameter.picture = picture

		// Configuration For Server (Current Condition of Camera and Mic)
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
		createUserList({ username: "Diky", socketId: parameter.socketId, cameraTrigger: videoCondition, picture, micTrigger: audioCondition })
	} catch (error) {
		console.log("- Error Getting My Stream : ", error)
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
