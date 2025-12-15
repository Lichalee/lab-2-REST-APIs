const express = require('express');
const app = express();

app.use(express.json());

const PORT = 3000;

// Fake data with birth dates
let students = [
  { id: 1, name: "Ten Lee", birthDate: "1996-02-27" },
  { id: 2, name: "Doyoung", birthDate: "1996-02-01" },
  { id: 3, name: "Jaemin", birthDate: "2000-08-13" },
  { id: 4, name: "Jeno", birthDate: "2000-04-23" },
  { id: 5, name: "Haechan", birthDate: "2000-06-06" },
];

// Helper function to calculate age from birthDate
function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

// GET all students
app.get('/students', (req, res) => {
  // Add age to each student for response
  const studentsWithAge = students.map(student => ({
    ...student,
    age: calculateAge(student.birthDate)
  }));
  
  res.json(studentsWithAge);
});

// GET student by id
app.get('/students/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const student = students.find(s => s.id === id);

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  // Add age to the student object
  const studentWithAge = {
    ...student,
    age: calculateAge(student.birthDate)
  };
  
  res.json(studentWithAge);
});

// POST new student
app.post('/students', (req, res) => {
  // Validate required fields
  if (!req.body.name || !req.body.birthDate) {
    return res.status(400).json({ 
      message: "Name and birthDate are required" 
    });
  }

  // Validate birthDate format (YYYY-MM-DD)
  const birthDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!birthDateRegex.test(req.body.birthDate)) {
    return res.status(400).json({ 
      message: "birthDate must be in YYYY-MM-DD format" 
    });
  }

  // Validate date is valid
  const date = new Date(req.body.birthDate);
  if (isNaN(date.getTime())) {
    return res.status(400).json({ 
      message: "Invalid birthDate" 
    });
  }

  const newStudent = {
    id: students.length + 1,
    name: req.body.name,
    birthDate: req.body.birthDate
  };

  students.push(newStudent);
  
  // Return student with age
  res.status(201).json({
    ...newStudent,
    age: calculateAge(newStudent.birthDate)
  });
});

// PUT update student
app.put('/students/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const student = students.find(s => s.id === id);

  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  // Update only provided fields
  if (req.body.name !== undefined) {
    student.name = req.body.name;
  }
  
  if (req.body.birthDate !== undefined) {
    // Validate birthDate format if provided
    if (req.body.birthDate) {
      const birthDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!birthDateRegex.test(req.body.birthDate)) {
        return res.status(400).json({ 
          message: "birthDate must be in YYYY-MM-DD format" 
        });
      }
      
      const date = new Date(req.body.birthDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ 
          message: "Invalid birthDate" 
        });
      }
    }
    student.birthDate = req.body.birthDate;
  }

  // Return updated student with age
  res.json({
    ...student,
    age: calculateAge(student.birthDate)
  });
});

// DELETE student
app.delete('/students/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = students.findIndex(s => s.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Student not found" });
  }

  const deletedStudent = students[index];
  students.splice(index, 1);
  
  res.json({ 
    message: "Student deleted",
    deletedStudent: {
      ...deletedStudent,
      age: calculateAge(deletedStudent.birthDate)
    }
  });
});

// NEW ENDPOINT: Get students by birth month
app.get('/students/birth-month/:month', (req, res) => {
  const month = parseInt(req.params.month);
  
  if (month < 1 || month > 12) {
    return res.status(400).json({ message: "Month must be between 1 and 12" });
  }

  const studentsInMonth = students
    .filter(student => {
      const birthMonth = new Date(student.birthDate).getMonth() + 1;
      return birthMonth === month;
    })
    .map(student => ({
      ...student,
      age: calculateAge(student.birthDate)
    }));

  res.json({
    month: month,
    count: studentsInMonth.length,
    students: studentsInMonth
  });
});

// NEW ENDPOINT: Get upcoming birthdays (within next 30 days)
app.get('/students/upcoming-birthdays', (req, res) => {
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(today.getDate() + 30);

  const upcomingBirthdays = students
    .filter(student => {
      const birthDate = new Date(student.birthDate);
      const currentYearBirthday = new Date(
        today.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate()
      );
      
      // Handle birthdays that have already passed this year
      if (currentYearBirthday < today) {
        currentYearBirthday.setFullYear(today.getFullYear() + 1);
      }
      
      return currentYearBirthday >= today && currentYearBirthday <= nextMonth;
    })
    .map(student => {
      const birthDate = new Date(student.birthDate);
      const currentYearBirthday = new Date(
        today.getFullYear(),
        birthDate.getMonth(),
        birthDate.getDate()
      );
      
      if (currentYearBirthday < today) {
        currentYearBirthday.setFullYear(today.getFullYear() + 1);
      }
      
      const daysUntilBirthday = Math.ceil(
        (currentYearBirthday - today) / (1000 * 60 * 60 * 24)
      );
      
      return {
        ...student,
        age: calculateAge(student.birthDate),
        nextBirthday: currentYearBirthday.toISOString().split('T')[0],
        daysUntilBirthday: daysUntilBirthday,
        willTurn: calculateAge(student.birthDate) + 1
      };
    })
    .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);

  res.json({
    count: upcomingBirthdays.length,
    students: upcomingBirthdays
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});