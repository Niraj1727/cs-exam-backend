const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const Question = require('../models/Question');
const User = require('../models/User');

// Subject Data (fixed chapters)
const subjectsData = {
    "Company Law": {
        partI: {
            title: 'Part I: Company Law - Principles & Concepts (60 Marks)',
            chapters: [
                'Introduction to Company Law',
                'Legal Status and Types of Registered Companies',
                'Memorandum and Articles of Association and its Alteration',
                'Shares and Share Capital - Concepts',
                'Members and Shareholders',
                'Debt Instruments - Concepts',
                'Charges',
                'Distribution of Profits',
                'Accounts and Auditors',
                'Compromise, Arrangement and Amalgamations - Concepts',
                'Dormant Company',
                'Inspection, Inquiry and Investigation',
            ],
        },
        partII: {
            title: 'Part II: Company Administration and Meetings (40 Marks)',
            chapters: [
                'General Meetings',
                'Directors',
                'Board Composition and Powers of the Board',
                'Meetings of Board and its Committees',
                'Corporate Social Responsibility - Concepts',
                'Annual Report - Concepts',
                'Key Managerial Personnel (KMP’s) and their Remuneration',
            ],
        },
    },
    JIGL: {
        partI: {
            title: 'Part I: Jurisprudence, Interpretation, and General Laws (100 Marks)',
            chapters: [
                'Sources of Law',
                'Constitution of India',
                'Interpretation of Statutes',
                'Administrative Laws',
                'Law of Torts',
                'Law relating to Civil Procedure',
                'Laws relating to Crime and its Procedure',
                'Law relating to Evidence',
                'Law relating to Specific Relief',
                'Law relating to Limitation',
                'Law relating to Arbitration, Mediation, and Conciliation',
                'Indian Stamp Law',
                'Law relating to Registration of Documents',
                'Right to Information Law',
                'Law relating to Information Technology',
                'Contract Law',
                'Law relating to Sale of Goods',
                'Law relating to Negotiable Instruments',
            ],
        },
    },
    SUBIL: {
        partI: {
            title: 'Part I: Setting up of Business (60 Marks)',
            chapters: [
                'Selection of Business Organization',
                'Corporate Entities – Companies',
                'Limited Liability Partnership',
                'Startups and its Registration',
                'Micro, Small and Medium Enterprises',
                'Conversion of Business Entities',
                'Non-Corporate Entities',
                'Financial Services Organisation',
                'Business Collaborations',
                'Setting up of Branch Office/ Liaison Office/ Wholly Owned Subsidiary by Foreign Company',
                'Setting up of Business outside India and Issues Relating thereto',
                'Identifying laws applicable to various Industries and their initial compliances',
                'Various Initial Registrations and Licenses',
            ],
        },
        partII: {
            title: 'Part II: Industrial and Labour Laws (40 Marks)',
            chapters: [
                'Constitution and Labour Laws',
                'Evaluation of Labour Legislation and need of Labour Code',
                'Law of Welfare & Working Condition',
                'Law of Industrial Relations',
                'Law of Wages',
                'Social Security Legislations',
                'Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013',
            ],
        },
    },
};

// Middleware to validate subscription or trial
const subscriptionMiddleware = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            console.error('User not found for ID:', req.user.id);
            return res.status(404).json({ message: 'User not found' });
        }

        req.subscriptionActive = user.subscriptionActive;
        req.remainingTime = 0;

        if (user.subscriptionActive) {
            console.log('User has an active subscription.');
            return next();
        }

        const trialStartTime = new Date(user.trialStartTime).getTime();
        const trialDuration = 60 * 60 * 1000; // 1 hour in milliseconds
        const now = Date.now();
        const trialEndTime = trialStartTime + trialDuration;

        if (now > trialEndTime) {
            console.log('Trial expired for user:', user.email);
            return res.status(403).json({ message: 'Trial expired. Please subscribe.' });
        }

        req.remainingTime = trialEndTime - now;
        next();
    } catch (err) {
        console.error('Error in subscriptionMiddleware:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Fetch chapters for a specific subject
router.get('/:subject', authMiddleware, subscriptionMiddleware, (req, res) => {
    const { subject } = req.params;

    console.log(`Fetching data for subject: ${subject}`);

    if (!subjectsData[subject]) {
        return res.status(404).json({ message: 'Subject not found' });
    }

    const subjectData = subjectsData[subject];
    res.json({
        subscriptionActive: req.subscriptionActive || false,
        remainingTime: req.remainingTime || 0,
        subjectData,
    });
});

// Fetch questions for a specific chapter
router.get('/:subject/:chapter/questions', authMiddleware, subscriptionMiddleware, async (req, res) => {
    try {
        const { subject, chapter } = req.params;

        console.log(`Fetching questions for subject: ${subject}, chapter: ${chapter}`);
        const questions = await Question.find({ chapter });

        if (!questions || questions.length === 0) {
            return res.status(404).json({ message: `No questions found for subject: ${subject}, chapter: ${chapter}` });
        }

        res.json(questions);
    } catch (err) {
        console.error('Error fetching questions:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add a question
router.post('/:subject/:chapter/add-question', authMiddleware, adminMiddleware, async (req, res) => {
    const { subject, chapter } = req.params;
    const { question, answer } = req.body;

    if (!question || !answer) {
        return res.status(400).json({ message: 'Question and answer are required.' });
    }

    try {
        const newQuestion = new Question({ subject, chapter, question, answer });
        await newQuestion.save();
        res.status(201).json({ message: 'Question added successfully', question: newQuestion });
    } catch (err) {
        console.error('Error adding question:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a question
router.delete('/:subject/:chapter/:id/delete-question', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const question = await Question.findByIdAndDelete(id);

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        res.status(200).json({ message: 'Question deleted successfully' });
    } catch (err) {
        console.error('Error deleting question:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a question
router.put('/:subject/:chapter/:id/update-question', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { question, answer } = req.body;

        if (!question || !answer) {
            return res.status(400).json({ message: 'Question and answer are required' });
        }

        const updatedQuestion = await Question.findByIdAndUpdate(
            id,
            { question, answer },
            { new: true }
        );

        if (!updatedQuestion) {
            return res.status(404).json({ message: 'Question not found' });
        }

        res.status(200).json({ message: 'Question updated successfully', updatedQuestion });
    } catch (err) {
        console.error('Error updating question:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
