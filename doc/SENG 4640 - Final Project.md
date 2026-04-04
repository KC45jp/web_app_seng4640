![Logos - TRU\_Logo\_Horizontal\_900px][image1]

**Department of Engineering** 

# **Faculty of Science**

**SENG 4640 \- Web Apps**

**Design Project: Building a Scalable E-commerce Web Application**  
*This is a group project with a maximum of 2 students per team.*

## **Learning Objectives**

* Design and develop a functional e-commerce web application using front-end and back-end technologies.  
* Implement user authentication and authorization to manage user roles (customer and admin).  
* Structure and store product data effectively and perform CRUD (Create, Read, Update, Delete) operations.  
* Build RESTful APIs to facilitate communication between the front-end and back-end.

### **Deadlines**

* ***Progress Check \#1:*** **Team Charter (Total: 10 marks)**   
  * Due: Week 2 (Jan 22\)

* ***Progress Check \#2:*** **Web App Design using HTML, CSS, and JS (Total: 35 marks)**   
  * Due: Week 4  (Feb 05\)

* ***Progress Check \#3:*** **Web App Architecture (Total: 35 marks)**   
  * Due: Week 8  (Mar 05\)

* ***Progress Check \#4:*** **Full-Stack Web App (Total: 20 marks)**   
  * Due: Week 12 (Apr 02\)

* ***Final Project and Video Demo***  
  * Due: Week 12 (Apr 02\)

* ***Presentation and Final Report***   
  * Due: Week 13 (Apr 09\)

## **Project Overview**

You are tasked with developing a fully functional e-commerce web application, similar to Amazon, where users can browse products, create accounts, and make purchases.  The application will have two main types of users: customers and administrators.  Customers should be able to explore products and categories, manage their shopping carts, and complete orders. Administrators will have the ability to add, update, and delete products, manage inventory, and potentially access user data for analytics.  Your goal is to create a dynamic and user-friendly online shopping experience with a robust back-end system for managing data and user interactions.

## **Requirements Specification**

After conducting user and stakeholder interviews, the following software requirements have been compiled for the e-commerce web application:

1. User Accounts and Access  
   1. The system shall support a hierarchical user model consisting of four distinct roles: Guest, Customer, Product Manager, and Super Admin.  
   2. The system shall restrict Guests to browsing products and viewing details. They shall not be permitted to view Flash Sale inventory counts or purchase items.  
   3. The system shall allow logged-in Customers to manage their profile, shopping cart, and complete purchases.  
   4. The system shall allow Product Managers to add, update, and remove products, set prices, manage stock, and initiate Flash Sale events, but they shall not have permission to create administrative accounts.  
   5. The system shall allow Super Admins to create, delete, and manage Product Manager accounts.  
2. Product Management  
   1. The system shall allow administrators to add, update, and delete products from the catalog.  
   2. Each product shall have detailed information including name, description, price, images, and inventory status.  
   3. The system shall allow customers to search and filter products based on various criteria (e.g., category, price range, keywords).  
   4. The system shall be populated with a minimum of 50 distinct products across multiple categories to demonstrate UI scalability (use of scripts to generate seed data is permitted).  
3. Shopping Cart and Order Management  
   1. The system shall provide a shopping cart functionality where logged-in users can add, remove, and update the quantity of items.  
   2. The system shall support a secure checkout process for completing orders, including various payment options (e.g., credit card, PayPal).  
   3. The system shall generate order confirmations and provide order tracking capabilities for customers.  
4. User Interface  
   1. The website shall have a user-friendly interface with clear navigation and a responsive design that adapts to different screen sizes.  
   2. The system shall provide a visually appealing presentation of products with high-quality images and clear product descriptions.  
5. Data Management  
   1. The system shall utilize a database to efficiently store and manage product data, user data, and order information.  
   2. The system shall ensure data integrity and protect sensitive information (e.g., user credentials, payment details).  
6. Security  
   1. The system shall protect user data with appropriate security measures, including encryption and secure authentication protocols.  
   2. The system shall be resilient to common web security vulnerabilities (e.g., cross-site scripting, SQL injection).  
7. Performance  
   1. The system shall provide a responsive user experience with fast loading times and efficient data retrieval.  
   2. The system shall be scalable to handle a growing number of users and products.  
8. High-Concurrency Flash Sale  
   1. The system shall allow administrators to create "Flash Sale" events for products with strict inventory limits and scheduled release times.  
   2. The system shall guarantee zero inventory overselling (preventing negative stock) when handling simultaneous purchase requests from multiple users.  
   3. The system shall implement a deliberate architectural strategy (e.g., optimistic concurrency control, pessimistic locking, or queuing) to resolve race conditions during checkout.  
9. Testing and Validation  
   1. The system shall include a suite of automated unit tests (using frameworks like Jest, Mocha, or JUnit) covering at least three critical backend functions (e.g., Authentication, Order Calculation, and Inventory Management).  
   2. The system shall be validated against the "Flash Sale" constraint using automated load-testing tools (e.g., JMeter) to demonstrate stability under high concurrency.  
   3. The system shall not rely solely on manual "click-testing" for verification.  
