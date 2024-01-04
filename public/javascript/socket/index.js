const {
	changeAppData,
	getPdf,
	goHome,
	addPdfController,
	firstPdfControl,
	signDocument,
	updateDocuments,
	addTataTertibTemplate,
	raiseAndUnraiseHand,
	createUserList,
	removeUserList,
	editUserListRaiseHand,
	queueRenderPage,
	showWarningError,
	errorHandling,
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
	createQueueRaiseHand,
	removeQueueRaiseHand,
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
		await getMyStream(parameter)
		await createMyVideo(parameter)
		await createUserList({ username: parameter.username, id: parameter.socketId, micStatus: true, parameter, socket })
		await joinRoom({ socket, parameter })
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
		// console.log("- Parameter : ", parameter)
	} catch (error) {
		await errorHandling({
			type: "intermediate",
			error: `- Error On Connecting : ${error}`,
			message: `Something wrong when connecting to meeting!`,
			title: "Error!",
		})
	}
})

socket.on("new-producer", ({ producerId, socketId }) => {
	try {
		signalNewConsumerTransport({ remoteProducerId: producerId, socket, parameter, socketId })
	} catch (error) {
		errorHandling({
			type: "major",
			error: `- Error When Joining Room : ${error}`,
			message: `This Page will reload after a few seconds!\nIf errors still persist, please contact your admin!`,
			title: "Something Went Wrong Went Joining Room!",
		})
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
			removeUserList({ id: socketId })
			removeQueueRaiseHand({ id: socketId })
		}
	} catch (error) {
		errorHandling({
			type: "minor",
			error: `- Error When Closing Producer : ${error}`,
			message: `Something wrong when closing producer : !`,
			title: "Error!",
		})
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
		const userListMicIcon = document.getElementById(`user-list-mic-icon-${socket.id}`)
		userListMicIcon.classList.replace("fa-microphone", "fa-microphone-slash")
	} catch (error) {
		errorHandling({
			type: "minor",
			error: `- Error When Locking for All Participants : ${error}`,
			message: `Something wrong when locking mic for all participants!`,
			title: "Error!",
		})
	}
})

socket.on("unmute-all", (data) => {
	try {
		parameter.micCondition.isLocked = false
		parameter.micCondition.socketId = undefined
	} catch (error) {
		errorHandling({
			type: "minor",
			error: `- Error When Unlocking Mic For All Participants : ${error}`,
			message: `Something wrong when unlocking mic for all participants!`,
			title: "Error!",
		})
	}
})

socket.on("change-scroll", ({ socketId, value, type }) => {
	try {
		switch (type) {
			case "transaksi":
				let pdfContainer = document.getElementById("pdf-container")
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
		errorHandling({
			type: "minor",
			error: `- Error When Changing Scroll : ${error}`,
			message: `Something wrong when changing scroll!`,
			title: "Error!",
		})
	}
})

socket.on("change-page", ({ currentPage, pdfDocument }) => {
	queueRenderPage({ parameter, num: currentPage, pdfDocument })
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
	let aktaButton = document.getElementById("akta-button")
	let rulesButton = document.getElementById("rules-button")
	rulesButton.className = "btn btn-secondary"
	aktaButton.className = "btn btn-success"
	if (parameter.event !== "transaksi") {
		parameter.event = "transaksi"
		await displayMainEvent({ event: "transaksi", parameter })
		await queueRenderPage({ parameter, num: 6, pdfDocument: "aktaDocument" })
		parameter.allUsers.forEach((data) => {
			if (data.socketId != socket.id) {
				socket.emit("change-event", { socketId: data.socketId, event: "transaksi" })
				socket.emit("change-page", { socketId: data.socketId, currentPage: 6, pdfDocument: "aktaDocument" })
			}
		})
	} else {
		await queueRenderPage({ parameter, num: 6, pdfDocument: "aktaDocument" })
		parameter.allUsers.forEach((data) => {
			if (data.socketId != socket.id) {
				socket.emit("change-page", { socketId: data.socketId, currentPage: 6, pdfDocument: "aktaDocument" })
			}
		})
	}
})

socket.on("reload-document", ({ message }) => {
	getPdf({ parameter, pdfDocument: "aktaDocument" })
})

socket.on("raise-hand", async ({ status, socketId, username }) => {
	if (status === "raise") {
		await createQueueRaiseHand({ id: socketId, username })
	} else {
		await removeQueueRaiseHand({ id: socketId })
	}
	await editUserListRaiseHand({ id: socketId, action: status })
})

socket.on("kick-user", ({ message }) => {
	showWarningError({ message: "Please contact your admin for more details!\nThis page will be closed after a few seconds!", title: message })
	setTimeout(() => {
		window.location.href = window.location.origin + "/not-found"
	}, 5000)
})

/**  EVENT LISTENER  **/

let micButton = document.getElementById("user-mic-button")
micButton.addEventListener("click", () => {
	try {
		if (parameter.micCondition.isLocked && !parameter.isHost) {
			errorHandling({ type: "intermediate", message: `Mic is Locked By Host`, error: "Permission Error", title: "Oops!" })
			return
		}
		let myIconMic = document.getElementById(`user-mic-${socket.id}`)
		let user = parameter.allUsers.find((data) => data.socketId == socket.id)
		const myMicIcons = document.getElementById("turn-on-off-mic-icons")
		const userListMicIcon = document.getElementById(`user-list-mic-icon-${parameter.socketId}`)
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
			userListMicIcon.classList.replace("fa-microphone", "fa-microphone-slash")
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
			userListMicIcon.classList.replace("fa-microphone-slash", "fa-microphone")
			myMicIcons.classList.replace("fa-microphone-slash", "fa-microphone")
			micButton.removeAttribute("style")
		}
	} catch (error) {
		errorHandling({
			type: "minor",
			error: `- Error When Muting Mic : ${error}`,
			message: `Something wrong when muting mic!`,
			title: "Error!",
		})
	}
})

