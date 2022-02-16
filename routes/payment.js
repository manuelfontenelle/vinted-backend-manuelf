const express = require("express")
const router = express.Router()

const stripe = require("stripe")(process.env.STRIPE_API_SECRET)

router.post("/payment", async (req, res) => {
	try {
		// res.json(req.fields.amount)
		const stripeToken = req.fields.stripeToken
		const response = await stripe.charges.create({
			// amount: req.fields.amount,
			amount: (req.fields.amount * 100).toFixed(0),
			currency: "eur",
			description: `Paiement Vinted pour : ${req.fields.title}`,
			// envoi du token
			source: stripeToken,
		})
		console.log(response)
		// res.json("salut")
		res.json(response)
	} catch (error) {
		console.log(error.message)
		res.status(400).json({ error: error.message })
	}
})
module.exports = router
