const Swal = require("sweetalert2")

const startTimer = () => {
	try {
		let startTime = Date.now()
		let timerElement = document.getElementById("realtime-timer")

		// Update the timer every second
		let intervalId = setInterval(function () {
			let currentTime = Date.now()
			let elapsedTime = currentTime - startTime
			let hours = Math.floor(elapsedTime / 3600000)
			let minutes = Math.floor((elapsedTime % 3600000) / 60000)
			let seconds = Math.floor((elapsedTime % 60000) / 1000)

			timerElement.textContent =
				(hours < 10 ? "0" : "") + hours + ":" + (minutes < 10 ? "0" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds
		}, 1000)
	} catch (error) {
		console.log("- Error Starting Recording Timer : ", error)
	}
}

const timerLayout = ({ status }) => {
	try {
		const fullContainer = document.getElementById("full-container")
		if (status) {
			let container = document.createElement("div")
			container.setAttribute("class", "record-timer")
			container.id = "timer"
			let timerParagraph = document.createElement("span")
			let span = document.createElement("span")
			span.id = "realtime-timer"
			span.textContent = "00:00:00"
			timerParagraph.appendChild(span)
			container.appendChild(timerParagraph)
			fullContainer.appendChild(container)
			startTimer()
		} else {
			let timerElement = document.getElementById("timer")
			if (timerElement) timerElement.remove()
			let recordButton = document.getElementById("user-record-button")
			recordButton.className = "btn btn-secondary"
			recordButton.firstChild.innerHTML = "Start"
		}
	} catch (error) {
		console.log("- Error At Timer Layout : ", error)
	}
}

const muteAllParticipants = ({ parameter, socket }) => {
	parameter.allUsers.forEach((data) => {
		if (data.socketId != socket.id) {
			socket.emit("mute-all", { socketId: data.socketId })
		}
	})
}

const updateDocuments = async ({ parameter, socket }) => {
	try {
		await getPdf({ parameter, pdfDocument: "aktaDocument" })
		parameter.allUsers.forEach((data) => {
			if (data.socketId != socket.id) {
				socket.emit("update-document", { socketId: data.socketId })
			}
		})
	} catch (error) {
		console.log(error)
	}
}

const unlockAllMic = ({ parameter, socket }) => {
	parameter.allUsers.forEach((data) => {
		if (data.socketId != socket.id) {
			socket.emit("unmute-all", { socketId: data.socketId })
		}
	})
}

const goToLobby = () => {
	try {
		const url = window.location.pathname
		const parts = url.split("/")
		const roomName = parts[2]
		const goTo = "lobby/" + roomName
		const newURL = window.location.origin + "/" + goTo
		// If There Is Not, It Will Redirect To Lobby
		window.location.href = newURL
	} catch (error) {
		console.log("- Error Go To Lobby : ", error)
	}
}

const goHome = () => {
	try {
		const newURL = window.location.origin
		window.location.href = newURL
	} catch (error) {
		console.log("- Error Go To Lobby : ", error)
	}
}

const changeAppData = ({ socket, data, remoteProducerId }) => {
	socket.emit("change-app-data", { data, remoteProducerId })
}

const renderPage = ({ parameter, num, pdfDocument }) => {
	try {
		parameter.pdfDocuments[pdfDocument].pageRendering = true
		parameter.pdfDocuments[pdfDocument].doc.getPage(num).then((page) => {
			let viewport = page.getViewport({ scale: parameter.pdfDocuments[pdfDocument].scale, rotation: 0 })
			parameter.pdfDocuments[pdfDocument].canvas.height = viewport.height
			parameter.pdfDocuments[pdfDocument].canvas.width = viewport.width
			parameter.pdfDocuments[pdfDocument].ctx.clearRect(
				0,
				0,
				parameter.pdfDocuments[pdfDocument].canvas.width,
				parameter.pdfDocuments[pdfDocument].canvas.height
			)
			let renderContext = {
				canvasContext: parameter.pdfDocuments[pdfDocument].ctx,
				viewport,
			}
			let renderTask = page.render(renderContext)
			renderTask.promise.then(() => {
				parameter.pdfDocuments[pdfDocument].pageRendering = false
				if (parameter.pdfDocuments[pdfDocument].pageNumPending !== null) {
					renderPage({ parameter, num: parameter.pdfDocuments[pdfDocument].pageNumPending, pdfDocument })
					parameter.pdfDocuments[pdfDocument].pageNumPending = null
				}
			})
			document.getElementById("current-page").textContent = num
			parameter.pdfDocuments[pdfDocument].currentPage = num
		})
	} catch (error) {
		console.log("- Error Rendering Page : ", error)
	}
}

const queueRenderPage = ({ parameter, num, pdfDocument }) => {
	if (parameter.pdfDocuments[pdfDocument].pageRendering) {
		parameter.pdfDocuments[pdfDocument].pageNumPending = num
	} else {
		renderPage({ parameter, num, pdfDocument })
	}
}

const getPdf = ({ parameter, pdfDocument }) => {
	try {
		if (!sessionStorage.getItem("user_token")) {
			window.location.href = window.location.origin + "/verify/" + parameter.userData._id
		}
		let url = `${window.location.origin}/documents/${parameter.userData.transactionId}`
		let pdfContainer = document.getElementById("pdf-container")
		let isExist = document.getElementById("pdf-canvas")
		if (isExist) isExist.remove()
		let pdfCanvas = document.createElement("canvas")
		pdfCanvas.id = "pdf-canvas"
		pdfContainer.appendChild(pdfCanvas)
		parameter.pdfDocuments[pdfDocument].canvas = pdfCanvas
		parameter.pdfDocuments[pdfDocument].ctx = parameter.pdfDocuments[pdfDocument].canvas.getContext("2d")
		parameter.pdfDocuments[pdfDocument].ctx.clearRect(
			0,
			0,
			parameter.pdfDocuments[pdfDocument].canvas.width,
			parameter.pdfDocuments[pdfDocument].canvas.height
		)

		fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				user_token: sessionStorage.getItem("user_token"),
			},
		})
			.then((res) => {
				if (res.ok) {
					return res.arrayBuffer()
				} else {
					return res.json()
				}
			})
			.then((data) => {
				if (data?.name == "JsonWebTokenError") {
					throw data
				}
				window.pdfjsLib.getDocument(data).promise.then((pdf) => {
					if (parameter.pdfDocuments[pdfDocument].doc) {
						parameter.pdfDocuments[pdfDocument].doc.destroy()
					}
					parameter.pdfDocuments[pdfDocument].doc = pdf
					document.getElementById("total-page").textContent = pdf.numPages
					parameter.pdfDocuments[pdfDocument].numPages = pdf.numPages
					renderPage({ parameter, num: parameter.pdfDocuments[pdfDocument].currentPage, pdfDocument })
				})
			})
			.catch((error) => {
				if (error?.name == "JsonWebTokenError") {
					window.location.href = window.location.origin + "/verify/" + parameter.userData._id
				} else {
					errorHandling({
						type: "intermediate",
						error: `- Error When Fetching PDF : ${error}`,
						message: `Something wrong when fetching PDF!`,
						title: "Error!",
					})
				}
			})
	} catch (error) {
		errorHandling({
			type: "intermediate",
			error: `- Error When Fetching PDF : ${error}`,
			message: `Something wrong when fetching PDF!`,
			title: "Error!",
		})
	}
}

