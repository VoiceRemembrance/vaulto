# Vaulto – Money, in Balance.

## Project Overview

Vaulto is a full-stack personal finance management web application developed to simplify the way individuals organize, allocate, and track their money. It provides a centralized platform where users can manage their financial activities, customize income allocation percentages, record transactions, and monitor their monthly financial progress through an intuitive dashboard.

The project is built around a simple concept: every amount of money should have a purpose. Instead of merely tracking income and expenses, Vaulto encourages users to plan how their income is distributed and compare their actual financial activities against their planned allocations.

## Problem Statement

Managing personal finances can become difficult when income, expenses, savings, and investments are tracked separately. Individuals may know how much they earn and spend but lack a clear overview of how their money is distributed across different financial priorities.

Vaulto addresses this problem by bringing financial allocation, transaction tracking, and monthly analytics together in a single application. Its goal is to make everyday financial management more structured, transparent, and accessible.

## Core Functionality

Vaulto provides individual user authentication and a personalized financial dashboard that displays monthly allocations, recorded transactions, and category-wise progress. The application uses four predefined financial categories: Expense, Savings, Investments, and Emergency Fund. Users can customize the display names and allocation percentages of these categories according to their financial priorities, while the total allocation must always equal 100%.

Users can record and remove financial entries, monitor expenses and contributions against their allocated targets, and review their financial activity through the Analytics section. The dashboard uses visual progress indicators to communicate category-wise usage, while monthly analytics provide graphical representations of financial activity, including expenses, savings, investments, income, and Loan/EMI contributions.

Investment tracking is limited to recording contributions. Vaulto does not calculate market returns, investment valuations, or profits and losses.

## Financial Allocation Methodology

Vaulto calculates the target amount for each category using the user's monthly income and selected allocation percentage. The category target is calculated by multiplying monthly income by the category's allocation percentage and dividing the result by 100.

Category progress is determined by comparing the actual recorded amount with its allocated target. This provides users with a straightforward way to understand how much of their planned allocation has been used or contributed.

For example, with a monthly income of ₹20,000 and an investment allocation of 25%, the investment target would be ₹5,000. If the user records an investment contribution of ₹2,500, the dashboard displays 50% progress towards that target.

## Technology Stack

The frontend is developed using React.js, JavaScript, HTML5, and CSS3, with Vite serving as the development and build tool. Recharts is used for financial data visualization, while Lucide React provides interface icons.

The backend is developed using Python and FastAPI, providing REST API endpoints and handling application logic and authentication. SQLAlchemy is used for database integration, while JWT-based authentication and password hashing support account security.


## System Architecture

Vaulto follows a client-server architecture. The React frontend communicates with the FastAPI backend through REST APIs. The backend processes application requests, handles authentication, and interacts with the PostgreSQL database through SQLAlchemy. User accounts, financial transactions, and application settings are persisted in the database.

The frontend and backend are deployed independently, allowing the application interface, server-side logic, and database to operate as separate components of the overall system.

## Deployment

PostgreSQL serves as the primary database, hosted on Neon. The frontend is deployed through Vercel, and the backend is deployed through Render. This deployment setup makes the application accessible through a public web address without requiring users to run the project locally.

## Future Scope

Future development may include more detailed financial analytics, downloadable financial reports, enhanced budgeting insights, improved personalization, dynamic financial categories and AI-assisted financial insights. These additions could further expand Vaulto into a more comprehensive personal finance management platform.


**Live Application:** https://vaulto-kohl.vercel.app/

**Backend API Documentation:** https://vaulto-oavo.onrender.com/docs

*Vaulto is a financial tracking and planning tool, not a source of professional financial advice. Investment entries represent recorded contributions and do not reflect market returns.*

---

**Give every amount a purpose. Track every movement. Understand your money.**
