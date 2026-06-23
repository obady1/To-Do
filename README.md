# Mahami — Smart Task Manager

A modern Arabic task management web application designed to help users organize their daily tasks efficiently. The application provides task creation, filtering, searching, progress tracking, and theme switching in a clean and responsive interface.

> **Note:** The project name is inferred from the page title and visible content in the source code.

---

## Overview

**Mahami** is a simple and interactive To-Do application built for improving productivity and organizing tasks in a structured way.

The application focuses on:

- Clean and modern user experience
- Full Arabic language support (RTL)
- Smart task filtering
- Progress tracking
- Dark mode support

---

## Features

| Feature | Description |
|---|---|
| Add Tasks | Create new tasks with input validation |
| Real-time Search | Search through tasks instantly |
| Task Filtering | Filter tasks by All, Pending, or Completed |
| Remaining Counter | Displays the number of pending tasks |
| Progress Tracking | Shows overall completion percentage |
| Dark Mode | Toggle between light and dark themes |
| Clear All Tasks | Remove all tasks at once |
| Toast Notifications | Interactive status notifications |
| RTL Support | Full right-to-left Arabic layout |
| Responsive Design | Optimized for multiple screen sizes |

---

## Technologies Used

### Frontend

- HTML5
- CSS3
- JavaScript *(inferred from dynamic elements and IDs)*

---

## External Resources

### Fonts

The project uses an external Google Font:

- **Tajawal**

```html
https://fonts.googleapis.com/css2?family=Tajawal
```

---

## Project Structure

```text
project/
│
├── index.html
├── style.css
└── script.js
```

> The presence of interactive elements strongly suggests a JavaScript file or inline script for handling application logic.

---

## Application Layout

### 1. Header Section

Contains:

- Application branding
- Project title
- Short description
- Theme toggle button

---

### 2. Task Input Section

Main input elements:

```text
taskInput
addBtn
errorMsg
```

Responsibilities:

- Writing a new task
- Adding tasks
- Showing validation errors

---

### 3. Search & Filter Section

Includes:

```text
searchInput
filter-tabs
pendingCount
```

Available filters:

- All
- Pending
- Completed

---

### 4. Progress Tracking Section

Displays:

- Overall completion percentage
- Visual progress bar

Elements:

```text
progressPercent
progressFill
```

---

### 5. Tasks List Section

Main task container:

```text
tasksList
```

Used for rendering all tasks dynamically.

---

### 6. Footer Section

Displays:

- Pending tasks count
- Completed tasks count
- Clear all button

Elements:

```text
footerPending
footerCompleted
clearAllBtn
```

---

### 7. Toast Notification System

Dynamic notification container:

```text
toastContainer
```

Used for displaying status messages and alerts.

---

## UI Components

### SVG Icons

The application uses inline SVG icons for:

- Add task button
- Delete button
- Search input
- Theme toggle
- Error messages
- Branding icon

---

## Accessibility Support

The project includes several accessibility improvements such as:

- `aria-label`
- `aria-hidden`
- `role="alert"`
- `role="list"`
- `role="tablist"`
- `aria-selected`

These improve usability for assistive technologies.

---

## User Workflow

```text
Open Application
      ↓
Add New Task
      ↓
Task Appears in List
      ↓
Search or Filter Tasks
      ↓
Update Task Status
      ↓
Statistics Update
      ↓
Progress Bar Updates
      ↓
Delete Task or Clear All
```

---

## Example Usage

### Add a New Task

```text
Add a new task...
```

Example:

```text
Finish AI project documentation
```

---

### Search Tasks

```text
Search your tasks...
```

Example:

```text
project
```

---

### Filter Tasks

Available filters:

```text
All
Pending
Completed
```

---

## UI Design Highlights

- Full Arabic interface
- RTL layout support
- Minimal modern design
- Dynamic progress bar
- Dark mode support
- Flexible card-based layout
- Interactive user experience

---

## Requirements

The project does not require any build tools or backend dependencies.

Requirements:

- A modern web browser
- Internet connection (for loading Google Fonts)

---

## Running the Project

Simply open:

```text
index.html
```

in your browser.

Or run with Live Server:

```bash
Open with Live Server
```

---

## Notes

- Only the HTML structure was provided for analysis.
- The `style.css` file is referenced but was not included.
- Core task logic is not visible in the provided code.

Based on the HTML structure, it is inferred that JavaScript handles:

- Adding tasks
- Deleting tasks
- Filtering tasks
- Searching tasks
- Updating statistics
- Theme switching

---