const firstPdfControl = async ({ parameter, socket, pdfDocument }) => {
	try {
		let pdfContainer = document.getElementById("pdf-container")
		let nextButton = document.getElementById("next-page")
		let prevButton = document.getElementById("prev-page")
		nextButton.className = "btn btn-info m-2"
		prevButton.className = "btn btn-info m-2"

		nextButton.addEventListener("click", () => {
			if (parameter.pdfDocuments[pdfDocument].currentPage >= parameter.pdfDocuments[pdfDocument].doc.numPages) {
				return
			}
			parameter.pdfDocuments[pdfDocument].currentPage++
			parameter.allUsers.forEach((data) => {
				if (data.socketId != socket.id) {
					socket.emit("change-page", { socketId: data.socketId, currentPage: parameter.pdfDocuments[pdfDocument].currentPage, pdfDocument })
				}
			})
			queueRenderPage({ parameter, num: parameter.pdfDocuments[pdfDocument].currentPage, pdfDocument })
		})
		prevButton.addEventListener("click", () => {
			if (parameter.pdfDocuments[pdfDocument].currentPage <= 1) {
				return
			}
			parameter.pdfDocuments[pdfDocument].currentPage--
			parameter.allUsers.forEach((data) => {
				if (data.socketId != socket.id) {
					socket.emit("change-page", { socketId: data.socketId, currentPage: parameter.pdfDocuments[pdfDocument].currentPage, pdfDocument })
				}
			})
			queueRenderPage({ parameter, num: parameter.pdfDocuments[pdfDocument].currentPage, pdfDocument })
		})

		pdfContainer.addEventListener("scroll", () => {
			let pdfContainer = document.getElementById("pdf-container")
			clearTimeout(parameter.scrollTimer)
			parameter.scrollTimer = setTimeout(function () {
				let totalScroll = pdfContainer.scrollHeight - pdfContainer.clientHeight
				let scrolled = Math.floor((pdfContainer.scrollTop / Math.floor(totalScroll)) * 100)
				console.log(scrolled)
				parameter.allUsers.forEach((data) => {
					if (data.socketId != socket.id) {
						socket.emit("change-scroll", { socketId: data.socketId, value: scrolled, type: "transaksi" })
					}
				})
			}, 500)
		})
	} catch (error) {
		errorHandling({
			type: "intermediate",
			error: `- Error Getting PDF Controller Feature For PPAT : ${error}`,
			message: `Something wrong when getting PDF controller feature for PPAT!`,
			title: "Error!",
		})
	}
}

