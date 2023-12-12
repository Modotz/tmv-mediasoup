const {
	changeAppData,
	getPdf,
	renderPage,
	goHome,
	addPdfController,
	firstPdfControl,
	signDocument,
	updateDocuments,
	addTataTertibTemplate,
} = require("../room/function")
const { getMyStream, joinRoom } = require("../room/function/initialization")
const { signalNewConsumerTransport } = require("../room/function/mediasoup")
const { Parameters } = require("../room/function/parameter")
const {
	changeMic,
	turnOffOnCamera,
	displayMainEvent,
	unlockOverflow,
	addMuteAllButton,
	addEndButton,
	addStartButton,
	addRulesButton,
	addAktaButton,
	addPPATSignButton,
	signPermission,
	addReloadButton,
} = require("../room/ui/button")
const { createMyVideo, removeVideoAndAudio, changeUserMic } = require("../room/ui/video")

let parameter

const socket = io("/")

socket.on("connection-success", async ({ socketId }) => {
	try {
		console.log("- Id : ", socketId)

		parameter = new Parameters()
		parameter.userData = parsedData
		parameter.roomName = parsedData.roomId
		parameter.username = "Diky"
		parameter.socketId = socketId
		parameter.isVideo = true
		parameter.isAudio = true
		await getPdf({ parameter, pdfDocument: "aktaDocument" })
		await addTataTertibTemplate({ templateTataTertib })
		const windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
		const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
		console.log(`Window Width: ${windowWidth}px`)
		console.log(`Window Height: ${windowHeight}px`)
		if (parameter.userData.authority == "PPAT") {
			parameter.isHost = true
			await addPdfController()
			await unlockOverflow({ element: "side-bar-container", socket, parameter })
			await firstPdfControl({ parameter, socket, pdfDocument: "aktaDocument" })
			await addMuteAllButton({ parameter, socket })
			await addEndButton({ parameter, socket })
			await addStartButton({ parameter, socket })
			await addRulesButton({ parameter, socket })
			await addAktaButton({ parameter, socket })
			await addPPATSignButton({ parameter, socket })
			await addReloadButton({ parameter, socket })
		}
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
			removeVideoAndAudio({ socketId })
		}
	} catch (error) {
		console.log("- Error Closing Producer : ", error)
	}
})

socket.on("mic-config", ({ id, isMicActive }) => {
	changeUserMic({ parameter, isMicActive, id })
})

// Mute All
socket.on("mute-all", ({ hostSocketId }) => {
	try {
		let micButton = document.getElementById("user-mic-button")
		let myIconMic = document.getElementById(`user-mic-${socket.id}`)
		const myIconMicButton = document.getElementById("turn-on-off-mic-icons")
		if (myIconMic) myIconMic.src = "/assets/pictures/micOff.png"
		parameter.micCondition.isLocked = true
		parameter.micCondition.socketId = hostSocketId
		myIconMicButton.classList.replace("fa-microphone", "fa-microphone-slash")
		micButton.style.backgroundColor = "red"
		let user = parameter.allUsers.find((data) => data.socketId == socket.id)
		user.audio.track.enabled = false
		user.audio.isActive = false
		changeMic({ parameter, status: false, socket })
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

socket.on("change-scroll", ({ socketId, value, type }) => {
	try {
		switch (type) {
			case "transaksi":
				let pdfContainer = document.getElementById("pdf-container")
				console.log(value)
				let totalScroll = pdfContainer.scrollHeight - pdfContainer.clientHeight
				let scrolled = Math.floor((totalScroll * value) / 100)
				pdfContainer.scrollTop = scrolled
				break
			case "tata-tertib":
				let tataTertibContainer = document.getElementById("side-bar-container")
				let totalScrollTataTerti = tataTertibContainer.scrollHeight - tataTertibContainer.clientHeight
				let scrolledTataTertib = (value / 100) * totalScrollTataTerti
				tataTertibContainer.scrollTop = scrolledTataTertib
				break
			default:
				break
		}
	} catch (error) {
		console.log("- Error Change Scroll : ", error)
	}
})

socket.on("change-page", ({ currentPage, pdfDocument }) => {
	renderPage({ parameter, num: currentPage, pdfDocument })
})

socket.on("change-event", ({ event }) => {
	displayMainEvent({ event, parameter })
})

socket.on("end-meeting", ({ message }) => {
	goHome()
})

socket.on("update-document", ({ message }) => {
	getPdf({ parameter, pdfDocument: "aktaDocument" })
})

socket.on("get-sign-permission", ({ message, PPATSocket, data }) => {
	signPermission({ socket, parameter, PPATSocket, data })
})

socket.on("document-sign-agreed", async ({ message, data }) => {
	await signDocument({ data, parameter, socket })
	await updateDocuments({ parameter, socket })
})

socket.on("reload-document", ({ message }) => {
	getPdf({ parameter, pdfDocument: "aktaDocument" })
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
	const myMicIcons = document.getElementById("turn-on-off-mic-icons")
	if (myMicIcons.classList.contains("fa-microphone")) {
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
		// micButton.firstElementChild.innerHTML = "Muted"
		myMicIcons.classList.replace("fa-microphone", "fa-microphone-slash")
		micButton.style.backgroundColor = "red"
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
		// micButton.firstElementChild.innerHTML = "Mute"
		myMicIcons.classList.replace("fa-microphone-slash", "fa-microphone")
		micButton.removeAttribute("style")
	}
})

const userVideoButton = document.getElementById("display-video-button")
userVideoButton.addEventListener("click", () => {
	try {
		const phoneMaxWidth = 850

		const videoContainer = document.getElementById("video-container")
		const displayUserIcon = document.getElementById("display-users-icons")
		if (window.innerWidth <= phoneMaxWidth) {
			if (!userVideoButton.hasAttribute("style")) {
				videoContainer.style.right = "0"
				userVideoButton.style.backgroundColor = "red"
			} else {
				videoContainer.style.right = "-100%"
				userVideoButton.removeAttribute("style")
			}
		} else {
			videoContainer.removeAttribute("style")
			displayUserIcon.classList.replace("fa-users-slash", "fa-users")
			userVideoButton.removeAttribute("style")
		}
	} catch (error) {
		console.log("- Error Displaying User : ", error)
	}
})

const raiseHandButton = document.getElementById("raise-hand-button")
raiseHandButton.addEventListener("click", () => {
	try {
		if (!raiseHandButton.hasAttribute("style")){
			raiseHandButton.style.backgroundColor = "red"
		} else {
			raiseHandButton.removeAttribute("style")
		}
	} catch (error) {
		console.log("- Error Raising Hand : ", error)
	}
})

module.exports = { socket, parameter }
