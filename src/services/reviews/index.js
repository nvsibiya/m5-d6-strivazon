const express = require("express")
const router = express.Router()
const uniqid = require("uniqid")
const { check, validationResult, sanitizeBody } = require("express-validator")
const { getProducts, getReviews, writeReviews } = require("../../lib")

router.get("/", async (req, res, next) => {
  //get all reviews
  try {
    const reviews = await getReviews()
    console.log(reviews)
    res.send(reviews)
  } catch (error) {
    console.log(error)
    const err = new Error("While getting reviews list a problem occurred!")
    next(err)
  }
})

router.get("/:id", async (req, res, next) => {
  try {
    //get single review
    const reviews = await getReviews()
    const review = reviews.find((rev) => rev._id === req.params.id)
    if (review) {
      res.send(review)
    } else {
      const error = new Error()
      error.httpStatusCode = 404
      next(error)
    }
  } catch (error) {
    console.log(error)
    next("While getting reviews list a problem occurred!")
  }
})

router.post(
  "/",
  [
    check("rate")
      .exists()
      .withMessage("Rate is missing")
      .isNumeric()
      .withMessage("Must be a number"),
    check("comment").exists().withMessage("Comment is missing"),
    check("elementId").exists().withMessage("Product id is missing"),
  ],
  async (req, res, next) => {
    //Is there any product with the given elementId?
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const error = new Error()
      error.httpStatusCode = 400
      error.message = errors
      next(error)
    } else {
      try {
        const products = await getProducts()
        const productExists = products.find(
          (prod) => prod._id === req.body.elementId
        )
        if (productExists) {
          const toAdd = {
            ...req.body,
            createdAt: new Date(),
            updateAt: new Date(),
            _id: uniqid(),
          }
          const reviews = await getReviews()
          reviews.push(toAdd)
          await writeReviews(reviews)
          res.send(toAdd)
        } else {
          const error = new Error("Product id is wrong")
          error.httpStatusCode = 400
          next(error)
        }
      } catch (error) {
        console.log(error)
        next(error)
      }
    }
  }
)

router.delete("/:id", async (req, res, next) => {
  try {
    const reviews = await getReviews()

    const reviewFound = reviews.find((review) => review._id === req.params.id)
    if (!reviewFound) {
      const error = new Error("Review not found")
      error.httpStatusCode = 404
      next(error)
    } else {
      const filteredItems = reviews.filter(
        (review) => review._id !== req.params.id
      )
      await writeReviews(filteredItems)
      res.send("Deleted")
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

router.put("/:id", async (req, res, next) => {
  try {
    //Is there any product with the given elementId?
    const products = await getProducts()

    if (
      req.body.elementId &&
      !products.find((prod) => prod._id === req.body.elementId)
    ) {
      const error = new Error("Product id is wrong")
      error.httpStatusCode = 400
      next(error)
    } else {
      const reviews = await getReviews()
      const review = reviews.find((prod) => prod._id === req.params.id)
      if (review) {
        const position = reviews.indexOf(review)
        const reviewUpdated = { ...review, ...req.body }
        reviews[position] = reviewUpdated
        await writeReviews(reviews)
        res.send(reviewUpdated)
      } else {
        const error = new Error(`Review with id ${req.params.id} not found`)
        error.httpStatusCode = 404
        next(error)
      }
    }
  } catch (error) {
    next(error)
  }
})

module.exports = router