const addPdfController = async () => {
	try {
		let pdfController = document.getElementById("pdf-controller")
		let pdfContainer = document.getElementById("pdf-container")
		let nextButton = document.createElement("button")
		nextButton.innerHTML = "Next"
		nextButton.id = "next-page"
		let prevButton = document.createElement("button")
		prevButton.innerHTML = "Prev"
		prevButton.id = "prev-page"
		pdfController.insertBefore(prevButton, pdfController.firstChild)
		pdfController.append(nextButton)
		pdfContainer.className = "unlock-scroll"
	} catch (error) {
		errorHandling({
			type: "intermediate",
			error: `- Error When Adding PDF Control Button : ${error}`,
			message: `Something wrong when when adding PDF control button!`,
			title: "Error!",
		})
	}
}

const resetButton = () => {
	try {
		let nextButton = document.getElementById("next-page")
		let prevButton = document.getElementById("prev-page")
		let clonedNextButton = nextButton.cloneNode(true)
		let clonedPrevButton = prevButton.cloneNode(true)
		nextButton.remove()
		prevButton.remove()
	} catch (error) {
		console.log("- Error Reset Button : ", error)
	}
}

const signDocument = async ({ parameter, socket, data }) => {
	try {
		let response = await fetch(`${window.location.origin}/documents`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				user_token: sessionStorage.getItem("user_token"),
			},
			body: JSON.stringify(data),
		})

		if (response.ok) {
			getPdf({ parameter, pdfDocument: "aktaDocument" })
		} else {
			console.error("File upload failed")
		}
	} catch (error) {
		console.log("- Error Signing Document : ", error)
	}
}

const addTataTertibTemplate = async ({ templateTataTertib }) => {
	try {
		document.getElementById("template-room").innerHTML = templateTataTertib
	} catch (error) {
		errorHandling({
			type: "intermediate",
			error: `- Error When Fetching Tata Tertib Template: ${error}`,
			message: `Something wrong when fetching tata tertib template!`,
			title: "Error!",
		})
	}
}

const raiseAndUnraiseHand = ({ parameter, socket, status }) => {
	try {
		parameter.allUsers.forEach((data) => {
			if (data.socketId != socket.id) {
				socket.emit("raise-hand", { socketId: data.socketId, status, username: parameter.username })
			}
		})
	} catch (error) {
		console.log(error)
	}
}

