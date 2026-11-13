# Vaulto – Money, in Balance.

## About Vaulto

Vaulto is a personal finance management web application that helps individuals organize, allocate, and track their money.

Its central idea is simple: decide where your income should go, record your financial activities, and monitor how your money is being used.

Vaulto provides a centralized platform for managing expenses, savings, investments, and other financial commitments.

## Why Vaulto?

Managing money involves more than tracking income and expenses. It also requires a clear plan for allocating income and monitoring financial progress.

Vaulto aims to simplify this process by helping users:

- Divide their monthly income into predefined financial categories.
- Customize category names and allocation percentages.
- Record income and financial transactions.
- Monitor actual contributions and spending against allocated targets.
- Review monthly financial activity through analytics.

## Key Features

- **User Authentication:** Individual accounts with registration, login, and logout.
- **Financial Dashboard:** View monthly financial allocations, recorded amounts, and category-wise progress.
- **Four Default Categories:** Manage Expense, Savings, Investments, and Emergency Fund.
- **Customizable Category Names:** Rename the four default categories according to personal requirements.
- **Flexible Allocation:** Customize the percentage assigned to each category, with the total required to equal exactly 100%.
- **Transaction Management:** Add and remove financial entries.
- **Expense Tracking:** Monitor spending against the allocated expense target.
- **Savings Tracking:** Track savings contributions.
- **Investment Tracking:** Record investment contributions. Vaulto does not calculate market returns or investment profits and losses.
- **Monthly Analytics:** Visualize financial activity, including category-wise transactions, income, and loan/EMI contributions.
- **Persistent Data:** Store financial records and user settings in a database.

## How Vaulto Works

1. Register or log in to your account.
2. Enter your financial information.
3. Customize the names of the four predefined categories if required.
4. Assign an allocation percentage to each category.
5. Ensure that the combined allocation equals 100%.
6. Add or remove financial entries as needed.
7. Monitor category-wise progress on the dashboard.
8. Review financial activity through the Analytics section.



**Calculation Logic**

Category Target = Monthly Income × Allocation Percentage / 100

Usage Percentage = (Actual Amount / Category Target) × 100

For example, if the allocated target is ₹2,500 and the actual amount recorded is ₹1,350:

Usage Percentage = (1,350 / 2,500) × 100 = 54%

The dashboard uses progress indicators to help users understand how much of their allocated target has been used or contributed.

## Technology Stack

**Frontend**

- React.js
- JavaScript
- HTML5
- CSS3
- Vite
- Recharts
- Lucide React

**Backend**

- Python
- FastAPI
- SQLAlchemy
- JWT Authentication
- Password Hashing

**Database and Deployment**

- PostgreSQL
- Neon
- Vercel
- Render



## Application Architecture

Vaulto follows a full-stack client-server architecture.

- The React frontend provides the user interface and handles user interactions.
- The FastAPI backend manages application logic, authentication, and API requests.
- SQLAlchemy manages communication between the backend and database.
- PostgreSQL stores user accounts, financial records, and application settings.
- Vercel hosts the frontend.
- Render hosts the backend.

## Project Objective

The objective of Vaulto is to make personal finance management more organized, understandable, and accessible.

Instead of focusing on complicated financial concepts, Vaulto emphasizes a practical approach: allocate your income, record your financial activities, and understand where your money goes.

## Future Scope

Potential improvements include:

- More detailed financial analytics.
- Enhanced monthly reports and visualizations.
- Financial data export.
- Improved budgeting insights.
- Personalized financial recommendations.
- Dynamic Financial Categories
