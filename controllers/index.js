const { OAuth2Client } = require("google-auth-library")
const path = require("path")
const client = new OAuth2Client()
// const fs = require("fs")
const fs = require("fs").promises
const { PDFDocument, rgb } = require("pdf-lib")

class Controller {
	static room(req, res) {
		try {
			// res.render("home")
			res.render("room")
		} catch (error) {
			console.log(error)
		}
	}

	static home(req, res) {
		try {
			res.render("home")
		} catch (error) {
			console.log(error)
		}
	}

	static lobby(req, res) {
		try {
			res.render("lobby")
		} catch (error) {
			console.log(error)
		}
	}

	static async googleAuth(req, res) {
		try {
			const ticket = await client.verifyIdToken({
				idToken: req.body.credential,
				audience: "623403491943-290gkq7bnqtgeprtfaci3u76vtb39bjl.apps.googleusercontent.com", // Specify the CLIENT_ID of the app that accesses the backend
			})
			const payload = ticket.getPayload()
			res.status(200).json({ name: `${payload.given_name} ${payload.family_name}`, picture: payload.picture })
		} catch (error) {
			console.log(error)
		}
	}

	static async getDocuments(req, res) {
		try {
			const originalPDFPath = path.join(__dirname, "..", "documents", "pdf", "AJB.pdf")
			res.sendFile(originalPDFPath, (err) => {
				if (err) {
					console.error(err)
					res.status(500).send("Internal Server Error")
				}
			})
		} catch (error) {
			console.log(error)
		}
	}

	static async createDocuments(req, res) {
		try {
			const createDirectoryIfNotExists = async (directoryPath) => {
				try {
					await fs.access(directoryPath) // Check if the directory already exists
				} catch (error) {
					if (error.code === "ENOENT") {
						// Directory doesn't exist, create it
						await fs.mkdir(directoryPath, { recursive: true })
						console.log(`Directory created: ${directoryPath}`)
					} else {
						// Other error, propagate it
						throw error
					}
				}
			}
			const originialPDFPath = path.join(__dirname, "..", "documents", "pdf", "AJB.pdf")
			// Read the existing PDF file
			const pdfBytes = await fs.readFile(originialPDFPath)

			const signaturePath = path.join(__dirname, "..", "documents", "signature", "QR-Code.jpg")
			const signatureBytes = await fs.readFile(signaturePath)

			// Load the existing PDF document
			const pdfDoc = await PDFDocument.load(pdfBytes)

			const signatureJpg = await pdfDoc.embedJpg(signatureBytes)

			const pages = pdfDoc.getPages()
			const lastPages = pages[5]
			const { width, height } = lastPages.getSize()

			// Adjust the image dimensions as needed
			// const { width, height } = signatureJpg.scale(1)
			// const textContent = await lastPages.getTextContent();
			// console.log(textContent)

			lastPages.drawImage(signatureJpg, {
				x: width / 2 + 90,
				y: height - 440,
				width: 50,
				height: 50,
			})

			const newPdf = "modified_AJB.pdf"
			const newPdfFilePath = path.join(__dirname, "..", "documents", "pdf", newPdf)
			createDirectoryIfNotExists(newPdfFilePath)
			const modifiedPdf = await pdfDoc.save()
			await fs.writeFile(newPdfFilePath, modifiedPdf)
		} catch (error) {
			console.log(error)
		}
	}
}
module.exports = Controller
