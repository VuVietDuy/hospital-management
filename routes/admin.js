const nodemailer = require('nodemailer');
const utils = require('../utils/utils')

module.exports = app => {
  const router = require('express').Router();
  var config = require('../dbConfig');
  const sql = require('msnodesqlv8');
  const authMiddleware = require('../middlewares/auth.middleware.admin')

  router.get('/adminDoctors', authMiddleware.loggedin, async (req, res) => {
    sql.query(config, 'SELECT * FROM staff JOIN specialization ON staff.specialization_id = specialization.specialization_id', (err, results) => {
      const doctors = results;
      doctors.forEach(doctor => {
        router.get(`/adminDoctors/${doctor.Staff_ID}`, authMiddleware.loggedin, (req, res) => {
          const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
          const formattedDate = new Date(doctor.DOB).toLocaleDateString('en-GB', options);
          res.render('adminDoctorIn4', { doctor, formattedDate });
        });
      });
      sql.query(config, 'SELECT COUNT(staff_id) AS staffCount FROM staff', (err, countResult) => {
        const staffCount = countResult[0].staffCount;
        sql.query(config, 'SELECT COUNT(patient_id) AS patientCount FROM Patient', (err, countRes) => {
          const patientCount = countRes[0].patientCount;
          sql.query(config, 'SELECT * FROM Specialization', (err, countResu) => {
            const specializations = countResu;
            res.render('adminDoctors', { doctors, staffCount, patientCount, specializations });
          });
        })
      });
    });
  });

  router.post('/adminDoctors', async (req, res) => {
    const { Name, Phone, Specialization, Salary, Address, DOB, Gender } = req.body;

    if (Name && Specialization) {
      // Insert into staff table
      sql.query(config, 'INSERT INTO staff (Name, Salary, Phone, Address, DOB, Specialization_ID, Gender) VALUES (?, ?, ?, ?, ?, ?, ?)', [Name, Salary, Phone, Address, DOB, Specialization, Gender], (err, result) => {

        // Retrieve the last inserted Staff_ID
        sql.query(config, 'SELECT TOP 1 Staff_ID FROM staff ORDER BY Staff_ID DESC;', (err, result) => {

          const staffID = result[0].Staff_ID;
          console.log(staffID);

          // Construct email and insert into account table
          const formattedName = Name.toLowerCase().replace(/\s+/g, '_');
          const Email = `${formattedName}@gmail.com`;
          sql.query(config, 'INSERT INTO account (Email, Name, Password, Staff_ID, Type_Of_Account) VALUES (?, ?, ?, ?, ?)', [Email, Name, 123456, staffID, 2], (err, result) => {
          });
        });
      });
    }
  });


  router.delete('/adminDoctors', async (req, res) => {
    const { Staff_Id } = req.body;

    // Check if the Staff_Id for removing the doctor is present
    if (Staff_Id) {
      // Remove the doctor from the database using Staff_Id
      sql.query(config, 'DELETE FROM staff WHERE Staff_ID = ?', [Staff_Id], (err, result) => {
        if (err) {
          console.error('Error removing doctor: ', err);
          res.status(500).json({ error: 'Error removing doctor' });
          return;
        }
        // If the deletion was successful, send a success response
        res.status(200).json({ message: 'Doctor removed successfully' });
      });
    } else {
      // If Staff_Id is missing, respond with an error
      res.status(400).json({ error: 'Missing doctor ID' });
    }
  });
  router.post('/adminDoctors/in4', authMiddleware.loggedin, (req, res) => {
    const { doctorId } = req.body;
    let doctor;
    sql.query(config, 'SELECT * FROM staff WHERE Staff_ID = ?', [doctorId], (err, result) => {
      doctor = result;
    });
    res.render('adminDoctorIn4', { doctor });
  });

  router.get('/adminAnalyst', authMiddleware.loggedin, (req, res) => {
    sql.query(config, 'SELECT * FROM staff', (err, results) => {
      const doctors = results;
      sql.query(config, 'SELECT COUNT(staff_id) AS staffCount FROM staff', (err, countResult) => {
        const staffCount = countResult[0].staffCount;
        sql.query(config, 'SELECT COUNT(patient_id) AS patientCount FROM Patient', (err, countRes) => {
          const patientCount = countRes[0].patientCount;
          res.render('adminAnalyst', { doctors, staffCount, patientCount });
        })
      });
    });
  });
  router.get('/adminAppointment', authMiddleware.loggedin, (req, res) => {
    sql.query(config, 'SELECT a.Appointment_ID, a.Date, a.Start_Hour, a.Status, p.Name as Patient, s.Name as Service FROM Appointment a INNER JOIN Patient p ON a.Patient_ID = p.Patient_ID INNER JOIN Service s ON a.Service_ID = s.Service_ID;',
      (err, results) => {
        const appointments = results || [];
        appointments.forEach(appointment => {
          appointment.Date = utils.formatDate(new Date(appointment.Date));
          appointment.Start_Hour = utils.formatHour(new Date(appointment.Start_Hour))
        });
        sql.query(config, 'SELECT * FROM staff', (err, results) => {
          const doctors = results;
          sql.query(config, 'SELECT COUNT(staff_id) AS staffCount FROM staff', (err, countResult) => {
            const staffCount = countResult[0].staffCount;
            sql.query(config, 'SELECT COUNT(patient_id) AS patientCount FROM Patient', (err, countRes) => {
              const patientCount = countRes[0].patientCount;
              res.render('adminAppointment', { appointments, doctors, staffCount, patientCount });
            })
          });
        });
      });
  });
  router.get('/adminPatient', authMiddleware.loggedin, (req, res) => {
    sql.query(config, 'SELECT * FROM patient', (err, results) => {
      const patients = results;
      sql.query(config, 'SELECT COUNT(staff_id) AS staffCount FROM staff', (err, countResult) => {
        const staffCount = countResult[0].staffCount;
        sql.query(config, 'SELECT COUNT(patient_id) AS patientCount FROM Patient', (err, countRes) => {
          const patientCount = countRes[0].patientCount;
          res.render('adminPatient', { patients, staffCount, patientCount });
        })
      });
    });
  });
  router.get('/adminPatient/in4', authMiddleware.loggedin, (req, res) => {
    res.render('adminPatientIn4');
  })

  router.post('/changeAppointmentStatus', (req, res) => {
    console.log(req.body.newStatus, req.body.appointmentId);
    if (req.body.newStatus === "Approved") {
      sql.query(config, 'SELECT * FROM Appointment WHERE Appointment_ID = ?;', [req.body.appointmentId], (err, appointment) => {
        const a = appointment[0];
        sql.query(config, 'SELECT * FROM staff WHERE Staff_ID = ?;', [a.Staff_ID], (err, staff) => {
          console.log(staff[0]);
          const s = staff[0];
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'duyvv.dev@gmail.com',
              pass: 'gync qfms ykvo vkrw',
            },
          });
          
          // Define the email options
          const mailOptions = {
            from: 'duyvv.dev@gmail.com',
            to: s.Email,
            subject: 'Your upcoming appointment',
            text: `You have an appointment on ${utils.formatDate(a.Date)} at ${utils.formatHour(a.Start_Hour)} in room 4`,
          };
          
          // Send the email
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error('Error sending email:', error);
            } else {
              console.log('Email sent:', info.response);
            }
          });
        });
      });
    }
    sql.query(config, 'UPDATE Appointment SET Status = ? WHERE Appointment_ID = ?;', [req.body.newStatus, req.body.appointmentId], (err, results) => {
      res.redirect("/adminAppointment")
    });
  })

  app.use(router);
}