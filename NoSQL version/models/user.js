const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetToken: String, // This field is not required, but necessary for password resetting 
    resetTokenExpiration: Date, // (same remark)
    cart: {
        items: [
            {
                productId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Product',
                    // 'ref': sets up a relationship between user model and product model
                    required: true
                },
                quantity: { type: Number, required: true }
            }
        ]
    }
})

userSchema.methods.addToCart = function(product) {
        const cartProductIndex = this.cart.items.findIndex(p => {
            return p.productId.toString() == product._id.toString();
        });
        let newQuantity = 1,
            updatedCartItems = [...this.cart.items];
        if (cartProductIndex >= 0) {
            newQuantity = this.cart.items[cartProductIndex].quantity + 1;
            updatedCartItems[cartProductIndex].quantity = newQuantity;
        } else {
            updatedCartItems.push({
                productId: product._id,
                quantity: newQuantity
            })
        }
        const updatedCart = {items: updatedCartItems};
        this.cart = updatedCart;
        return this.save();     
}

userSchema.methods.deleteItemFromCart = function(prodId) {
        const updatedCartItems = this.cart.items.filter(p => {
             return p.productId.toString() !== prodId.toString();
        });
        this.cart.items = updatedCartItems;
        return this.save();
}

userSchema.methods.addOrder = function() {
        return this.getCart()
        .then(products => {
            const order = {
                items: products,
                user: {
                    _id: new ObjectId(this._id),
                    name: this.name
                }
            };
            return db.collection('orders').insertOne(order);
        })
        .then(result => {
            this.cart = {items: []};
            return db.collection('users').updateOne(
                {_id: new ObjectId(this._id)},
                { $set: 
                    { cart: this.cart } 
                }
                )
        });        
}

userSchema.methods.clearCart = function() {
    this.cart = { items: [] };
    return this.save();
}

module.exports = mongoose.model('User', userSchema);

// WITH MONGODB:

// const getDb = require('../util/database').getDb;
// const ObjectId = require('mongodb').ObjectID;

// class User {
//     constructor(username, email, cart, id) {
//         this.name = username;
//         this.email = email;
//         this.cart = cart || {items: []}; // cart = {items: []}
//         this._id = id;
//     }

//     save() {
//         const db = getDb();
//         return db.collection('users').insertOne(this)
//     }

//     addToCart(product) {
//         if (!this.cart) {
//             this.cart = {items: []}
//         }
//         const cartProductIndex = this.cart.items.findIndex(p => {
//             return p.productId.toString() == product._id.toString();
//         });
//         let newQuantity = 1,
//             updatedCartItems = [...this.cart.items];
//         if (cartProductIndex >= 0) {
//             newQuantity = this.cart.items[cartProductIndex].quantity + 1;
//             updatedCartItems[cartProductIndex].quantity = newQuantity;
//         } else {
//             updatedCartItems.push({
//                 productId: new ObjectId(product._id),
//                 quantity: newQuantity
//             })
//         }
//         const updatedCart = {items: updatedCartItems};
//         const db = getDb();
//         return db.collection('users').updateOne(
//             {_id: new ObjectId(this._id)},
//             { $set: {cart: updatedCart} }
//         ) 
//     }

//     getCart() {
//         const db = getDb();
//         const productIds = this.cart.items.map(item => {
//             return new ObjectId(item.productId);
//         });
//         return db.collection('products').find({
//             _id: { $in: productIds}
//         })
//         .toArray()
//         .then(products => {
//             return products.map(p => {
//                 return {
//                     ...p,
//                     quantity: this.cart.items.find(item => {
//                         return item.productId.toString() === p._id.toString()
//                     }).quantity
//                 };
//             });
//         })
//         .catch(err => console.log(err));
//     }

//     deleteItemFromCart(prodId) {
//         const updatedCartItems = this.cart.items.filter(p => {
//              return p.productId.toString() !== prodId.toString();
//         })
//         const db = getDb();
//         return db.collection('users').updateOne(
//             {_id: new ObjectId(this._id)},
//             { $set: 
//                 { cart: {items: updatedCartItems} } 
//             }
//         )
//     }

//     addOrder() {
//         const db = getDb();
//         return this.getCart()
//         .then(products => {
//             const order = {
//                 items: products,
//                 user: {
//                     _id: new ObjectId(this._id),
//                     name: this.name
//                 }
//             };
//             return db.collection('orders').insertOne(order);
//         })
//         .then(result => {
//             this.cart = {items: []};
//             return db.collection('users').updateOne(
//                 {_id: new ObjectId(this._id)},
//                 { $set: 
//                     { cart: this.cart } 
//                 }
//                 )
//         });        
//     }

//     getOrders() {
//         const db = getDb();
//         return db
//             .collection('orders')
//             .find({
//                 'user._id': new ObjectId(this._id) 
//             })
//             .toArray()
//     }

//     static findById(userId) {
//         const db = getDb();
//         return db.collection('users').findOne({ _id: new ObjectId(userId)})
//     }

// }

// module.exports = User;