# HP-Panel
A panel created with nodejs to manage other nodejs projects

## Features
- Windows and Linux support
- You can run all types of nodejs projects
- File upload system
- Panel to start/stop your projects and see their consoles
- All data is saved to a local SQLite3 database `data/database.sqlite3`
- Customized console logging system
- Logging console data to a log file `data/console.log`
- Accounts
- Administrator panel to manage all the projects

## How to setup
1. Download the files
2. Run `node index.js`
3. Anwser the questions in the terminal
4. You are done

## How to run a project on the panel
- Login with your account
- Click on "Submit project" button on the dashboard
- Enter all the details and upload a zip folder with the code of your project
- Click on the "Submit" button
- If you don't have administrator permissions you have to wait before your project is approved
- **ADMIN**
- Go to the `submissions` tab on the admin panel
- Click on the submission of the project
- Click on the `Approve` (to let the project work) or `Reject` (to delete the submission) button
- If the submission is approved you can start your project for the first time
