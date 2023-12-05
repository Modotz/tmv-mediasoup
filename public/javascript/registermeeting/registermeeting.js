const listParticipants = document.getElementById("participants-list")
const addParticipants = document.getElementById("add-participants")
const transactionName = document.getElementById("transaction-name")
const meetingDate = document.getElementById("meeting-date")
let formContainer = document.getElementById("register-meeting-form")
let transactionGlobalId
let transactionGlobalName
let id = 0
addParticipants.addEventListener("click", () => {
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
	const inputs = document.querySelectorAll('input[id^="p-"]')
	let participants = []
	inputs.forEach((input, index) => {
		participants.push(input.value)
	})

	const data = {
		participants,
		meetingName: transactionName.value,
		meetingDate: meetingDate.value,
		roomId: generateRandomId(12),
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
		console.log(await response.json())
		window.location.href = window.location.origin
	}
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