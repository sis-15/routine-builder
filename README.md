MAG & JO Routine Builder
This application is a calculation engine designed for Men’s Artistic Gymnastics (MAG) and Junior Olympic (JO) scoring. It applies specific constraints from the FIG Code of Points and USAG Level modifications to automate the determination of a routine's Start Value.
The inspiration for creating this tool was after competing for a few years as a gymnast myself and noticing the steep learning curve for understanding the FIG Code of Points. 
I wanted this tool to help MAG gymnasts like myself create routines without having to always ask a coach, judge, or someone else that knows the code to verify their routines.

Core Functionality
Dynamic Level Scoping: Automatically adjusts skill caps based on level (e.g., counting the top 10 skills for Level 10, 8 for Level 9, and 6 for Level 8).

Event-Specific Constraints: Includes specialized logic for Floor Exercise skill caps and a dedicated Vault mode that pulls values directly from a curated database.

Element Group Validation: Tracks the four required Element Groups and awards a 0.5 bonus for each unique group represented in the counting skills.

Start Value Integration: Combines Difficulty, Element Group bonuses, Connection Values, and Neutral Deductions into a real-time final score.

System Logic and Validation
Duplicate Skill Detection: Monitors skill descriptions to identify repeated elements. If a duplicate is detected, the system assigns it a 0.0 value to ensure scoring integrity.

Skill Maximization: Uses a sorting algorithm to prioritize the highest-value unique skills performed, ensuring the gymnast receives the maximum possible D-score allowed by their level.

Requirement Monitoring: Flags missing Group IV (Dismount) bonuses and alerts the user if the minimum number of Element Groups has not been met.

Dynamic Re-indexing: Allows for the addition or removal of skills at any point in the routine while automatically updating sequence numbers and internal IDs to maintain data consistency.

Technical Stack
Vanilla JavaScript: Lightweight, dependency-free calculation logic.

JSON-Driven Data: Compartmentalized skill data for easy updates to the Code of Points.

State Management: A centralized calculation function that synchronizes the UI scorecard with every user input.
