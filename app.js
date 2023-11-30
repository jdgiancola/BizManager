require('dotenv').config()
const inquirer = require('inquirer');
const mysql = require('mysql2/promise');
const db = require('./db');

// Function to display the main menu
function mainMenu() {
    inquirer
      .prompt([
        {
          type: 'list',
          name: 'menuChoice',
          message: 'Select an option:',
          choices: mainMenuChoices,
        },
      ])
      .then((answers) => {
        switch (answers.menuChoice) {
          case 'View all departments':
            viewAllDepartments();
            break;
          case 'View all roles':
            viewAllRoles();
            break;
          case 'View all employees':
            viewAllEmployees();
            break;
          case 'Add a department':
            addDepartment();
            break;
          case 'Add a role':
            addRole();
            break;
          case 'Add an employee':
            addEmployee();
            break;
          case 'Update an employee role':
            updateEmployeeRole();
            break;
          case 'Update employee manager':
            updateEmployeeManager();
            break;
          case 'View employees by manager':
            viewEmployeesByManager();
            break;
          case 'View employees by department':
            viewEmployeesByDepartment();
            break;
          case 'View department budget':
            viewDepartmentBudget();
            break;
          case 'Delete a department':
            deleteDepartment();
            break;
          case 'Delete a role':
            deleteRole();
            break;
          case 'Delete an employee':
            deleteEmployee();
            break;
          case 'Exit':
            console.log('Goodbye!');
            process.exit();
            break;
          default:
            console.log('Invalid choice. Please try again.');
            mainMenu();
            break;
        }
      });
  }
  


// Function to view all departments
async function viewAllDepartments() {
  try {
    // Use db to query the database
    const [rows] = await db.query('SELECT * FROM department');
    console.table(rows);
    mainMenu();
  } catch (error) {
    console.error('Error viewing departments:', error);
    mainMenu();
  }
}


// Function to view all roles
async function viewAllRoles() {
  try {
    const [rows] = await db.query(
      'SELECT role.id, title, salary, department.name AS department FROM role JOIN department ON role.department_id = department.id'
    );
    console.table(rows);
    mainMenu();
  } catch (error) {
    console.error('Error viewing roles:', error);
    mainMenu();
  }
}

async function viewAllEmployees() {
  try {
    const [rows] = await db.query(
      'SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(manager.first_name, " ", manager.last_name) AS manager FROM employee LEFT JOIN role ON employee.role_id = role.id LEFT JOIN department ON role.department_id = department.id LEFT JOIN employee AS manager ON employee.manager_id = manager.id'
    );
    console.table(rows);
  } catch (error) {
    console.error('Error viewing employees:', error);
  }
  mainMenu();
}


// Function to add a department
async function addDepartment() {
  const departmentName = await inquirer.prompt({
    type: 'input',
    name: 'name',
    message: 'Enter the name of the new department:',
  });

  try {
    await db.query('INSERT INTO department (name) VALUES (?)', [departmentName.name]);
    console.log(`Department "${departmentName.name}" added successfully.`);
    mainMenu();
  } catch (error) {
    console.error('Error adding department:', error);
    mainMenu();
  }
}

// Function to add a role
async function addRole() {
  const departments = await db.query('SELECT * FROM department');

  const roleInfo = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: 'Enter the title of the new role:',
    },
    {
      type: 'input',
      name: 'salary',
      message: 'Enter the salary for the new role:',
    },
    {
      type: 'list',
      name: 'department_id',
      message: 'Select the department for the new role:',
      choices: departments[0].map((department) => ({
        name: department.name,
        value: department.id,
      })),
    },
  ]);

  try {
    await db.query('INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)', [
      roleInfo.title,
      roleInfo.salary,
      roleInfo.department_id,
    ]);
    console.log(`Role "${roleInfo.title}" added successfully.`);
    mainMenu();
  } catch (error) {
    console.error('Error adding role:', error);
    mainMenu();
  }
}

// Function to add an employee
// Function to add an employee
async function addEmployee() {
  const roles = await db.query('SELECT * FROM role');
  const employees = await db.query('SELECT * FROM employee');

  const employeeInfo = await inquirer.prompt([
    {
      type: 'input',
      name: 'first_name',
      message: 'Enter the first name of the new employee:',
    },
    {
      type: 'input',
      name: 'last_name',
      message: 'Enter the last name of the new employee:',
    },
    {
      type: 'list',
      name: 'role_id',
      message: 'Select the role for the new employee:',
      choices: roles[0].map((role) => ({
        name: role.title,
        value: role.id,
      })),
    },
    {
      type: 'list',
      name: 'manager_id',
      message: 'Select the manager for the new employee:',
      choices: [
        { name: 'None', value: null },
        ...employees[0].map((employee) => ({
          name: `${employee.first_name} ${employee.last_name}`,
          value: employee.id,
        })),
      ],
    },
  ]);

  const managerId = employeeInfo.manager_id === null ? null : employeeInfo.manager_id;

  try {
    await db.query(
      'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)',
      [employeeInfo.first_name, employeeInfo.last_name, employeeInfo.role_id, managerId]
    );
    console.log(`Employee "${employeeInfo.first_name} ${employeeInfo.last_name}" added successfully.`);
  } catch (error) {
    console.error('Error adding employee:', error);
  }
  mainMenu();
}


