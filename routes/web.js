var router = require('express').Router();
var authMiddleware = require('../middlewares/auth.middleware');
const makeApponitment = require('../controllers/appointment.controller')
const updateInfo = require('../controllers/patient.controller');
var config = require('../dbConfig');
const sql = require('msnodesqlv8');
const utils = require('../utils/utils')

module.exports = app => {
    router.get('/', (req, res) => {
        res.render('landingPage');
    });

    router.get('/landingPage', (req, res) => {
        res.render('landingPage');
    });

    router.get('/home', authMiddleware.loggedin, (req, res) => {
        const user = req.session.user;
        if (user) {
            res.render('home', { user });
        } else {
            res.redirect('/login');
        }
    });

    router.get('/makeAppointment', authMiddleware.loggedin, (req, res) => {
        const { service, doctor } = req.query
        const currentDate = utils.getCurrentDate();
        console.log(currentDate);
        res.render('makeAppointment', { doctor, service, currentDate });
    })

    router.post('/makeAppointment', (req, res) => {
        makeApponitment.makeApponitment(req, res);
    })

    router.get('/patientAppointment', authMiddleware.loggedin, (req, res) => {
        const { service } = req.query
        sql.query(config, "SELECT * FROM Service", (err, queryRes) => {
            const services = queryRes || [];
            var doctors = [];
            if (service != undefined) {
                sql.query(config, `SELECT * FROM staff ${service ? ` st
                INNER JOIN Service s
                ON st.Specialization_ID = s.Specialization_ID
                WHERE s.Service_ID = ${service}` : ""}`, (err, results) => {
                    doctors = results;
                    res.render('patientAppointment', { doctors, services, service });
                })
            } else {
                res.render('patientAppointment', { doctors, services, service });
            }
        });
    })

    router.get('/updateInfo', (req, res) => {
        res.render('updateInfo.ejs');
    })

    router.post('/updateInfo', (req, res) => {
        updateInfo.updateInfo(req, res);
    })

    router.get('/patientSchedule', authMiddleware.loggedin, (req, res) => {
        sql.query(config, `SELECT a.Date, a.Start_Hour, a.Status, s.Name as Service, t.Name as Doctor
            FROM Appointment a 
            INNER JOIN Patient p ON a.Patient_ID = p.Patient_ID AND p.Patient_ID = ?
            INNER JOIN Service s ON a.Service_ID = s.Service_ID
            INNER JOIN staff t ON t.Staff_ID = a.Staff_ID`,
            [req.session.user.Patient_ID],
            (err, results) => {
                const appointments = results || [];
                appointments.forEach(appointment => {
                    appointment.Date = utils.formatDate(new Date(appointment.Date));
                    appointment.Start_Hour = utils.formatHour(new Date(appointment.Start_Hour))
                });
                res.render('patientSchedule', { appointments });
            })

    })

    router.get('/getRoom', (req, res) => {
        const { Date, Start_Hour } = req.query
        console.log(Date, Start_Hour);
        sql.query(config, `SELECT Room.Room_ID, Room.Name
        FROM Room
        WHERE NOT EXISTS (
            SELECT 1
            FROM Appointment
            WHERE Room.Room_ID = Appointment.Room_ID
            AND Date = ?
            AND Start_Hour = ?
        )`,[Date, Start_Hour] , (err, results) => {
            console.log(results);
            res.send(results)
        })
    })

    app.use(router);
}