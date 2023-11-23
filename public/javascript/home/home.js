const joinForm = document.getElementById("join-form")
const url = window.location
const roomTable = document.getElementById("rooms-table")
const roomTableBody = document.getElementById("rooms-table-body")
const baseUrl = "https://192.168.18.68:3001/"

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
		const api = baseUrl + "api/rooms"
		const response = await fetch(api, {
			method: "get",
			headers: {
				"Content-Type": "application/json",
				access_token: sessionStorage.getItem("access_token"),
			},
		})

		const rooms = await response.json()
		if (rooms.length == 0) {
			const roomTitle = document.getElementById("rooms-title")
			roomTitle.innerHTML = "You Dont Have Any Scheduled Meeting"
		} else {
			roomTable.removeAttribute("style")
			rooms.map(async (data, index) => {
				const apiParticipants = baseUrl + "api/participants/" + data.roomId
				const responseParticipants = await fetch(apiParticipants, {
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
						list += `<p>${data.email}      <span id="cp-${data._id}" style="cursor: pointer;">copy</span></p>`
					})
					let rowTable = document.createElement("tr")
					rowTable.innerHTML = `<th>${index + 1}</th><td>${data.name}</td><td><details><summary>List</summary>${list}</details></td>`
					roomTableBody.appendChild(rowTable)
					participants.map((data) => {
						document.getElementById(`cp-${data._id}`).addEventListener("click", () => {
							navigator.clipboard.writeText(`${baseUrl}user/${data._id}`)
						})
					})
				}
			})
		}
	} catch (error) {
		console.log("- Error Getting Rooms : ", error)
	}
}

getRooms()
