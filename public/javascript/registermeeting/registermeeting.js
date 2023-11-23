const listParticipants = document.getElementById("participants-list")
const addParticipants = document.getElementById("add-participants")
let formContainer = document.getElementById("register-meeting-form")
const baseUrl = "https://192.168.18.68:3001/"
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

formContainer.addEventListener("submit", async (e) => {
	e.preventDefault()
	const inputs = document.querySelectorAll('input[id^="p-"]')
	let participants = []
	inputs.forEach((input, index) => {
		// Log the value and ID of each input
		participants.push(input.value)
	})

	const meetingName = document.getElementById("meeting-name").value
	const meetingDate = document.getElementById("meeting-date").value

	const data = {
		participants,
		meetingName,
		meetingDate,
		roomId: generateRandomId(12),
	}

	const api = baseUrl + "api/user"
	const response = await fetch(api, {
		method: "get",
		headers: {
			"Content-Type": "application/json",
			access_token: sessionStorage.getItem("access_token"),
		},
	})
	const { email } = await response.json()
	const createParticipant = async ({ email, authority, roomId }) => {
		try {
			const createParticipantResponse = await fetch(baseUrl + "api/participant", {
				method: "post",
				headers: {
					"Content-Type": "application/json",
					access_token: sessionStorage.getItem("access_token"),
				},
				body: JSON.stringify({ email, authority, roomId }),
			})
			if (createParticipantResponse.ok) {
				const participantResponse = await createParticipantResponse.json()
				console.log(participantResponse)
			}
		} catch (error) {
			console.log("- Error Creating Participant : ", error)
		}
	}

	await createParticipant({ email, authority: "PPAT", roomId: data.roomId })
	let PPATEmail = email
	participants.forEach(async (email, index) => {
		try {
			await createParticipant({ email, authority: "Saksi", roomId: data.roomId })
			if (index == participants.length - 1) {
				data.participants.push(PPATEmail)
				const createRoomResponse = await fetch(baseUrl + "api/room", {
					method: "post",
					headers: {
						"Content-Type": "application/json",
						access_token: sessionStorage.getItem("access_token"),
					},
					body: JSON.stringify(data),
				})

				if (createRoomResponse.ok) {
					const roomResponse = await createRoomResponse.json()
					window.location.href = baseUrl
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