// Function to update an employee role
async function updateEmployeeRole() {
  const employees = await db.query('SELECT * FROM employee');
  const roles = await db.query('SELECT * FROM role');

  const employeeToUpdate = await inquirer.prompt({
    type: 'list',
    name: 'id',
    message: 'Select the employee to update:',
    choices: employees[0].map((employee) => ({
      name: `${employee.first_name} ${employee.last_name}`,
      value: employee.id,
    })),
  });

  const newRole = await inquirer.prompt({
    type: 'list',
    name: 'role_id',
    message: 'Select the new role for the employee:',
    choices: roles[0].map((role) => ({
      name: role.title,
      value: role.id,
    })),
  });

  try {
    await db.query('UPDATE employee SET role_id = ? WHERE id = ?', [
      newRole.role_id,
      employeeToUpdate.id,
    ]);
    console.log('Employee role updated successfully.');
    mainMenu();
  } catch (error) {
    console.error('Error updating employee role:', error);
    mainMenu();
  }
}

//Function to Update Employee Manager
async function updateEmployeeManager() {
  // Fetch employees
  const employees = await db.query('SELECT id, first_name, last_name FROM employee');
  
  const employeeChoices = employees[0].map(emp => ({
    name: `${emp.first_name} ${emp.last_name}`,
    value: emp.id
  }));

  // Select employee to update
  const { empId } = await inquirer.prompt({
    type: 'list',
    name: 'empId',
    message: 'Select the employee whose manager you want to update:',
    choices: employeeChoices
  });

  // Select new manager
  const { managerId } = await inquirer.prompt({
    type: 'list',
    name: 'managerId',
    message: 'Select the new manager:',
    choices: employeeChoices
  });

  // Update in database
  await db.query('UPDATE employee SET manager_id = ? WHERE id = ?', [managerId, empId]);
  console.log('Employee manager updated successfully.');

  mainMenu();
}

//Function to View Employees by Manager
async function viewEmployeesByManager() {
  try {
    const [rows] = await db.query(
      'SELECT e.id, e.first_name, e.last_name, CONCAT(m.first_name, " ", m.last_name) AS manager FROM employee e LEFT JOIN employee m ON e.manager_id = m.id ORDER BY e.manager_id'
    );
    console.table(rows);
  } catch (error) {
    console.error('Error viewing employees by manager:', error);
  }
  mainMenu();
}

//Funtion to View Employees by Department
async function viewEmployeesByDepartment() {
  try {
    const [rows] = await db.query(
      'SELECT e.id, e.first_name, e.last_name, d.name AS department FROM employee e JOIN role r ON e.role_id = r.id JOIN department d ON r.department_id = d.id ORDER BY d.name'
    );
    console.table(rows);
  } catch (error) {
    console.error('Error viewing employees by department:', error);
  }
  mainMenu();
}

//Function to View Department budget
async function viewDepartmentBudget() {
  try {
    const [rows] = await db.query(
      'SELECT d.name AS department, SUM(r.salary) AS total_budget FROM employee e JOIN role r ON e.role_id = r.id JOIN department d ON r.department_id = d.id GROUP BY d.name'
    );
    console.table(rows);
  } catch (error) {
    console.error('Error viewing department budgets:', error);
  }
  mainMenu();
}


// Function to delete a department
async function deleteDepartment() {
  const departments = await db.query('SELECT * FROM department');
  const departmentToDelete = await inquirer.prompt({
    type: 'list',
    name: 'id',
    message: 'Select the department to delete:',
    choices: departments[0].map((department) => ({
      name: department.name,
      value: department.id,
    })),
  });

  try {
    await db.query('DELETE FROM department WHERE id = ?', [departmentToDelete.id]);
    console.log('Department deleted successfully.');
    mainMenu();
  } catch (error) {
    console.error('Error deleting department:', error);
    mainMenu();
  }
}

// Function to delete a role
async function deleteRole() {
  const roles = await db.query('SELECT * FROM role');
  const roleToDelete = await inquirer.prompt({
    type: 'list',
    name: 'id',
    message: 'Select the role to delete:',
    choices: roles[0].map((role) => ({
      name: role.title,
      value: role.id,
    })),
  });

  try {
    await db.query('DELETE FROM role WHERE id = ?', [roleToDelete.id]);
    console.log('Role deleted successfully.');
    mainMenu();
  } catch (error) {
    console.error('Error deleting role:', error);
    mainMenu();
  }
}

// Function to delete an employee
async function deleteEmployee() {
  const employees = await db.query('SELECT * FROM employee');
  const employeeToDelete = await inquirer.prompt({
    type: 'list',
    name: 'id',
    message: 'Select the employee to delete:',
    choices: employees[0].map((employee) => ({
      name: `${employee.first_name} ${employee.last_name}`,
      value: employee.id,
    })),
  });

  try {
    await db.query('DELETE FROM employee WHERE id = ?', [employeeToDelete.id]);
    console.log('Employee deleted successfully.');
    mainMenu();
  } catch (error) {
    console.error('Error deleting employee:', error);
    mainMenu();
  }
}

// Main menu options including the new delete options
const mainMenuChoices = [
    'View all departments',
    'View all roles',
    'View all employees',
    'Add a department',
    'Add a role',
    'Add an employee',
    'Update an employee role',
    'Update employee manager',
    'View employees by manager',
    'View employees by department',
    'View department budget',
    'Delete a department',
    'Delete a role',
    'Delete an employee',
    'Exit',
  ];

// Start the application by displaying the main menu
mainMenu();
