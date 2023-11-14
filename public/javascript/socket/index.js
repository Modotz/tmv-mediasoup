const {
	changeUserListMicIcon,
	sendMessage,
	receiveMessage,
	hideOptionMenu,
	showOptionMenu,
	scrollToBottom,
	checkLocalStorage,
	changeAppData,
	getPdf,
} = require("../room/function")
const { getMyStream, getRoomId, joinRoom } = require("../room/function/initialization")
const { signalNewConsumerTransport } = require("../room/function/mediasoup")
const { Parameters } = require("../room/function/parameter")
const {
	changeMic,
	turnOffOnCamera,
	switchCamera,
	getScreenSharing,
	changeLayoutScreenSharing,
	changeLayoutScreenSharingClient,
	recordVideo,
} = require("../room/ui/button")
const { createMyVideo, removeVideoAndAudio, updatingLayout, changeLayout, changeUserMic, removeUserList } = require("../room/ui/video")

let parameter

const socket = io("/")

socket.on("connection-success", async ({ socketId }) => {
	try {
		console.log("- Id : ", socketId)
		parameter = new Parameters()
		parameter.username = "Diky"
		parameter.socketId = socketId
		parameter.isVideo = true
		parameter.isAudio = true
		await getPdf({ parameter })
		await getRoomId(parameter)
		await checkLocalStorage({ parameter })
		await getMyStream(parameter)
		await createMyVideo(parameter)
		await joinRoom({ socket, parameter })
		// console.log("- Parameter : ", parameter)
	} catch (error) {
		console.log("- Error On Connecting : ", error)
	}
})

socket.on("new-producer", ({ producerId, socketId }) => {
	try {
		signalNewConsumerTransport({ remoteProducerId: producerId, socket, parameter, socketId })
	} catch (error) {
		console.log("- Error Receiving New Producer : ", error)
	}
})

socket.on("producer-closed", ({ remoteProducerId, socketId }) => {
	try {
		const producerToClose = parameter.consumerTransports.find((transportData) => transportData.producerId === remoteProducerId)
		producerToClose.consumerTransport.close()
		producerToClose.consumer.close()

		let checkData = parameter.allUsers.find((data) => data.socketId === socketId)

		let kind

		for (const key in checkData) {
			if (typeof checkData[key] == "object" && checkData[key]) {
				if (checkData[key].producerId == remoteProducerId) {
					kind = key
				}
			}
		}

		if (kind == "video") {
			turnOffOnCamera({ id: socketId, status: false })
		}

		if (kind == "screensharing") {
			changeLayoutScreenSharingClient({ track: null, id: checkData.socketId, parameter, status: false })
		}

		if (kind == "screensharingaudio") {
			let screensharingAudio = document.getElementById(`${socketId}screensharingaudio`)
			if (screensharingAudio) screensharingAudio.remove()
		}

		if (kind) {
			delete checkData[kind]
		}

		if (checkData && !checkData.audio && !checkData.video) {
			parameter.allUsers = parameter.allUsers.filter((data) => data.socketId !== socketId)
			parameter.totalUsers--
			updatingLayout({ parameter })
			// changeLayout({ parameter })
			removeVideoAndAudio({ socketId })
			removeUserList({ id: socketId })
			if (checkData.screensharing) {
				changeLayoutScreenSharingClient({ track: null, id: checkData.socketId, parameter, status: false })
			}
		}
	} catch (error) {
		console.log("- Error Closing Producer : ", error)
	}
})

socket.on("mic-config", ({ id, isMicActive }) => {
	changeUserMic({ parameter, isMicActive, id })
})

socket.on("receive-message", ({ message, sender, messageDate }) => {
	try {
		receiveMessage({ message, sender, date: messageDate })
	} catch (error) {
		console.log("- Error Receving Message Socker : ", error)
	}
})

// Mute All
socket.on("mute-all", ({ hostSocketId }) => {
	try {
		let micButton = document.getElementById("user-mic-button")
		let micImage = document.getElementById("mic-image")
		let myIconMic = document.getElementById(`user-mic-${socket.id}`)
		if (myIconMic) myIconMic.src = "/assets/pictures/micOff.png"
		parameter.micCondition.isLocked = true
		parameter.micCondition.socketId = hostSocketId
		micButton.classList.replace("button-small-custom", "button-small-custom-clicked")
		let user = parameter.allUsers.find((data) => data.socketId == socket.id)
		user.audio.track.enabled = false
		user.audio.isActive = false
		changeMic({ parameter, status: false, socket })
		changeUserListMicIcon({ status: true, id: socket.id })
		micImage.src = "/assets/pictures/micOff.png"
	} catch (error) {
		console.log("- Error Muting All Participants : ", error)
	}
})

socket.on("unmute-all", (data) => {
	try {
		parameter.micCondition.isLocked = false
		parameter.micCondition.socketId = undefined
	} catch (error) {
		console.log("- Error Unlocking Mic Participants Socket On : ", error)
	}
})

/**  EVENT LISTENER  **/

let micButton = document.getElementById("user-mic-button")
micButton.addEventListener("click", () => {
	if (parameter.micCondition.isLocked) {
		let ae = document.getElementById("alert-error")
		ae.className = "show"
		ae.innerHTML = `Mic is Locked By Host`
		// Show Warning
		setTimeout(() => {
			ae.className = ae.className.replace("show", "")
			ae.innerHTML = ``
		}, 3000)
		return
	}
	// let isActive = micButton.querySelector("img").src.split('/').pop();
	let isActive = micButton.querySelector("img").src.includes("micOn.png")
	let myIconMic = document.getElementById(`user-mic-${socket.id}`)
	let user = parameter.allUsers.find((data) => data.socketId == socket.id)
	if (isActive) {
		parameter.isAudio = false
		changeAppData({
			socket,
			data: { isActive: false, isMicActive: false, isVideoActive: parameter.videoProducer ? true : false },
			remoteProducerId: parameter.audioProducer.id,
		})
		micButton.classList.replace("button-small-custom", "button-small-custom-clicked")
		user.audio.track.enabled = false
		user.audio.isActive = false
		myIconMic.src = "/assets/pictures/micOff.png"
		micButton.querySelector("img").src = "/assets/pictures/micOff.png"
		changeMic({ parameter, status: false, socket })
		changeUserListMicIcon({ status: true, id: socket.id })
	} else {
		parameter.isAudio = false
		changeAppData({
			socket,
			data: { isActive: false, isMicActive: false, isVideoActive: parameter.videoProducer ? true : false },
			remoteProducerId: parameter.audioProducer.id,
		})
		micButton.classList.replace("button-small-custom-clicked", "button-small-custom")
		user.audio.track.enabled = true
		user.audio.isActive = true
		myIconMic.src = "/assets/pictures/micOn.png"
		micButton.querySelector("img").src = "/assets/pictures/micOn.png"
		changeMic({ parameter, status: true, socket })
		changeUserListMicIcon({ status: false, id: socket.id })
	}
})

let recordButton = document.getElementById("user-record-button")
recordButton.addEventListener("click", () => {
	recordVideo({ parameter })
})

// Hang Up Button
const hangUpButton = document.getElementById("user-hang-up-button")
hangUpButton.addEventListener("click", () => {
	try {
		localStorage.clear()
		window.location.href = window.location.origin
	} catch (error) {
		console.log("- Error At Hang Up Button : ", error)
	}
})

module.exports = { socket, parameter }
