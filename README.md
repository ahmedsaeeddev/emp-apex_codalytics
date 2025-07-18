# Employee Management System

A robust and intuitive web application designed to streamline employee and task management within an organization. This system provides distinct interfaces for administrators to manage employees and assign tasks, and for employees to view and update their assigned work.

## ✨ Features

*   **User Authentication**: Secure login for both administrators and employees.
*   **Admin Dashboard**:
    *   View and manage a list of all employees.
    *   Add new employees with their details and assign roles.
    *   View and edit individual employee profiles.
    *   Delete employee records (requires server-side Firebase Auth user deletion).
    *   Assign new tasks to specific employees.
    *   View and manage all active assigned tasks.
    *   Delete assigned tasks.
    *   View a history of expired tasks.
*   **Employee Dashboard**:
    *   View a list of tasks assigned to them.
    *   Update the status of assigned tasks (limited to 2 changes per task).
    *   View task details including description, category, and expiry.
*   **Responsive Design**: Optimized for seamless use across various devices, from desktops to mobile phones.

## 🚀 Technologies Used

*   **Next.js**: A React framework for building full-stack web applications.
*   **React**: A JavaScript library for building user interfaces.
*   **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
*   **shadcn/ui**: Reusable UI components built with Radix UI and Tailwind CSS.
*   **Firebase Authentication**: For secure user sign-in and management.
*   **Firestore**: A NoSQL cloud database for storing application data (employees, tasks).
*   **Lucide React**: A collection of beautiful and customizable open-source icons.

## 🛠️ Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

Before you begin, ensure you have the following installed:

*   Node.js (v18.x or higher)
*   npm or yarn

### Firebase Setup

1.  **Create a Firebase Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Enable Authentication**:
    *   In your Firebase project, navigate to "Authentication" > "Get started".
    *   Enable the "Email/Password" sign-in method.
3.  **Set up Firestore Database**:
    *   In your Firebase project, navigate to "Firestore Database" > "Create database".
    *   Choose "Start in production mode" (you will set up security rules later).
    *   Select a Cloud Firestore location.
4.  **Get Firebase Configuration**:
    *   In your Firebase project settings (Project overview -> Project settings -> Your apps), add a new web app.
    *   Copy the Firebase configuration object (apiKey, authDomain, projectId, etc.).