const createUserList = async ({ username, id, micStatus, parameter, socket }) => {
	try {
		let kickIcon = ""
		if (parameter.isHost) {
			kickIcon = `
				<div class="kick-icon">
					<i class="fas fa-times-circle fa-lg" style="color: #ff0000;" id="kick-icon-${id}"></i>
				</div>`
		}
		const usersListContainer = document.getElementById("users-list-container")
		const newUser = document.createElement("div")
		newUser.id = `user-list-${id}`
		newUser.className = "user-list"
		newUser.innerHTML = `
				<section class="user-list-left-section">
					<img src="/assets/pictures/unknown.jpg" class="user-list-picture" alt="user-list-picture">
					<span class="user-list-username">${username}</span>
				</section>
				<section class="user-list-right-section" id="user-list-right-section-${id}">
					<div class="user-list-mic-icon">
						<i class="fas ${micStatus ? "fa-microphone" : "fa-microphone-slash"}" style="color: #ffffff;" id="user-list-mic-icon-${id}"></i>
					</div>
					${parameter.isHost && parameter.socketId != id ? kickIcon: ""}
				</section>`
		usersListContainer.insertBefore(newUser, usersListContainer.firstChild)
		if (parameter.isHost && document.getElementById(`kick-icon-${id}`)) {
			document.getElementById(`kick-icon-${id}`).addEventListener("click", () => {
				socket.emit("kick-user", { socketId: id })
			})
		}
		// usersListContainer.appendChild(newUser)
	} catch (error) {
		errorHandling({
			type: "intermediate",
			error: `- Error When Creating User List : ${error}`,
			message: `Something wrong when creating user list!`,
			title: "Error!",
		})
	}
}

const removeUserList = async ({ id }) => {
	try {
		document.getElementById(`user-list-${id}`).remove()
	} catch (error) {
		console.log("- Error Removing User List : ", error)
	}
}

const editUserListRaiseHand = async ({ id, action }) => {
	try {
		const checkIfExist = document.getElementById(`user-list-${id}`)
		if (checkIfExist) {
			const userListRightSection = document.getElementById(`user-list-right-section-${id}`)
			if (action === "raise") {
				let raiseHandContainer = document.createElement("div")
				raiseHandContainer.id = `user-list-raise-hand-${id}`
				raiseHandContainer.innerHTML = `<i class="fas fa-hand-paper" style="color: #ffc400;" id="display-users-icons"></i>`
				userListRightSection.insertBefore(raiseHandContainer, userListRightSection.firstChild)
			} else {
				document.getElementById(`user-list-raise-hand-${id}`).remove()
			}
		} else {
			// Check again with 500ms with 20x attempt
			let attempts = 20
			const interval = setInterval(() => {
				const checkIfExistAgain = document.getElementById(`user-list-${id}`)
				if (checkIfExistAgain || attempts <= 0) {
					clearInterval(interval)
					editUserListRaiseHand({ id, action })
				}
				attempts--
			}, 500)
		}
	} catch (error) {
		console.log("- Error Editing Raise Hand In User List : ", error)
	}
}

const newUserCheckOnRaiseHand = ({ id, socket, username }) => {
	const raiseHandButton = document.getElementById("raise-hand-button")
	if (raiseHandButton.hasAttribute("style")) {
		socket.emit("raise-hand", { socketId: id, status: "raise", username })
	}
}

const showWarningError = ({ message, title }) => {
	Swal.fire({
		icon: "error",
		title: title,
		text: message,
	})
}

const errorHandling = ({ type, error, message, title = "Something went wrong!" }) => {
	switch (type) {
		case "major":
			console.log(error)
			showWarningError({ message, title })
			setTimeout(() => {
				window.location.reload()
			}, 5000)
			break
		case "intermediate":
			console.log(error)
			showWarningError({ message, title })
			break
		case "minor":
			console.log(error)
			break
		default:
			console.log(error)
			showWarningError({ message: "Unknown Error", title })
			break
	}
}

module.exports = {
	addPdfController,
	startTimer,
	timerLayout,
	muteAllParticipants,
	unlockAllMic,
	changeAppData,
	goToLobby,
	getPdf,
	renderPage,
	firstPdfControl,
	resetButton,
	goHome,
	signDocument,
	updateDocuments,
	addTataTertibTemplate,
	raiseAndUnraiseHand,
	createUserList,
	removeUserList,
	editUserListRaiseHand,
	newUserCheckOnRaiseHand,
	queueRenderPage,
	showWarningError,
	errorHandling,
}
