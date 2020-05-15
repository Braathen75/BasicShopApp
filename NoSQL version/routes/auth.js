const express = require('express');
const { check, body } = require('express-validator/check');

const User = require('../models/user');

const authControllers = require('../controllers/auth');

const router = express.Router();

router.get('/login', authControllers.getLogin);

router.post(
    '/login',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid e-mail address'),
        body('password', 'Please enter a valid password (at least 5 alphanumeric characters)')
            .isLength({ min: 5 })
            .isAlphanumeric()
    ],
    authControllers.postLogin);

router.get('/signup', authControllers.getSignup);

router.post(
    '/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid e-mail address')
            .custom((value, { req }) => {
                return User.findOne({email: value})
                        .then(userReturned => {
                            if(userReturned){
                                return Promise.reject('This email has already been registered');
                            }
                        })
            }),
        body('password', 'Please enter a valid password (at least 5 alphanumeric characters)')
            .isLength({ min: 5 })
            .isAlphanumeric(),
        body('confirmPassword')
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('The two passwords have to match');
                };
                return true
            })
    ],
    authControllers.postSignup);

router.post('/logout', authControllers.postLogout);

router.get('/reset-pwd', authControllers.getReset);

router.post('/reset-pwd', authControllers.postReset);

router.get('/reset/:token', authControllers.getNewPwd);

router.post('/new-pwd', authControllers.postNewPwd);

module.exports = router;