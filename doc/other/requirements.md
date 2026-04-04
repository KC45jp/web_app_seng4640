# Requirements Specification

This document is a reformatted version of the project requirements from [SENG 4640 - Final Project.md](/home/keishi/tru/web_seng4640/web_app_seng4640/doc/other/SENG%204640%20-%20Final%20Project.md). It is intended to be easier to scan and reference during implementation, testing, and report writing.

## 1. User Accounts and Access

### UA-1. Role Model
The system shall support a hierarchical user model consisting of four distinct roles:

1. Guest
2. Customer
3. Product Manager
4. Super Admin

### UA-2. Guest Restrictions
The system shall restrict Guests to browsing products and viewing details.

Guests shall not be permitted to:

1. View Flash Sale inventory counts
2. Purchase items

### UA-3. Customer Capabilities
The system shall allow logged-in Customers to:

1. Manage their profile
2. Manage their shopping cart
3. Complete purchases

### UA-4. Product Manager Capabilities
The system shall allow Product Managers to:

1. Add products
2. Update products
3. Remove products
4. Set prices
5. Manage stock
6. Initiate Flash Sale events

Product Managers shall not have permission to create administrative accounts.

### UA-5. Super Admin Capabilities
The system shall allow Super Admins to:

1. Create Product Manager accounts
2. Delete Product Manager accounts
3. Manage Product Manager accounts

## 2. Product Management

### PM-1. Catalog Administration
The system shall allow administrators to add, update, and delete products from the catalog.

### PM-2. Product Data
Each product shall have detailed information including:

1. Name
2. Description
3. Price
4. Images
5. Inventory status

### PM-3. Search and Filtering
The system shall allow customers to search and filter products based on various criteria, including:

1. Category
2. Price range
3. Keywords

### PM-4. Catalog Scale
The system shall be populated with a minimum of 50 distinct products across multiple categories to demonstrate UI scalability.

Use of scripts to generate seed data is permitted.

## 3. Shopping Cart and Order Management

### SO-1. Shopping Cart
The system shall provide shopping cart functionality where logged-in users can:

1. Add items
2. Remove items
3. Update item quantities

### SO-2. Checkout
The system shall support a secure checkout process for completing orders, including various payment options such as:

1. Credit card
2. PayPal

### SO-3. Orders
The system shall:

1. Generate order confirmations
2. Provide order tracking capabilities for customers

## 4. User Interface

### UI-1. Usability and Responsiveness
The website shall have a user-friendly interface with clear navigation and a responsive design that adapts to different screen sizes.

### UI-2. Product Presentation
The system shall provide a visually appealing presentation of products with:

1. High-quality images
2. Clear product descriptions

## 5. Data Management

### DM-1. Data Storage
The system shall utilize a database to efficiently store and manage:

1. Product data
2. User data
3. Order information

### DM-2. Data Integrity
The system shall ensure data integrity and protect sensitive information, including user credentials and payment details.

## 6. Security

### SEC-1. Protection of User Data
The system shall protect user data with appropriate security measures, including:

1. Encryption
2. Secure authentication protocols

### SEC-2. Common Web Vulnerabilities
The system shall be resilient to common web security vulnerabilities, including:

1. Cross-site scripting
2. SQL injection

## 7. Performance

### PERF-1. Responsiveness
The system shall provide a responsive user experience with fast loading times and efficient data retrieval.

### PERF-2. Scalability
The system shall be scalable to handle a growing number of users and products.

## 8. High-Concurrency Flash Sale

### FS-1. Flash Sale Creation
The system shall allow administrators to create Flash Sale events for products with:

1. Strict inventory limits
2. Scheduled release times

### FS-2. Oversell Prevention
The system shall guarantee zero inventory overselling, preventing negative stock, when handling simultaneous purchase requests from multiple users.

### FS-3. Concurrency Strategy
The system shall implement a deliberate architectural strategy to resolve race conditions during checkout.

Examples given in the original specification include:

1. Optimistic concurrency control
2. Pessimistic locking
3. Queuing

## 9. Testing and Validation

### TV-1. Automated Unit Tests
The system shall include a suite of automated unit tests covering at least three critical backend functions, such as:

1. Authentication
2. Order calculation
3. Inventory management

Suggested frameworks in the original specification include Jest, Mocha, or JUnit.

### TV-2. Automated Load Testing
The system shall be validated against the Flash Sale constraint using automated load-testing tools, such as JMeter, to demonstrate stability under high concurrency.

### TV-3. Manual Testing Is Not Enough
The system shall not rely solely on manual click-testing for verification.

## 10. Deployment

### DEP-1. Live Deployment
The system shall be deployed to a live environment and accessible via a public URL.

Examples given in the original specification include:

1. AWS Free Tier
2. Google Cloud Free Tier
3. Render

A localhost-only submission is not permitted for the final product.

## 11. Data Protection

### DP-1. Privacy Compliance
The system shall comply with relevant data protection regulations, such as GDPR and CCPA, to ensure the privacy and security of user data.

This includes:

1. Providing users with clear information about data collection practices
2. Obtaining consent for data processing

## 12. Accessibility

### ACC-1. Accessibility Guidelines
The system shall adhere to accessibility guidelines, such as WCAG, to ensure that the website is usable by people with disabilities.

This includes:

1. Providing alternative text for images
2. Supporting keyboard navigation
3. Maintaining sufficient color contrast

## 13. Engineering Metrics Note

Some requirements in the original specification are qualitative, especially:

1. Fast loading times
2. Scalable
3. User-friendly

These must be converted into specific, measurable engineering metrics in the final report.

Examples given in the original specification include:

1. Time to First Byte < 200ms
2. Largest Contentful Paint < 2.5s
3. Maximum 3 clicks to checkout

## 14. Suggested Use

This reformatted version is useful for:

1. Mapping implemented features to requirements
2. Building a testing table for the final report
3. Checking whether each requirement has evidence
4. Referencing requirement IDs in documentation and validation sections
