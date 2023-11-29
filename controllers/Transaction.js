const Transaction = require("../schema/Transaction")

class Transactions {
	static async createTransaction(req, res, next) {
		try {
			const { transactionTitle } = req.body
			if (!transactionTitle) {
				throw { name: "Bad Request", message: "Transaction Name Is Required" }
			}
			const transaction = await Transaction.create({ name: transactionTitle, PPAT: req.user.id })
			await res.status(201).json({ transactionId: transaction._id })
		} catch (error) {
			next(error)
		}
	}
}

module.exports = { Transactions }
