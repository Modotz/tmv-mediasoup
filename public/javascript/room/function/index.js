const pdfLib = require("pdf-lib")
// let url = "https://modotz.net/documents" /`/ VPS Mr. Indra IP
// let url = "https://meet.dikyardiyanto.site/documents" // My VPS
// let url = 'https://192.168.3.135' // IP Kost
// let url = "https://192.168.3.208"

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
					renderPage({ parameter, num: parameter.pdfDocuments[pdfDocument].pageNumPending })
				}
			})
			document.getElementById("current-page").textContent = num
			parameter.pdfDocuments[pdfDocument].currentPage = num
		})
	} catch (error) {
		console.log("- Error Rendering Page : ", error)
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
		// pdfCanvas.style.width = `100%`
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
					// window.location.href = window.location.origin + "/verify/" + parameter.userData.id
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
				console.log("- Error Getting PDF : ", error)
				if (error?.name == "JsonWebTokenError") {
					window.location.href = window.location.origin + "/verify/" + parameter.userData._id
				}
			})
	} catch (error) {
		console.log("- Error Getting PDF : ", error)
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
			renderPage({ parameter, num: parameter.pdfDocuments[pdfDocument].currentPage, pdfDocument })
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
			renderPage({ parameter, num: parameter.pdfDocuments[pdfDocument].currentPage, pdfDocument })
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
		console.log("- Error Controlling First PDF : ", error)
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
		console.log("- Error Document First Control : ", error)
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
		// const pdf = new window.jspdf.jsPDF()
		// await pdf.html(templateTataTertib, {
		// 	callback: function (pdf) {
		// 		const dataUri = pdf.output("datauristring");

		//         // Create a new <embed> element
		//         const newEmbedElement = document.createElement("iframe");
		// 		newEmbedElement.style.width = "100%"
		// 		newEmbedElement.style.height = "100%"

		//         // Set the data URI as the source of the <embed> element
		//         newEmbedElement.src = dataUri;

		//         // Append the <embed> element to the target container (tata-tertib)
		//         document.getElementById("tata-tertib").appendChild(newEmbedElement);
		// 	},
		// })
	} catch (error) {
		console.log(error)
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
}