const usersListButton = document.getElementById("users-list-button")
const userVideoButton = document.getElementById("display-video-button")
userVideoButton.addEventListener("click", () => {
	try {
		const phoneMaxWidth = 850
		const videoContainer = document.getElementById("video-container")
		const displayUserIcon = document.getElementById("display-users-icons")
		const usersListContainer = document.getElementById("users-list-container")
		if (usersListButton.hasAttribute("style")) {
			usersListContainer.style.right = "-100%"
			usersListButton.removeAttribute("style")
		}
		if (window.innerWidth <= phoneMaxWidth) {
			if (!userVideoButton.hasAttribute("style")) {
				videoContainer.style.right = "0"
				userVideoButton.style.backgroundColor = "green"
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
		errorHandling({
			type: "minor",
			error: `- Error When Displaying Participants : ${error}`,
			message: `Something wrong when displaying participants!`,
			title: "Error!",
		})
	}
})

usersListButton.addEventListener("click", () => {
	try {
		const videoContainer = document.getElementById("video-container")
		const usersListContainer = document.getElementById("users-list-container")
		if (userVideoButton.hasAttribute("style")) {
			videoContainer.style.right = "-100%"
			userVideoButton.removeAttribute("style")
		}
		if (!usersListButton.hasAttribute("style")) {
			usersListButton.style.backgroundColor = "green"
			usersListContainer.style.right = "0%"
		} else {
			usersListContainer.style.right = "-100%"
			usersListButton.removeAttribute("style")
		}
	} catch (error) {
		errorHandling({
			type: "minor",
			error: `- Error When Displaying Participants List : ${error}`,
			message: `Something wrong when displaying participants list!`,
			title: "Error!",
		})
	}
})

const raiseHandButton = document.getElementById("raise-hand-button")
raiseHandButton.addEventListener("click", async () => {
	try {
		if (!raiseHandButton.hasAttribute("style")) {
			raiseHandButton.style.backgroundColor = "green"
			await raiseAndUnraiseHand({ parameter, socket, status: "raise" })
			await createQueueRaiseHand({ id: parameter.socketId, username: parameter.username })
			await editUserListRaiseHand({ id: parameter.socketId, action: "raise" })
		} else {
			raiseHandButton.removeAttribute("style")
			await raiseAndUnraiseHand({ parameter, socket, status: "unraise" })
			await removeQueueRaiseHand({ id: parameter.socketId })
			await editUserListRaiseHand({ id: parameter.socketId, action: "unraise" })
		}
	} catch (error) {
		errorHandling({
			type: "minor",
			error: `- Error When Raising Hand : ${error}`,
			message: `Something wrong when raising hand!`,
			title: "Error!",
		})
	}
})

module.exports = { socket, parameter }
