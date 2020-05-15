const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator/check');

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}));

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else { message = null }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: message
    })
};

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else { message = null }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: message,
        inputs: {
            email: "",
            password: "",
            confirmPassword: ""
        },
        validationErrors: []
    })
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email,
          password = req.body.password,
          errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422)
                  .render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: errors.array()[0].msg
                })
    }
    User.findOne({email: email})
        .then(user => {
            if(!user){
                req.flash('error', 'Invalid email or password!')
                return res.redirect('/login');
            }
            bcrypt.compare(password, user.password)
                .then(matchingPwds => {
                    if(matchingPwds){
                        req.session.user = user;
                        req.session.loggedIn = true;
                        req.session.save((err) => {
                            if(err) {console.log(err)};
                            res.redirect('/');
                        })    
                    } else {
                        req.flash('error', 'Invalid email or password')
                        res.redirect('/login');
                    }
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/login');
                })
        })
        .catch(err => console.log(err));    
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email,
          password = req.body.password
          errors = validationResult(req);
    // 'validationResult' store all errors collected by the 'check().isEmail()' middleware
    // inserted in 'routes/auth.js', for postSignup route.
    if (!errors.isEmpty()) {
        return res.status(422)
                  .render('auth/signup', {
                        path: '/signup',
                        pageTitle: 'Signup',
                        errorMessage: errors.array()[0].msg,
                        inputs: {
                            email: email,
                            password: password,
                            confirmPassword: req.body.confirmPassword
                        },
                        validationErrors: errors.array()
                    })
    } 
    return bcrypt
        .hash(password, 12)
        .then(hashedPwd => {
            const user = new User({
                email: email,
                password: hashedPwd,
                cart: { items: [] }
            });
            return user.save();
        })
        .then(() => {
            res.redirect('/login');
            // Best practice: redirect before sending email!
            // If waiting for the mail to be sent, the app will be slow... 
            return transporter.sendMail({
                to: email,
                from: 'shop@node.com',
                // ERROR: The from address does not match a verified Sender Identity. 
                // Mail cannot be sent until this error is resolved. 
                // Visit https://sendgrid.com/docs/for-developers/sending-email/sender-identity/
                // to see the Sender Identity requirements
                subject: 'Welcome to my online shop!',
                html: '<h1>Congrats! You successfully signed up.</h1>'
            });
        })
        .catch(err => console.log(err));
}

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        if(err) {console.log(err)};
        res.redirect('/');
    })
};

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else { message = null }
    res.render('auth/reset-pwd', {
        path: '/reset',
        pageTitle: 'Reset password',
        errorMessage: message
    })
}

exports.postReset = (req, res, next) => {
    const email = req.body.email;
    crypto.randomBytes(32, (err, buffer) => {
        if(err){
            console.log(err);
            req.flash('error', 'We are sorry... Your password could not have been reset...')
            return res.redirect('/reset-pwd');
        }
        const token = buffer.toString('hex');
        User.findOne({email: email})
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account found.');
                    return res.redirect('/reset-pwd');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
            .then(user => {
                res.redirect('/login');
                transporter.sendMail({
                    to: email,
                    from: 'shop@node.com',
                    subject: 'Reset password',
                    html: `
                        <h1>You requested a new password</h1>
                        <p>Click <a href="http://localhost:3000/reset/${token}">here</a> to your reset password</p>
                    `
                })
            })
            .catch(err => console.log(err));
    })
}

exports.getNewPwd = (req, res, next) => {
    const token = req.params.token;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
        .then(user => {
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0];
            } else { message = null }
            res.render('auth/new-pwd', {
                path: '/new-pwd',
                pageTitle: 'New password',
                errorMessage: message,
                userId: user._id.toString(),
                pwdToken: token
            })        
        })
        .catch(err => console.log(err))
}

exports.postNewPwd = (req, res, next) => {
    const newPwd = req.body.password,
          userId = req.body.userId,
          pwdToken = req.body.pwdToken;
    User.findOne({
            resetToken: pwdToken,
            resetTokenExpiration: {$gt: Date.now()},
            _id: userId
        })
        .then(user => {
            bcrypt.hash(newPwd, 12)
                .then(hashedPwd => {
                    user.password = hashedPwd;
                    user.resetToken = undefined;
                    user.resetTokenExpiration = undefined;
                    return user.save();
                })
                .catch(err => console.log(err))
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => console.log(err))
}