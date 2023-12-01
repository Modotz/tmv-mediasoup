const listParticipants = document.getElementById("participants-list")
const addParticipants = document.getElementById("add-participants")
let formContainer = document.getElementById("register-meeting-form")
let transactionGlobalId
let transactionGlobalName
let id = 0
addParticipants.addEventListener("click", () => {
	if (!checkTransactionTitle()) return``
	let createParticipantContainer = document.createElement("div")
	createParticipantContainer.id = `pc-${id}`
	createParticipantContainer.className = "participant-container"
	createParticipantContainer.innerHTML = `<input id="p-${id}" style="margin-right: 10px;" type="text" placeholder="Participant Name..." required/><button id="delete-${id}" class="btn btn-danger" type="button">Remove</button>`
	listParticipants.appendChild(createParticipantContainer)
	document.getElementById(`delete-${id}`).addEventListener("click", () => {
		createParticipantContainer.remove()
	})
	id++
})

const checkTransactionTitle = (message = `Please Create Transaction Title First Before Uploading Document!`) => {
	try {
		if (!document.getElementById("registered-transaction")) {
			let ae = document.getElementById("alert-error")
			ae.className = "show"
			ae.innerHTML = message
			// Show Warning
			setTimeout(() => {
				ae.className = ae.className.replace("show", "")
				ae.innerHTML = ``
			}, 3000)
			return false
		} else return true
	} catch (error) {
		console.log(error)
	}
}

formContainer.addEventListener("submit", async (e) => {
	e.preventDefault()
	if (!checkTransactionTitle()) return
	const inputs = document.querySelectorAll('input[id^="p-"]')
	let participants = []
	inputs.forEach((input, index) => {
		// Log the value and ID of each input
		participants.push(input.value)
	})

	const meetingDate = document.getElementById("meeting-date").value

	const data = {
		participants,
		meetingName: transactionGlobalName,
		meetingDate,
		roomId: generateRandomId(12),
		transactionId: transactionGlobalId,
	}

	const api = window.location.origin + "/api/user"
	const response = await fetch(api, {
		method: "get",
		headers: {
			"Content-Type": "application/json",
			access_token: sessionStorage.getItem("access_token"),
		},
	})
	const { email } = await response.json()
	const createParticipant = async ({ email, authority, roomId, transactionId }) => {
		try {
			const createParticipantResponse = await fetch(window.location.origin + "/api/participant", {
				method: "post",
				headers: {
					"Content-Type": "application/json",
					access_token: sessionStorage.getItem("access_token"),
				},
				body: JSON.stringify({ email, authority, roomId, transactionId }),
			})
			if (createParticipantResponse.ok) {
				const participantResponse = await createParticipantResponse.json()
				console.log(participantResponse)
			}
		} catch (error) {
			console.log("- Error Creating Participant : ", error)
		}
	}

	await createParticipant({ email, authority: "PPAT", roomId: data.roomId, transactionId: transactionGlobalId })
	let PPATEmail = email
	participants.forEach(async (email, index) => {
		try {
			await createParticipant({ email, authority: "Saksi", roomId: data.roomId, transactionId: transactionGlobalId })
			if (index == participants.length - 1) {
				data.participants.push(PPATEmail)
				const createRoomResponse = await fetch(window.location.origin + "/api/room", {
					method: "post",
					headers: {
						"Content-Type": "application/json",
						access_token: sessionStorage.getItem("access_token"),
					},
					body: JSON.stringify(data),
				})

				if (createRoomResponse.ok) {
					const roomResponse = await createRoomResponse.json()
					window.location.href = window.location.origin
				}
			}
		} catch (error) {
			console.log("- Error Creating Room : ", error)
		}
	})
})

const generateRandomId = (length, separator = "-", separatorInterval = 4) => {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	let randomId = ""

	for (let i = 0; i < length; i++) {
		if (i > 0 && i % separatorInterval === 0) {
			randomId += separator
		}

		const randomIndex = Math.floor(Math.random() * characters.length)
		randomId += characters.charAt(randomIndex)
	}

	return randomId
}

const templateFilePDFUpload = document.getElementById("template-transaction-pdf-file-upload")
templateFilePDFUpload.addEventListener("submit", async (e) => {
	try {
		e.preventDefault()

		if (!checkTransactionTitle()) return

		const templateFile = document.getElementById("template-pdf")
		const file = templateFile.files[0]
		const formData = new FormData()
		formData.append("pdf", file)

		const response = await fetch(`${window.location.origin}/ajb-file/${transactionGlobalId}`, {
			method: "post",
			headers: {
				"access_token": sessionStorage.getItem("access_token")
			},
			body: formData,
		})

		if (response.ok) {
			console.log(await response.json())
		}
	} catch (error) {
		console.log(error)
	}
})

const transactionTitle = document.getElementById("transaction-form")
transactionTitle.addEventListener("submit", async (event) => {
	try {
		event.preventDefault()
		const transactionName = document.getElementById("transaction-name").value
		if (!transactionName) {
			checkTransactionTitle("Transaction Name Cannot be empty!")
			return
		}
		transactionGlobalName = transactionName
		const registerContainer = document.getElementById("register-meeting-container-id")
		let registeredTransaction = document.createElement("div")
		registeredTransaction.id = "registered-transaction"
		registeredTransaction.innerHTML = `<p id="registered-transaction-name">${transactionName}</p><button id="edit-transaction-name">Edit</button>`
		registerContainer.insertBefore(registeredTransaction, transactionTitle)
		transactionTitle.remove()

		const data = {
			transactionTitle: transactionName,
		}

		const response = await fetch(`${window.location.origin}/api/transaction`, {
			method: "post",
			headers: {
				"Content-Type": "application/json",
				access_token: sessionStorage.getItem("access_token"),
			},
			body: JSON.stringify(data),
		})
		if (response.ok) {
			const { transactionId } = await response.json()
			transactionGlobalId = transactionId
		} else {
			throw await response.json()
		}
	} catch (error) {
		console.log(error)
	}
})
