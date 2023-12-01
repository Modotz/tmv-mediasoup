const { v4: uuidv4 } = require("uuid")

const generateCurrentDateTime = () => {
	const now = new Date()
	const year = now.getFullYear().toString()
	const month = (now.getMonth() + 1).toString().padStart(2, "0") // Months are zero-indexed
	const day = now.getDate().toString().padStart(2, "0")
	const hours = now.getHours().toString().padStart(2, "0")
	const minutes = now.getMinutes().toString().padStart(2, "0")
	const seconds = now.getSeconds().toString().padStart(2, "0")
	return `${year}${month}${day}${hours}${minutes}${seconds}`
}

const shuffleString = (str) => {
	const array = str.split("")
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[array[i], array[j]] = [array[j], array[i]]
	}
	return array.join("")
}

const getUniqueId = () => {
	return uuidv4()
}

// const getUniqueId = () => {
// 	const currentDateTime = generateCurrentDateTime()
// 	const randomUUID = uuidv4()

// 	// Combine UUID and timestamp with timestamp in the middle
// 	const id = `${randomUUID.slice(0, 18)}${currentDateTime}${randomUUID.slice(18)}`

// 	// const newId = shuffleString(id);
// 	// return newId;
// 	return id
// }

module.exports = {
	getUniqueId,
}
