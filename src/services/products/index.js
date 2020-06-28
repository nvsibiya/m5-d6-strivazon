const express = require("express")
const fs = require("fs-extra")
const path = require("path")
const router = express.Router()
const uniqid = require("uniqid")
const multer = require("multer")
const { check, validationResult, sanitizeBody } = require("express-validator")
const { getProducts, getReviews, writeProducts } = require("../../lib")

router.get("/", async (req, res, next) => {
  //get all products
  try {
    const products = await getProducts()
    if (req.query.category)
      res.send(
        products.filter((product) => product.category === req.query.category)
      )
    else res.send(products)
  } catch (error) {
    console.log(error)
    const err = new Error("While getting products list a problem occurred!")
    next(err)
  }
})

router.get("/:id", async (req, res, next) => {
  try {
    //get single product
    const products = await getProducts()
    const product = products.find((prod) => prod._id === req.params.id)
    if (product) {
      res.send(product)
    } else {
      const error = new Error()
      error.httpStatusCode = 404
      next(error)
    }
  } catch (error) {
    console.log(error)
    next("While getting products list a problem occurred!")
  }
})

router.get("/:id/reviews", async (req, res, next) => {
  try {
    const reviews = await getReviews()
    res.send(reviews.filter((review) => review.elementId === req.params.id))
  } catch (error) {
    console.log(error)
    next("While getting reviews a problem occurred!")
  }
})

router.post(
  "/",
  [
    check("name")
      .isLength({ min: 4 })
      .withMessage("Name should have at least 4 chars"),
    check("category").exists().withMessage("Category is missing"),
    check("description")
      .isLength({ min: 50, max: 1000 })
      .withMessage("Description must be between 50 and 1000 chars"),
    check("price").isNumeric().withMessage("Must be a number"),
    sanitizeBody("price").toFloat(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      console.log(errors)
      const error = new Error()
      error.httpStatusCode = 400
      error.message = errors
      next(error)
    } else {
      try {
        const toAdd = {
          ...req.body,
          createdAt: new Date(),
          updateAt: new Date(),
          _id: uniqid(),
        }
        const products = await getProducts()
        products.push(toAdd)
        await writeProducts(products)
        res.send(toAdd)
      } catch (error) {
        console.log(error)
        next(error)
      }
    }
  }
)

router.delete("/:id", async (req, res, next) => {
  try {
    const products = await getProducts()

    const productFound = products.find(
      (product) => product._id === req.params.id
    )
    if (!productFound) {
      const error = new Error("Product not found")
      error.httpStatusCode = 404
      next(error)
    } else {
      const filteredItems = products.filter(
        (product) => product._id !== req.params.id
      )
      await writeProducts(filteredItems)
      res.send("Deleted")
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

router.put("/:id", async (req, res, next) => {
  try {
    const products = await getProducts()
    const product = products.find((prod) => prod._id === req.params.id)
    if (product) {
      const position = products.indexOf(product)
      const productUpdated = { ...product, ...req.body }
      products[position] = productUpdated
      await writeProducts(products)
      res.send(productUpdated)
    } else {
      const error = new Error(`Product with id ${req.params.id} not found`)
      error.httpStatusCode = 404
      next(error)
    }
  } catch (error) {
    next(error)
  }
})

const multerConfig = multer({})
router.post(
  "/:id/upload",
  multerConfig.single("prodPic"),
  async (req, res, next) => {
    try {
      //we need to check if we have an existing product with the given id
      const products = await getProducts()
      const product = products.find((prod) => prod._id === req.params.id)
      if (product) {
        const fileDest = path.join(
          __dirname,
          "../../images/",
          req.params.id + path.extname(req.file.originalname)
        )
        await fs.writeFile(fileDest, req.file.buffer)
        product.updateAt = new Date()
        product.imageUrl =
          "/images/" + req.params.id + path.extname(req.file.originalname)
        await writeProducts(filePath, products)
        res.send(product)
      } else {
        const error = new Error(`Product with id ${req.params.id} not found`)
        error.httpStatusCode = 404
        next(error)
      }
    } catch (error) {
      next(error)
    }
  }
)

module.exports = router
