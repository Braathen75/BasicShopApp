const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        // 'ref' allows us to set up a relationship
        // between product model and user model
        required: true
    }
});

module.exports = mongoose.model('Product', productSchema);

// WITH MONGODB:

// const getDb = require('../util/database').getDb;
// const ObjectId = require('mongodb').ObjectID;

// class Product {
//     constructor(title, price, description, imageUrl, id, userId) {
//         this.title = title;
//         this.price = price;
//         this.description = description;
//         this.imageUrl = imageUrl;
//         this._id = id ? new ObjectId(id) : null;
//         this.userId = userId;
//     }

//     save() {
//         const db = getDb();
//         let dbOp;
//         if (this._id) {
//             dbOp = db.collection('products')
//                     .updateOne(
//                         {_id: this._id },
//                         { $set: this }                        
//                     )
//         } else {
//             dbOp = db.collection('products').insertOne(this);
//         }
//         return dbOp
//             .then()
//             .catch(err => console.log(err));
//     }

//     static fetchAll() {
//         const db = getDb();
//         return db.collection('products').find().toArray()
//                 .then(products => {
//                     return products;
//                 })
//                 .catch(err => console.log(err));
//     }

//     static findById(id) {
//         const db = getDb();
//         return db.collection('products').find({_id: new ObjectId(id)})
//                     .next()
//                     // 'find' will return a Cursor
//                     // Since we know there will be only one result
//                     // we use 'next' to convert this cursor into the last document found!
//                     .then(product => {
//                         console.log(product);
//                         return product;
//                     })
//                     .catch(err => console.log(err));
//     }

//     static deleteById(id) {
//         const db = getDb();
//         return db.collection('products').deleteOne({_id: new ObjectId(id)})
//                     .then(() => {
//                         console.log('Product deleted!')
//                     })
//                     .catch(err => console.log(err)); 
//     }
// }

// module.exports = Product;