10. Deployment  
    1. The system shall be deployed to a live environment (e.g., AWS Free Tier, Google Cloud Free Tier, or Render) and accessible via a public URL. Submission of a "localhost-only" version for the final product is not permitted.

In addition to these requirements, they also are required by government to:

11. Data Protection  
    1. The system shall comply with relevant data protection regulations (e.g., GDPR, CCPA) to ensure the privacy and security of user data. This includes providing users with clear information about data collection practices and obtaining consent for data processing.  
12. Accessibility  
    1. The system shall adhere to accessibility guidelines (e.g., WCAG) to ensure that the website is usable by people with disabilities. This includes providing alternative text for images, keyboard navigation, and sufficient color contrast.

To successfully complete this project, you will need to:

* Select appropriate web development frameworks and tools for front-end and back-end development, considering factors such as ease of use, performance, and community support.  
* Design a robust architecture that can handle the expected user load and data volume, ensuring scalability and maintainability.  
* Implement security measures throughout the application to protect customer data and comply with relevant regulations.  
* Conduct thorough testing to ensure that the application meets all requirements and provides a smooth and reliable shopping experience.

**Note:** Certain requirements listed above (specifically regarding "fast loading times", "scalable", and "user-friendly") are qualitative. As part of your engineering design process, you are required to research industry standards and **define specific, measurable Engineering Metrics** for these items in your Final Report. *Example:* You must define "fast" (e.g., "Time to First Byte \< 200ms" or "LCP \< 2.5s") and "user-friendly" (e.g., "Max 3 clicks to checkout") rather than leaving them vague.

## **Limitation**

While you should try to create a comprehensive e-commerce application, the project is subject to certain limitations:

* Budget Constraints:  The project will be developed with a limited budget, which may restrict the choice of hosting providers, third-party services, and development tools.   
* Time Constraints: The project has a defined timeframe for completion, which may limit the scope of features and functionality that can be implemented.   
* Data Availability: Access to real-world product data and user data may be limited. Use sample data or generate synthetic data for testing and development purposes.  
* Scalability: While the application should be designed with scalability in mind, the actual scalability testing may be limited due to resource constraints.

## **Teamwork** 

This project will be completed in groups of 2-3 students. The instructor will randomly create groups for all students by the second lab session. Groups will be posted on Moodle.

The most important part of a successful team is finding a time when everyone meets, as a group, each week, for at least two hours. Each student should expect to spend about four hours outside of class per week on the project.

Compare your schedules to find a time block of at least two hours when you all can meet. Commit to meeting at this time each week and working together. If something comes up and someone can't make it, be sure to schedule another time for that week.

A team charter is a document of your own design. It should be “artfully” designed, expressing some interests and passions of your team. Things to discuss: What are your goals for the class? Who are your team members? What is your team mascot? How will the team celebrate triumphs? How will the team make important decisions? How will the team resolve conflicts and discuss problems? What does “leadership” mean to your team? Who is the person that hits “submit” on your reports and milestones? What are the skills of the team members? What special skill does everyone bring to the team? When will the team meet as a group each week? (Please be precise.) What will be the procedure for missing or being late to this meeting? How much advance notice must be given and using what method?

You will be asked to deliver your team charter in the second week of semester.

## **Assessment and Deliverables**

As we work through learning the engineering design process, the course instructor will complete four progress checks throughout the term, each worth 2.5% of the final term project grade for a total of 10%. The remainder of the term project grade will be placed on the final assessment of the completed project. The progress checks, a recorded video demo of your project, final project report and presentation, and marking scheme are provided below.    
   
You'll present your progress to the instructor during your lab session on the due date. You can present your materials either as printed copies or on your laptop.

 

***Progress Check \#1:*** **Team Charter (Total: 10 marks)**   
Weighting: 1% of project mark 

Due: Week 2 (Jan 22\)

* Deliver your Team Charter document. (5 marks)  
* Discuss your plan for next steps. (5 marks)   
* Group Peer Review Form: Optional. Please complete and email this form to the instructor if any of your teammates have not met expectations for fulfilling their role.

***Progress Check \#2:*** **Web App Design using HTML, CSS, and JS (Total: 35 marks)**   
Weighting: 3.5% of project mark   
Due: Week 4  (Feb 05\)

