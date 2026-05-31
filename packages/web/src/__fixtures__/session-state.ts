/**
 * Fixtures for different session states to facilitate testing and development.
 */
import { ClientSessionState } from '@/context/SessionContext';

/**
 * Fixture for a session in the discovery phase with 1 turns completed and no synthesis ready.
 */
export const discoverySessionStateFixture: ClientSessionState = {
  sessionId: 'session-123',
  phase: 'discovery',
  turnCount: 1,
  synthesisReady: false,
  messages: [
    {
      role: 'user',
      content: 'I want to transition into a new career.',
    },
    {
      role: 'assistant',
      content: 'Great! Can you tell me more about your current skills and interests?',
    },
  ],
  recommendation: null,
};

/**
 * Fixture for a session in the goal elicitation phase with 2 turns completed and synthesis ready.
 */
export const goalElicitationSessionStateFixture: ClientSessionState = {
  sessionId: 'session-456',
  phase: 'goalElicitation',
  turnCount: 4,
  synthesisReady: true,
  messages: [
    {
      role: 'user',
      content: 'I want to transition into a new career.',
    },
    {
      role: 'assistant',
      content: 'Great! Can you tell me more about your current skills and interests?',
    },
    {
      role: 'user',
      content: "I have experience in project management and I'm interested in data science.",
    },
    {
      role: 'assistant',
      content:
        "Thanks for sharing! It sounds like you have strong organizational skills and an interest in analytics. Let's see what recommendations we can generate for you.",
    },
    {
      role: 'user',
      content:
        "I would like to transition within the next 6 months and I'm open to roles that leverage my project management experience while allowing me to develop data science skills.",
    },
    {
      role: 'assistant',
      content:
        'Thanks for providing that additional context! With your project management background and interest in data science, we can generate some personalized recommendations for career paths, skill development, and resources to help you achieve your goals within your desired timeline.',
    },
    {
      role: 'user',
      content:
        "I have already started learning Python and SQL, but I want to make sure I'm on the right track. What should I focus on next?",
    },
    {
      role: 'assistant',
      content:
        'It’s great that you’ve started learning Python and SQL! To further enhance your data science skills, I recommend focusing on the following areas: 1) Data Analysis: Develop your ability to manipulate and analyze data using libraries like Pandas and NumPy. 2) Machine Learning: Gain a foundational understanding of machine learning concepts and algorithms, and practice implementing them using libraries like scikit-learn. 3) Data Visualization: Learn how to create compelling visualizations using tools like Matplotlib and Seaborn to effectively communicate insights from data.',
    },
  ],
  recommendation: null,
};

/**
 * Fixture for a session in the synthesis phase with 4 turns completed, synthesis ready, and a generated recommendation.
 */
export const synthesisSessionStateFixture: ClientSessionState = {
  sessionId: 'session-789',
  phase: 'synthesis',
  turnCount: 4,
  synthesisReady: true,
  messages: [
    {
      role: 'user',
      content: 'I want to transition into a new career.',
    },
    {
      role: 'assistant',
      content: 'Great! **Can you tell me more about your current skills and interests?**',
    },
    {
      role: 'user',
      content: "I have experience in project management and I'm interested in data science.",
    },
    {
      role: 'assistant',
      content:
        'Thanks for sharing! It sounds like you have strong organizational skills and an interest in analytics. **What are your career goals and timeline for making a transition?**',
    },
    {
      role: 'user',
      content:
        "I'd like to transition within the next 6 months and I'm open to roles that leverage my project management experience while allowing me to develop data science skills.",
    },
    {
      role: 'assistant',
      content:
        'Thanks for providing that additional context! With your project management background and interest in data science, we can generate some personalized recommendations for career paths, skill development, and resources to help you achieve your goals within your desired timeline.',
    },
    {
      role: 'user',
      content: "I'm ready for recommendations.",
    },
    {
      role: 'assistant',
      content:
        'Based on your background, here are some career paths you might consider: 1) Data Analyst, 2) Business Intelligence Analyst, 3) Data Science Project Manager.',
    },
  ],
  recommendation: {
    profileSummary:
      'Experienced project manager transitioning to data science with strong organizational skills and interest in analytics.',
    skillGaps: [
      {
        name: 'Data Analysis',
        severity: 'high',
        rationale:
          'While you have strong project management skills, you may need to develop technical data analysis skills to succeed in a data science role.',
      },
      {
        name: 'Machine Learning',
        severity: 'medium',
        rationale:
          'Having a foundational understanding of machine learning concepts will enhance your ability to work with data and build predictive models, which are key skills in data science.',
      },
    ],
    recommendations: [
      {
        area: 'Data Analysis',
        rationale:
          'Developing data analysis skills will be crucial for transitioning into a data science role. Focus on learning tools like Excel, SQL, and Python for data manipulation and analysis.',
        resourceCategories: ['Online Courses', 'Books', 'Practice Projects'],
        estimatedEffort: 'moderate',
        estimatedTimeline: '2-3 months',
      },
      {
        area: 'Machine Learning',
        rationale:
          'Gaining a foundational understanding of machine learning concepts will enhance your ability to work with data and build predictive models, which are key skills in data science.',
        resourceCategories: ['Online Courses', 'Workshops', 'Practice Projects'],
        estimatedEffort: 'substantial',
        estimatedTimeline: '3-6 months',
      },
    ],
  },
};
