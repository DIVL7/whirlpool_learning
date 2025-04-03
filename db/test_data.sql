USE whirlpool_learning;

-- Insert test users
INSERT INTO users (username, password, email, first_name, last_name, role) VALUES
('admin1', 'password', 'admin@whirlpool.com', 'Admin', 'User', 'admin'),
('tech1', 'password', 'tech1@whirlpool.com', 'John', 'Doe', 'technician'),
('tech2', 'password', 'tech2@whirlpool.com', 'Jane', 'Smith', 'technician'),
('tech3', 'password', 'tech3@whirlpool.com', 'Robert', 'Johnson', 'technician'),
('tech4', 'password', 'tech4@whirlpool.com', 'Maria', 'Garcia', 'technician');

-- Insert content types
INSERT INTO content_types (name, description) VALUES
('video', 'Video content'),
('text', 'Text-based content'),
('pdf', 'PDF document'),
('image', 'Image content'),
('interactive', 'Interactive content');

-- Insert courses
INSERT INTO courses (title, description, created_by, status) VALUES
('Refrigerator Repair Basics', 'Learn the fundamentals of refrigerator repair and maintenance', 1, 'published'),
('Washing Machine Troubleshooting', 'Advanced troubleshooting techniques for washing machines', 1, 'published'),
('Dryer Maintenance', 'Essential maintenance procedures for dryers', 1, 'draft'),
('Dishwasher Installation', 'Step-by-step guide to proper dishwasher installation', 1, 'published');

-- Insert modules for Refrigerator Repair Basics
INSERT INTO modules (course_id, title, description, position) VALUES
(1, 'Introduction to Refrigeration', 'Basic principles of refrigeration systems', 1),
(1, 'Common Refrigerator Issues', 'Identifying and diagnosing common problems', 2),
(1, 'Repair Techniques', 'Hands-on repair procedures', 3),
(1, 'Maintenance Best Practices', 'Preventative maintenance procedures', 4);

-- Insert modules for Washing Machine Troubleshooting
INSERT INTO modules (course_id, title, description, position) VALUES
(2, 'Washing Machine Components', 'Overview of key components and their functions', 1),
(2, 'Diagnostic Procedures', 'Step-by-step diagnostic techniques', 2),
(2, 'Advanced Repairs', 'Complex repair procedures', 3);

-- Insert contents for Refrigerator modules
INSERT INTO contents (module_id, title, content_type_id, content_data, position) VALUES
(1, 'How Refrigeration Works', 2, 'Refrigeration works on the principle of heat transfer. This content explains the refrigeration cycle in detail...', 1),
(1, 'Refrigerator Components Overview', 4, 'diagram_components.jpg', 2),
(2, 'Troubleshooting Temperature Issues', 2, 'When a refrigerator is not cooling properly, follow these steps to diagnose the problem...', 1),
(2, 'Compressor Problems Video', 1, 'compressor_troubleshooting.mp4', 2),
(3, 'Replacing a Defrost Timer', 1, 'defrost_timer_replacement.mp4', 1),
(3, 'Seal Replacement Guide', 2, 'This guide shows you how to properly replace refrigerator door seals...', 2),
(4, 'Cleaning the Condenser Coils', 2, 'Regular maintenance of condenser coils is essential for efficient operation...', 1);

-- Insert quizzes
INSERT INTO quizzes (module_id, title, description, passing_score, position) VALUES
(1, 'Refrigeration Basics Quiz', 'Test your knowledge of refrigeration principles', 70, 3),
(2, 'Troubleshooting Assessment', 'Evaluate your diagnostic skills', 80, 3),
(3, 'Repair Techniques Evaluation', 'Test your understanding of repair procedures', 75, 3);

-- Insert questions for Refrigeration Basics Quiz
INSERT INTO questions (quiz_id, question_text, question_type, points, position) VALUES
(1, 'What is the primary function of the compressor in a refrigeration system?', 'multiple_choice', 1, 1),
(1, 'The refrigerant changes from a liquid to a gas in which component?', 'multiple_choice', 1, 2),
(1, 'A properly functioning refrigerator should maintain a temperature between:', 'multiple_choice', 1, 3),
(1, 'The defrost cycle is designed to remove frost from which component?', 'multiple_choice', 1, 4);

-- Insert answers for questions
INSERT INTO answers (question_id, answer_text, is_correct) VALUES
(1, 'To cool the refrigerant', FALSE),
(1, 'To compress the refrigerant gas and increase its temperature and pressure', TRUE),
(1, 'To expand the refrigerant', FALSE),
(1, 'To remove moisture from the system', FALSE),

(2, 'Compressor', FALSE),
(2, 'Condenser', FALSE),
(2, 'Evaporator', TRUE),
(2, 'Filter drier', FALSE),

(3, '0°C to 4°C (32°F to 40°F)', TRUE),
(3, '10°C to 15°C (50°F to 59°F)', FALSE),
(3, '-10°C to -5°C (14°F to 23°F)', FALSE),
(3, '5°C to 10°C (41°F to 50°F)', FALSE),

(4, 'Compressor', FALSE),
(4, 'Condenser coils', FALSE),
(4, 'Evaporator coils', TRUE),
(4, 'Refrigerant lines', FALSE);