* Complete your app web app design. (20 marks)   
  (see some examples here: [https://mui.com/store/templates](https://mui.com/store/templates))    
* Complete Sections 2 and 3 of the final report (5 marks)  
* Discuss your plan for next steps to implement a fully functional server-less app. (5 marks)   
* Teamwork: Provide details on each of the meetings (time, who was present agenda, minutes, etc.) as described in the Teamwork section of the final report template. (5 marks)  
* Group Peer Review Form: Optional. Please complete and email this form to the instructor if any of your teammates have not met expectations for fulfilling their role. 

   
***Progress Check \#3:*** **Web App Architecture (Total: 35 marks)**   
Weighting: 3.5% of project mark   
Due: Week 8  (March 05, 2025\)

* Generate a minimum of three distinct Full-Stack Architectures (Frontend, Backend, Database, and (Cloud) Deployment) to solve the core engineering challenge: The High-Concurrency Flash Sale. For each alternative, you must provide a detailed diagram showing the data flow, backend validation logic, and database locking/queuing strategy used to prevent overselling. Evaluate each architecture based on complexity, performance, and reliability, then select the most feasible solution for your team and justify your choice. (10 marks)   
* Describe the advantages and disadvantages of each solution. Structure the description of each design alternative the same way, with information given in the same order using the same formatting in order to make it easier for the reader to understand the comparison. (5 marks)   
* The most feasible solution should be selected. Explain why it is better than other solutions. Use a table for comparison purposes. (5 marks)   
* Create a function tree for the final solution. Each step should be one arm of the tree. Discuss your plan for next (5 marks).  
* Update the entire final report and complete all related sections based on your progress (5 marks).   
* Teamwork: Provide details on each of the meetings (time, who was present agenda, minutes, etc) as described in the Teamwork section of the final report template since the last deliverable. (5 marks)   
* Group Peer Review Form: Optional. Please complete and email this form to the instructor if any of your teammates have not met expectations for fulfilling their role. 

***Progress Check \#4:*** **Full-Stack Web App (Total: 20 marks)**   
Weighting: 2% of project mark   
Due: Week 12 (Apr 02\)

* Demonstrate the latest version of your product, and discuss what works, what does not work, and your plan to complete the project and meet all the requirements on time (10 marks).  
* Complete the entire final report based on your progress (5 marks).  
* Teamwork: Provide details on each of the meetings (time, who was present agenda, minutes, etc) as described in the Teamwork section of the final report template since the last deliverable. (5 marks)  
* Group Peer Review Form: Optional. Please complete and email this form to the instructor if any of your teammates have not met expectations for fulfilling their role. 

   
***Final Project and Video Demo***  
Weighting: 55% of project mark   
Due: Week 12 (Apr 02\)

* Your completed project, deployed (on any host), and running. Your project has satisfied all requirements. (50 marks)   
* A recorded video demonstrating all functionalities of your platform, highlighting how they meet the project requirements. Clearly indicate which aspects are working as expected and any issues or limitations. (5 marks)

***Presentation and Final Report***   
Weighting: 35% of project mark   
Due: Week 13 (Apr 09\)

* Presentation (10 marks)  
  * A presentation of your fully functional product must be provided during the last week of classes. Prior to bringing it to the lab, it should be tested elsewhere to ensure it is working as intended.  
  * This presentation should include the objective, the structure and the technologies used in each step, one or more interesting challenges, a comprehensive evaluation, and meaningful conclusions. Each group member should have a chance to participate. You have 10 to 15 minutes to present your project.  
* A technical report must be submitted by the project due date. (20 marks)   
  Make sure that your final report reflect the following items:   
  * Project creativity and aesthetics.   
  * Increased complexity and variety of steps results in higher marks here.   
  * Discuss your testing methods, successes, and failures for the general application. Crucially, you must include a specific "Engineering Validation" section presenting data (e.g., database logs or JMeter load-test results) that proves your "Flash Sale" architecture successfully prevented overselling under high concurrency. Discuss how these results validate your chosen architectural strategy.  
  * Environmental, societal, safety and economic considerations are adequately researched and discussed in the report.  
  * Limitations of the design and end-product are discussed.  
  * Teamwork. Provide details on each of the meetings (time, who was present agenda, minutes, and a record of team rule penalties, as described in the Teamwork section of the Final Report Template) throughout the project. This will involve combining the teamwork portion from the first 4 progress checks and then adding the teamwork items since the last deliverable. Some of this can be placed in an appendix if this section gets too long.  
  * Project Management. Provide a Gantt Chart showing how the work progressed. This is a modified version of the original Gantt chart provided during deliverable \#1. Also reflect on your project management successes and failures as a team and how you can improve next time.  
  * Conclusions. A summary of what you achieved. See the Final Report Template for more guidance.  
  * Report Format: The report should follow the Final Report Template and all background research or borrowed content should be referenced using IEEE style. The length of the report and each section should reflect the complexity of the topic, thoroughness of the research, and effort of the design. Standard formal English should be used. (5 marks)   
* Group Peer Review Form, submitted by each student on Moodle (5 marks) 

### **Submission**

- You have only one submission, due at the end of the semester after your presentation.  
- The submission must be a single ZIP file containing your full source code and documentation.  
- The ZIP must include a README.md file with two distinct sections:  
  - The active, public URL to your deployed application (e.g., AWS, Google Cloud, or Render) where the instructor can immediately test the "Flash Sale" and Admin features.  
  - Local Build Instructions including the exact commands required to build, run, and test your web app on a local Linux system (as a backup for grading).  
- Your final submission also needs to include a recorded video showing how to run your app on a local host system, and describing how your app meets each of the user requirements and what works and what doesn't work.

### **Marking Schema**

The course project’s marking scheme has been posted on Moodle and is available [here](https://docs.google.com/spreadsheets/d/1ahChO-9WXDllP8NIRCj-Lu7dJV3W0BmV6FF8YWQSs_U/edit?usp=sharing).  


[image1]: <data:image/png;base64,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>