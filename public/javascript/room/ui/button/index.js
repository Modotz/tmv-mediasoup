const RecordRTC = require("recordrtc")
const {
	timerLayout,
	muteAllParticipants,
	unlockAllMic,
	getPdf,
	goHome,
	signDocument,
	updateDocuments,
} = require("../../function")

const changeMic = ({ parameter, socket, status }) => {
	parameter.allUsers.forEach((data) => {
		if (data.socketId != socket.id) {
			socket.emit("mic-config", { sendTo: data.socketId, isMicActive: status, id: socket.id })
		}
	})
}

const turnOffOnCamera = ({ id, status }) => {
	let videoId = document.getElementById(`user-picture-container-${id}`)
	let cameraIconsUserList = document.getElementById("ulic-" + id)
	if (!status && videoId) {
		videoId.className = "video-off"
	} else videoId.className = "video-on"
	if (cameraIconsUserList) cameraIconsUserList.className = `${status ? "fas fa-video" : "fas fa-video-slash"}`
}

const recordVideo = async ({ parameter, socket }) => {
	try {
		let recordButton = document.getElementById("user-record-button")
		if (recordButton.firstChild.innerHTML == "Start") {
			recordButton.firstChild.innerHTML = "Started"
			recordButton.className = "btn btn-danger"
			const videoStream = await navigator.mediaDevices.getDisplayMedia({
				video: {
					cursor: "always",
					displaySurface: "monitor",
					chromeMediaSource: "desktop",
				},
			})

			let screenSharingStream = new MediaStream()
			videoStream.getVideoTracks().forEach((track) => screenSharingStream.addTrack(track))

			let allAudio = []

			parameter.allUsers.forEach((data) => {
				for (const key in data) {
					console.log(key, "KEY")
					if (typeof data[key] == "object" && (key == "audio" || key == "screensharingaudio") && data[key]) {
						allAudio.push(data[key].track)
					}
				}
			})
			let allAudioFlat = allAudio.flatMap((track) => track)

			parameter.record.audioContext = new (window.AudioContext || window.webkitAudioContext)()
			parameter.record.audioDestination = parameter.record.audioContext.createMediaStreamDestination()

			allAudioFlat.forEach((track) => {
				const audioSource = parameter.record.audioContext.createMediaStreamSource(new MediaStream([track]))
				audioSource.connect(parameter.record.audioDestination)
			})

			screenSharingStream.addTrack(parameter.record.audioDestination.stream.getAudioTracks()[0])
			parameter.record.recordedStream = screenSharingStream
			parameter.record.recordedMedia = new RecordRTC(parameter.record.recordedStream, {
				type: "video",
				getNativeBlob: true,
				timeSlice: 5000,
				ondataavailable: (blob) => {
					// socket.send({ type: 'collecting', data: blob })
					console.log("- Blob : ", blob)
				},
			})

			parameter.record.recordedMedia.startRecording()
			parameter.record.recordedStream.getAudioTracks()[0].onended = () => {
				parameter.record.audioContext = null
				parameter.record.audioDestination = null
			}

			parameter.record.recordedStream.getVideoTracks()[0].onended = () => {
				parameter.record.recordedMedia.stopRecording(() => {
					// socket.send({ type: 'uploading' })
					timerLayout({ status: false })
					parameter.record.isRecording = false
					let blob = parameter.record.recordedMedia.getBlob()

					// require('recordrtc').getSeekableBlob(recordedMediaRef.current.getBlob(), (seekable) => {
					//     console.log("- SeekableBlob : ", seekable)
					//     downloadRTC(seekable)
					// })
					// downloadRTC(blob)
					const currentDate = new Date()
					const formattedDate = currentDate
						.toLocaleDateString("en-GB", {
							day: "2-digit",
							month: "2-digit",
							year: "numeric",
						})
						.replace(/\//g, "") // Remove slashes from the formatted date

					const file = new File([blob], formattedDate, {
						type: "video/mp4",
					})
					require("recordrtc").invokeSaveAsDialog(file, file.name)
					parameter.record.recordedStream.getTracks().forEach((track) => track.stop())
					parameter.record.recordedStream = null
					parameter.record.recordedMedia.reset()
					parameter.record.recordedMedia = null
				})
			}

			parameter.record.isRecording = true

			timerLayout({ status: true })
		} else {
			recordButton.firstChild.innerHTML = "Start"
			recordButton.className = "btn btn-secondary"
			parameter.record.recordedMedia.stopRecording(() => {
				// socket.send({ type: 'uploading' })
				timerLayout({ status: false })
				parameter.record.isRecording = false
				let blob = parameter.record.recordedMedia.getBlob()
				// require('recordrtc').getSeekableBlob(recordedMedia.getBlob(), (seekable) => {
				//     console.log("- SeekableBlob : ", seekable)
				//     downloadRTC(seekable)
				// })
				// downloadRTC(blob)
				const currentDate = new Date()
				const formattedDate = currentDate
					.toLocaleDateString("en-GB", {
						day: "2-digit",
						month: "2-digit",
						year: "numeric",
					})
					.replace(/\//g, "") // Remove slashes from the formatted date

				const file = new File([blob], formattedDate, {
					type: "video/mp4",
				})

				require("recordrtc").invokeSaveAsDialog(file, file.name)
				parameter.record.recordedStream.getTracks().forEach((track) => track.stop())
				parameter.record.recordedStream = null
				parameter.record.recordedMedia.reset()
				parameter.record.recordedMedia = null
			})
		}
	} catch (error) {
		console.log("- Error Recording : ", error)
		// socket.send({ type: 'uploading' })
		timerLayout({ status: false })
		if (parameter.record.recordedStream) {
			parameter.record.recordedStream.getTracks().forEach((track) => track.stop())
			parameter.record.recordedStream = null
		}
		if (parameter.record.recordedMedia) {
			parameter.record.isRecording = false
			let blob = parameter.record.recordedMedia.getBlob()
			// require('recordrtc').getSeekableBlob(recordedMedia.getBlob(), (seekable) => {
			//     console.log("- SeekableBlob : ", seekable)
			//     downloadRTC(seekable)
			// })
			// downloadRTC(blob)
			const currentDate = new Date()
			const formattedDate = currentDate
				.toLocaleDateString("en-GB", {
					day: "2-digit",
					month: "2-digit",
					year: "numeric",
				})
				.replace(/\//g, "") // Remove slashes from the formatted date

			const file = new File([blob], formattedDate, {
				type: "video/mp4",
			})

			require("recordrtc").invokeSaveAsDialog(file, file.name)
			parameter.record.recordedStream.getTracks().forEach((track) => track.stop())
			parameter.record.recordedStream = null
			parameter.record.recordedMedia.reset()
			parameter.record.recordedMedia = null
		}
	}
}

const addMuteAllButton = ({ parameter, socket }) => {
	try {
		let rightSection = document.getElementById("right-section")
		let isExist = document.getElementById("mute-all")
		parameter.micCondition.socketId = parameter.socketId
		if (!isExist) {
			const newElement = document.createElement("button")
			newElement.id = "mute-all-button"
			newElement.className = "btn button-small-custom"
			newElement.innerHTML = `<span id="mute-all-button-tooltip">Mute All Users</span><i class="fas fa-user-times" style="color: #ffffff;"></i>`
			rightSection.insertBefore(newElement, rightSection.firstChild)
			newElement.addEventListener("click", () => {
				if (!newElement.hasAttribute("style")) {
					muteAllParticipants({ parameter, socket })
					newElement.style.backgroundColor = "red"
					parameter.micCondition.isLocked = true
				} else if (newElement.hasAttribute("style")) {
					parameter.micCondition.isLocked = false
					unlockAllMic({ parameter, socket })
					newElement.removeAttribute("style")
				} else {
					let ae = document.getElementById("alert-error")
					ae.className = "show"
					ae.innerHTML = `You're Not Host`
					// Show Warning
					setTimeout(() => {
						ae.className = ae.className.replace("show", "")
						ae.innerHTML = ``
					}, 3000)
				}
			})
		}
	} catch (error) {
		console.log("- Error Adding Mute All Button : ", error)
	}
}

const addEndButton = ({ parameter, socket }) => {
	try {
		let rightSection = document.getElementById("right-section")
		let endButton = document.createElement("button")
		endButton.id = "end-button"
		endButton.className = "btn button-small-custom"
		endButton.innerHTML = `<span id="end-button-tooltip">End Meeting</span><i class="fas fa-hourglass-end" style="color: #ffffff;"></i>`
		rightSection.appendChild(endButton)
		endButton.addEventListener("click", () => {
			parameter.allUsers.forEach((data) => {
				if (data.socketId != socket.id) {
					socket.emit("end-meeting", { socketId: data.socketId })
				}
			})
			goHome()
		})
	} catch (error) {
		console.log("- Error Adding End Button : ", error)
	}
}

const addStartButton = ({ parameter, socket }) => {
	try {
		let leftSection = document.getElementById("left-section")
		let startButton = document.createElement("button")
		startButton.id = "user-record-button"
		startButton.className = "btn btn-secondary"
		startButton.innerHTML = `<span>Start</span>`
		leftSection.appendChild(startButton)
		startButton.addEventListener("click", () => {
			recordVideo({ parameter, socket })
		})
	} catch (error) {
		console.log("- Error Adding Start Button : ", error)
	}
}

const addRulesButton = ({ parameter, socket }) => {
	try {
		let leftSection = document.getElementById("left-section")
		let rulesButton = document.createElement("button")
		rulesButton.id = "rules-button"
		rulesButton.className = "btn btn-success"
		rulesButton.innerHTML = `<span>Tata Tertib</span>`
		leftSection.appendChild(rulesButton)
		rulesButton.addEventListener("click", () => {
			let aktaButton = document.getElementById("akta-button")
			aktaButton.className = "btn btn-secondary"
			rulesButton.className = "btn btn-success"
			displayMainEvent({ event: "tata-tertib", parameter })
			parameter.allUsers.forEach((data) => {
				if (data.socketId != socket.id) {
					socket.emit("change-event", { socketId: data.socketId, event: "tata-tertib" })
				}
			})
		})
	} catch (error) {
		console.log("- Error Adding Rules Button : ", error)
	}
}

const addAktaButton = ({ parameter, socket }) => {
	try {
		let leftSection = document.getElementById("left-section")
		let aktaButton = document.createElement("button")
		aktaButton.id = "akta-button"
		aktaButton.className = "btn btn-secondary"
		aktaButton.innerHTML = `<span>Akta</span>`
		leftSection.appendChild(aktaButton)
		aktaButton.addEventListener("click", () => {
			let rulesButton = document.getElementById("rules-button")
			rulesButton.className = "btn btn-secondary"
			aktaButton.className = "btn btn-success"
			getPdf({ parameter, pdfDocument: "aktaDocument" })
			displayMainEvent({ event: "transaksi", parameter })
			parameter.allUsers.forEach((data) => {
				if (data.socketId != socket.id) {
					socket.emit("change-event", { socketId: data.socketId, event: "transaksi" })
				}
			})
		})
	} catch (error) {
		console.log("- Error Adding Rules Button : ", error)
	}
}

const unlockOverflow = ({ element, socket, parameter }) => {
	let elementToUnlock = document.getElementById(element)
	elementToUnlock.classList.add("unlock-scroll")
	elementToUnlock.addEventListener("scroll", () => {
		clearTimeout(parameter.scrollTimer)
		parameter.scrollTimer = setTimeout(function () {
			let totalScroll = elementToUnlock.scrollHeight - elementToUnlock.clientHeight
			let scrolled = Math.floor((elementToUnlock.scrollTop / Math.floor(totalScroll)) * 100)
			parameter.allUsers.forEach((data) => {
				if (data.socketId != socket.id) {
					socket.emit("change-scroll", { socketId: data.socketId, value: scrolled, type: "tata-tertib" })
				}
			})
		}, 500)
	})
}

const displayMainEvent = ({ event, parameter }) => {
	try {
		let tataTertib = document.getElementById("tata-tertib")
		let transaction = document.getElementById("pdf-document")
		let sideBarContainer = document.getElementById("side-bar-container")
		parameter.event = event
		switch (event) {
			case "tata-tertib":
				tataTertib.removeAttribute("class")
				transaction.className = "hide-event"
				if (parameter.isHost) {
					sideBarContainer.className = "unlock-scroll"
				}
				break
			case "transaksi":
				transaction.removeAttribute("class")
				tataTertib.className = "hide-event"
				sideBarContainer.removeAttribute("class")
				break
			default:
				break
		}
	} catch (error) {
		console.log("- Error displaying main event : ", error)
	}
}

const addPPATSignButton = ({ parameter, socket }) => {
	try {
		let pdfControllerContainer = document.getElementById("pdf-controller")
		const PPATSignButton = document.createElement("button")
		PPATSignButton.id = "PPAT-sign-button"
		PPATSignButton.innerHTML = "Sign Document"
		PPATSignButton.className = "btn btn-primary"
		PPATSignButton.addEventListener("click", async () => {
			let data = {
				isPPAT: true,
				username: parameter.username,
				room: parameter.userData.transactionId,
				role: "PPAT",
			}
			await signDocument({ parameter, socket, data })
			await updateDocuments({ parameter, socket })
		})
		pdfControllerContainer.appendChild(PPATSignButton)
	} catch (error) {
		console.log("- Error Adding PPAT Sign Button : ", error)
	}
}

const addReloadButton = ({ parameter, socket }) => {
	try {
		let pdfControllerContainer = document.getElementById("pdf-controller")
		const reloadPageButton = document.createElement("button")
		reloadPageButton.id = "reload-button"
		reloadPageButton.innerHTML = "Refresh Document"
		reloadPageButton.className = "btn btn-info"
		pdfControllerContainer.insertBefore(reloadPageButton, pdfControllerContainer.firstChild)
		reloadPageButton.addEventListener("click", () => {
			getPdf({ parameter, pdfDocument: "aktaDocument" })
			parameter.allUsers.forEach((data) => {
				if (data.socketId != socket.id) {
					socket.emit("reload-document", { socketId: data.socketId })
				}
			})
		})
	} catch (error) {
		console.log(error)
	}
}

const addSaksiSignButton = async ({ id, role, username, parameter, socket }) => {
	let videoId = document.getElementById(`vc-${id}`)
	let saksiSignButton = document.createElement("button")
	saksiSignButton.id = "signature-" + id
	saksiSignButton.className = "signature"
	saksiSignButton.innerHTML = "Sign"
	videoId.appendChild(saksiSignButton)
	saksiSignButton.addEventListener("click", async () => {
		let data = {
			isPPAT: false,
			username,
			room: parameter.userData.transactionId,
			role,
		}
		socket.emit("get-sign-permission", { PPATSocket: socket.id, saksiSocket: id, data })
	})
}

const signPermission = ({ socket, parameter, PPATSocket, data }) => {
	try {
		const displaySign = document.getElementById("sign-password")
		displaySign.classList.add("show")
		displaySign.style.display = "block"
		const signInButton = document.getElementById("confirm-sign-button")
		const signDocument = () => {
			socket.emit("document-sign-agreed", { PPATSocket, data })
			displaySign.classList.remove("show")
			displaySign.removeAttribute("style")
			signInButton.removeEventListener("click", signDocument)
		}
		signInButton.addEventListener("click", signDocument)
	} catch (error) {
		console.log(error)
	}
}

module.exports = {
	changeMic,
	turnOffOnCamera,
	recordVideo,
	addMuteAllButton,
	addStartButton,
	addEndButton,
	addRulesButton,
	addAktaButton,
	unlockOverflow,
	displayMainEvent,
	addPPATSignButton,
	addSaksiSignButton,
	signPermission,
	addReloadButton,
}
