const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', (req, res) => {
  // find all products
  // be sure to include its associated Category and Tag data
  Product.findAll({
    attributes: ["id", "product_name","price","stock","category_id"],
    include: [{
     model: Category, 
     attributes:['id','category_name'] 
     },{
      model: Tag, 
      attributes:['id','tag_name'] 
      }
    ]
    })
    .then(productData => res.json(productData))
    .catch (err =>  {
      console.log(err);
      res.status(500).json(err);
  });
});

// get one product
router.get('/:id', (req, res) => {
  // find a single product by its `id`
  // be sure to include its associated Category and Tag data
  Product.findOne({
    where: {
      id: req.params.id
    },
    attributes: ["id", "product_name","price","stock","category_id"],
    include: [{
      model: Category, 
      attributes:['id','category_name'] 
      },{
       model: Tag, 
       attributes:['id','tag_name'] 
       }
     ]
    })
    .then(productData =>{ 
      if(!productData){
        res.status(404).json({ message: 'No category found with this id' });
                return;
      }
      res.json(productData);
    })
    .catch (err =>  {
      console.log(err);
      res.status(500).json(err);
  });
});

// create new product
router.post('/', (req, res) => {
  /* req.body should look like this...
    {
      product_name: "Basketball",
      price: 200.00,
      stock: 3,
      tagIds: [1, 2, 3, 4]
    }
  */
  Product.create(req.body)
    .then((product) => {
      if (req.body.tagIds.length) {
        const prodTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(prodTagIdArr);
      }
      res.status(200).json(product);
    })
    .then((prodTagIds) => res.status(200).json(prodTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// update product
router.put('/:id', (req, res) => {
  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((Product) => {
      return ProductTag.findAll({ 
        where: { product_id: req.params.id } 
      });
    })
    .then((productTags) => {
      const productTagIds = productTags.map(({ tag_id }) => tag_id);
      const newProductTags = req.body.tagIds
        .filter((tag_id) => !productTagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });
     
      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      return Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ]);
    })
    .then((updatedProductTags) => res.json(updatedProductTags))
    .catch((err) => {
      res.status(400).json(err);
    });
});

router.delete('/:id', (req, res) => {
  // delete one product by its `id` value
  Product.destroy({
    where: {
      id: req.params.id
    }
  })
  .then(productData => {
    if (!productData) {
      res.status(404).json({ message: 'No Product found with this id' });
      return;
    }
    res.json(productData);
  })
  .catch(err => {
    console.log(err);
    res.status(500).json(err);
  });
});

module.exports = router;