const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const sequelize = require('./util/database');
const Product = require('./models/product');
const User = require('./models/user');
const Cart = require('./models/cart');
const CartItem = require('./models/cart-item');
const Order = require('./models/order');
const OrderItem = require('./models/order-item');

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const pageNotFoundRoute = require('./controllers/error');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// REMINDER: all 'app.use' are middlewares, they'll be executed
// once the server has been successfully launched.
// So, there will always be one 'dummy' user signed in (see remark *)
// since all the instructions passed in remark * have been launched
// BEFORE launching these middlewares!

app.use((req, res, next) => {
    User.findByPk(1)
        .then(user => {
            req.user = user;
            next();
        })
        .catch(err => console.log(err))
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);

app.use(pageNotFoundRoute.pageNotFound);

// We set the associations between tables here
Product.belongsTo(User, {constraints: true, onDelete: 'CASCADE'});
User.hasMany(Product);
User.hasOne(Cart);
Cart.belongsTo(User);
Cart.belongsToMany(Product, { through: CartItem });
Product.belongsToMany(Cart, { through: CartItem });
Order.belongsTo(User);
User.hasMany(Order);
Order.belongsToMany(Product, { through: OrderItem});
Product.belongsToMany(Order, { through: OrderItem});

// And we synchronize with our database
sequelize
    .sync() // To reset database, type sync({ force: true })
    .then(result => {
        return User.findByPk(1)
    })
    // If no user in 'users' table, we create one! (remark *)
    .then(user => {
        if(!user){
            return User.create({ firstName: 'Mehdi', mail: 'my-mail@gmail.com' })
        }
        return user
    })
    .then(user => {
        app.listen(3000);
    })
    .catch(err => console.log(err))