const joinForm = document.getElementById("join-form")
const url = window.location
const roomTable = document.getElementById("rooms-table")
const roomTableBody = document.getElementById("rooms-table-body")

joinForm.addEventListener("submit", (e) => {
	e.preventDefault()
	const roomId = document.getElementById("room-id").value
	const goTo = url + "lobby/" + roomId
	window.location.href = goTo
})

function generateRandomId(length, separator = "-", separatorInterval = 4) {
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

const createMeeting = document.getElementById("create-meeting")
createMeeting.addEventListener("click", () => {
	const goTo = url + "register-meeting"
	window.location.href = goTo
})

const getRooms = async () => {
	try {
		const response = await fetch(`${window.location.origin}/api/rooms`, {
			method: "get",
			headers: {
				"Content-Type": "application/json",
				access_token: sessionStorage.getItem("access_token"),
			},
		})

		const rooms = await response.json()
		const roomTitle = document.getElementById("rooms-title")
		if (rooms.length == 0) {
			roomTitle.innerHTML = "You Dont Have Any Scheduled Meeting"
		} else {
			roomTable.removeAttribute("style")
			roomTitle.innerHTML = "Meeting Schedule"
			rooms.map(async (data, index) => {
				const responseParticipants = await fetch(`${window.location.origin}/api/participants/${data.roomId}`, {
					method: "get",
					headers: {
						"Content-Type": "application/json",
						access_token: sessionStorage.getItem("access_token"),
					},
				})
				if (responseParticipants.ok) {
					const participants = await responseParticipants.json()
					let list = ""
					participants.map((data) => {
						list += `<div class="participants-list"><span>${data.email}</span><button id="cp-${data._id}" class="btn btn-link" style="cursor: pointer;">copy</button></div>`
					})
					let rowTable = document.createElement("tr")
					rowTable.innerHTML = `<th>${index + 1}</th><td>${
						data.name
					}</td><td><details><summary>List</summary>${list}</details></td><td><button class="btn btn-primary" id="detail-${
						data._id
					}">Detail</button></td>`
					roomTableBody.appendChild(rowTable)
					participants.map((data) => {
						document.getElementById(`cp-${data._id}`).addEventListener("click", () => {
							navigator.clipboard.writeText(`${window.location.origin}/user/${data._id}`)
						})
					})
					document.getElementById(`detail-${data._id}`).addEventListener("click", () => {
						window.location.href = `${window.location.origin}/detail/${data._id}`
					})
				}
			})
		}
	} catch (error) {
		console.log("- Error Getting Rooms : ", error)
	}
}

getRooms()
