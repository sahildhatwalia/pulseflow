const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'db.js');
let content = fs.readFileSync(dbPath, 'utf8');

// Replace Provider Names
content = content.replace(/Dr\. Elena Vance, MD/g, 'Dr. Priya Sharma, MD');
content = content.replace(/Dr\. Marcus Sterling, MD/g, 'Dr. Rahul Verma, MD');
content = content.replace(/Sarah Lin, RN, BSN/g, 'Kavita Singh, RN, BSN');
content = content.replace(/Sarah Lin, RN/g, 'Kavita Singh, RN'); // For audit log
content = content.replace(/James Gallagher, RN/g, 'Rajesh Kumar, RN');
content = content.replace(/Robert Chen, PA-C/g, 'Sanjay Gupta, PA-C');
content = content.replace(/Dr\. Chloe Tremblay, MD/g, 'Dr. Neha Desai, MD');
content = content.replace(/Maya Soto, RN, CPN/g, 'Anjali Rao, RN, CPN');
content = content.replace(/Dr\. David King, FACS/g, 'Dr. Vikram Rathore, FACS');

// Replace Patient Names
content = content.replace(/Arthur Pendelton/g, 'Arvind Patel');
content = content.replace(/Linda Pendelton/g, 'Leela Patel');
content = content.replace(/Jonathan Reynolds/g, 'Rohan Sharma');
content = content.replace(/Carol Reynolds/g, 'Kavita Sharma');
content = content.replace(/Maria Santos/g, 'Meera Reddy');
content = content.replace(/Diego Santos/g, 'Dilip Reddy');
content = content.replace(/Kenneth Miller/g, 'Karan Mehta');
content = content.replace(/Sarah Miller/g, 'Sneha Mehta');
content = content.replace(/Evelyn Brooks/g, 'Esha Bansal');
content = content.replace(/Michael Brooks/g, 'Mohan Bansal');
content = content.replace(/Timothy Zhang/g, 'Tarun Joshi');
content = content.replace(/Jessica Zhang/g, 'Jaya Joshi');
content = content.replace(/Gary Foster/g, 'Gaurav Kulkarni');
content = content.replace(/Helen Foster/g, 'Hema Kulkarni');
content = content.replace(/Liam Cooper/g, 'Lakshya Agarwal');
content = content.replace(/Patricia Cooper/g, 'Pooja Agarwal');
content = content.replace(/Hannah Davis/g, 'Harshita Desai');
content = content.replace(/Lucas Henderson/g, 'Lavanya Iyer');
content = content.replace(/Emily Henderson/g, 'Ekta Iyer');
content = content.replace(/Trauma Doe/g, 'Agyaat Vyakti');

// Replace phone numbers (from (555) XXX-XXXX to +91 98XXX XXXXX)
content = content.replace(/\(555\) (\d{3})-(\d{4})/g, '+91 98$1 $2');

fs.writeFileSync(dbPath, content, 'utf8');
console.log('Database seeded with Indian context successfully.');
