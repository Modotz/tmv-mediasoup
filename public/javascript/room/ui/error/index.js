const alertError = ({ message }) => {
	let ae = document.getElementById("alert-error")
	ae.className = "show"
	ae.innerHTML = message
	// Show Warning
	setTimeout(() => {
		ae.className = ae.className.replace("show", "")
		ae.innerHTML = ``
	}, 3000)
}

module.exports = { alertError }