-- Insert badges for gamification
INSERT INTO badges (name, description, image_url, criteria) VALUES
('Refrigeration Expert', 'Completed the Refrigerator Repair Basics course with a score of 90% or higher', 'badges/refrigeration_expert.png', 'Complete Refrigerator Repair Basics course with 90%+ score'),
('Quick Learner', 'Completed 3 courses within 30 days', 'badges/quick_learner.png', 'Complete 3 courses within 30 days'),
('Helping Hand', 'Answered 10 questions in the forum with at least 5 accepted answers', 'badges/helping_hand.png', 'Answer 10 forum questions with 5+ accepted'),
('Perfect Score', 'Achieved 100% on any quiz', 'badges/perfect_score.png', 'Get 100% on any quiz');

-- Insert forum categories
INSERT INTO forum_categories (name, description) VALUES
('Refrigerator Issues', 'Questions related to refrigerator repairs and maintenance'),
('Washing Machine Problems', 'Troubleshooting and fixing washing machine issues'),
('Dryer Maintenance', 'All topics related to dryer maintenance and repairs'),
('Installation Help', 'Questions about proper appliance installation'),
('General Discussion', 'General topics related to Whirlpool appliances');

-- Insert forum questions
INSERT INTO forum_questions (user_id, category_id, title, content, is_solved) VALUES
(2, 1, 'Refrigerator not cooling properly', 'I have a Whirlpool WRF535SWHZ and the refrigerator section is not cooling properly. The freezer works fine. What could be the issue?', FALSE),
(3, 2, 'Washing machine making loud noise during spin cycle', 'My washing machine started making a loud banging noise during the spin cycle. Any ideas what could be causing this?', TRUE),
(4, 4, 'Dishwasher installation clearance requirements', 'What are the minimum clearance requirements for installing a Whirlpool dishwasher model WDT730PAHZ?', FALSE);

-- Insert forum answers
INSERT INTO forum_answers (question_id, user_id, content, is_accepted) VALUES
(1, 3, 'Check if the air vents between the freezer and refrigerator sections are blocked. This is a common issue with that model.', FALSE),
(1, 4, 'You might need to check the damper control assembly. If it\'s not opening properly, cold air won\'t flow from the freezer to the refrigerator section.', FALSE),
(2, 2, 'It could be that something small is caught in the drum or that the drum bearings are worn out. Try running an empty cycle to see if the noise persists.', FALSE),
(2, 5, 'Check if the washing machine is properly balanced. Uneven loads can cause banging during the spin cycle. Also, make sure the shipping bolts were removed during installation.', TRUE),
(3, 2, 'The standard clearance for that model is 1/2 inch on each side, 2 inches at the back, and 1/2 inch at the top. Make sure you have proper access to water and drain connections.', FALSE);

-- Insert user progress data
INSERT INTO user_course_progress (user_id, course_id, status, progress_percentage, started_at) VALUES
(2, 1, 'in_progress', 75.00, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(2, 2, 'completed', 100.00, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(3, 1, 'in_progress', 50.00, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(4, 1, 'completed', 100.00, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(5, 2, 'in_progress', 25.00, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- Insert user content progress
INSERT INTO user_content_progress (user_id, content_id, completed, completed_at) VALUES
(2, 1, TRUE, DATE_SUB(NOW(), INTERVAL 9 DAY)),
(2, 2, TRUE, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(2, 3, TRUE, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(2, 4, TRUE, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(2, 5, FALSE, NULL),
(3, 1, TRUE, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(3, 2, TRUE, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(3, 3, FALSE, NULL);

-- Insert quiz attempts
INSERT INTO quiz_attempts (user_id, quiz_id, score, passed, started_at, completed_at) VALUES
(2, 1, 75.00, TRUE, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY)),
(3, 1, 50.00, FALSE, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)),
(4, 1, 100.00, TRUE, DATE_SUB(NOW(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY));

-- Insert user points
INSERT INTO user_points (user_id, total_points, level) VALUES
(2, 350, 3),
(3, 150, 2),
(4, 500, 5),
(5, 75, 1);

-- Insert points history
INSERT INTO points_history (user_id, points, action) VALUES
(2, 100, 'Completed Refrigerator Repair Basics module 1'),
(2, 100, 'Completed Refrigerator Repair Basics module 2'),
(2, 75, 'Passed Refrigeration Basics Quiz'),
(2, 75, 'Answered forum question'),
(3, 100, 'Completed Refrigerator Repair Basics module 1'),
(3, 50, 'Answered forum question'),
(4, 400, 'Completed Refrigerator Repair Basics course'),
(4, 100, 'Perfect score on quiz'),
(5, 75, 'Completed Washing Machine Troubleshooting module 1');

-- Insert user badges
INSERT INTO user_badges (user_id, badge_id) VALUES
(2, 2),
(4, 1),
(4, 4);

-- Insert some statistics for admin dashboard
INSERT INTO statistics (stat_name, stat_value, calculated_at) VALUES
('course_completion_rates', '{"1": 0.25, "2": 0.5, "3": 0, "4": 0}', NOW()),
('average_quiz_scores', '{"1": 75, "2": 0, "3": 0}', NOW()),
('active_users_last_30_days', '{"count": 4, "trend": "up"}', NOW()),
('most_active_forum_categories', '{"1": 2, "2": 1, "4": 1}', NOW());