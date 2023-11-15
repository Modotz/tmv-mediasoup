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
	renderPage,
	goHome,
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
		await getPdf({ parameter, pdfDocument: "firstDocument" })
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
		let myIconMic = document.getElementById(`user-mic-${socket.id}`)
		if (myIconMic) myIconMic.src = "/assets/pictures/micOff.png"
		parameter.micCondition.isLocked = true
		parameter.micCondition.socketId = hostSocketId
		micButton.classList.replace("btn-success", "btn-danger")
		micButton.firstElementChild.innerHTML = "Muted"
		let user = parameter.allUsers.find((data) => data.socketId == socket.id)
		user.audio.track.enabled = false
		user.audio.isActive = false
		changeMic({ parameter, status: false, socket })
		changeUserListMicIcon({ status: true, id: socket.id })
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

socket.on("change-scroll", ({ socketId, value }) => {
	try {
		let pdfContainer = document.getElementById("pdf-container")
		let totalScroll = pdfContainer.scrollHeight - pdfContainer.clientHeight
		let scrolled = (value / 100) * totalScroll
		pdfContainer.scrollTop = scrolled
	} catch (error) {
		console.log("- Error Change Scroll : ", error)
	}
})

socket.on("change-page", ({ currentPage, pdfDocument }) => {
	renderPage({ parameter, num: currentPage, pdfDocument })
})

socket.on("change-pdf", ({ pdfDocument }) => {
	getPdf({ parameter, pdfDocument })
})

socket.on("end-meeting", ({ message }) => {
	goHome()
})

/**  EVENT LISTENER  **/

let micButton = document.getElementById("user-mic-button")
micButton.addEventListener("click", () => {
	if (parameter.micCondition.isLocked && !parameter.isHost) {
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
	let isActive = micButton.firstElementChild.innerHTML
	let myIconMic = document.getElementById(`user-mic-${socket.id}`)
	let user = parameter.allUsers.find((data) => data.socketId == socket.id)
	console.log(isActive)
	if (isActive == "Mute") {
		parameter.isAudio = false
		changeAppData({
			socket,
			data: { isActive: false, isMicActive: false, isVideoActive: parameter.videoProducer ? true : false },
			remoteProducerId: parameter.audioProducer.id,
		})
		micButton.classList.replace("btn-success", "btn-danger")
		user.audio.track.enabled = false
		user.audio.isActive = false
		myIconMic.src = "/assets/pictures/micOff.png"
		changeMic({ parameter, status: false, socket })
		micButton.firstElementChild.innerHTML = "Muted"
	} else {
		parameter.isAudio = false
		changeAppData({
			socket,
			data: { isActive: false, isMicActive: false, isVideoActive: parameter.videoProducer ? true : false },
			remoteProducerId: parameter.audioProducer.id,
		})
		micButton.classList.replace("btn-danger", "btn-success")
		user.audio.track.enabled = true
		user.audio.isActive = true
		myIconMic.src = "/assets/pictures/micOn.png"
		changeMic({ parameter, status: true, socket })
		micButton.firstElementChild.innerHTML = "Mute"
	}
})

module.exports = { socket, parameter }
