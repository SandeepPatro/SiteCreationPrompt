import type { Question } from '../../shared/questionSchema';
import type { ProjectType } from '../../shared/step1Schema';

/*
 * Built-in follow-up questions used when the AI can't be reached (error, timeout, rate limit).
 * Edit freely: each list must have 3–6 questions with unique snake_case ids
 * (tests/unit/fallbackQuestions.test.ts checks every list against the shared Question schema).
 */

const userAccounts: Question = {
  id: 'user_accounts',
  type: 'select',
  label: 'Do people need to sign in?',
  help: 'Accounts let users keep their own data, but add work (passwords, security, email).',
  options: [
    'No sign-in needed',
    'Email and password',
    'Sign in with Google/GitHub etc.',
    'Not sure',
  ],
};

const savesData: Question = {
  id: 'saves_data',
  type: 'boolean',
  label: 'Does it need to remember data between visits?',
  help: 'For example saved items, settings or user-created content. This decides whether you need a database.',
};

const deadline: Question = {
  id: 'first_version_deadline',
  type: 'select',
  label: 'When do you want a first working version?',
  help: 'Helps the AI agent decide how much to build now versus later.',
  options: ['This week', 'This month', 'Within 3 months', 'No deadline'],
};

const integrations: Question = {
  id: 'integrations',
  type: 'textarea',
  label: 'Does it need to connect to other services?',
  help: 'For example payments (Stripe), email sending, maps, or another app’s API.',
};

const BY_TYPE: Record<ProjectType, Question[]> = {
  web: [
    userAccounts,
    savesData,
    {
      id: 'devices',
      type: 'multiselect',
      label: 'Which devices should it work well on?',
      options: ['Desktop browsers', 'Phone browsers', 'Tablets'],
    },
    {
      id: 'design_references',
      type: 'textarea',
      label: 'Any websites or apps whose look and feel you like?',
      help: 'Links or names are enough. This gives the agent a visual direction.',
    },
    integrations,
    deadline,
  ],
  mobile: [
    {
      id: 'platforms',
      type: 'multiselect',
      label: 'Which phones should it run on?',
      options: ['iPhone (iOS)', 'Android'],
    },
    userAccounts,
    {
      id: 'works_offline',
      type: 'boolean',
      label: 'Should it work without an internet connection?',
      help: 'Offline support is useful but adds complexity (syncing data later).',
    },
    {
      id: 'push_notifications',
      type: 'boolean',
      label: 'Does it need push notifications?',
    },
    {
      id: 'app_store',
      type: 'select',
      label: 'Do you plan to publish it in the app stores?',
      options: ['Yes, publicly', 'Only for testers at first', 'Not sure yet'],
    },
    deadline,
  ],
  api: [
    {
      id: 'api_consumers',
      type: 'multiselect',
      label: 'Who will call this API?',
      options: ['Our own web app', 'Our own mobile app', 'Other developers', 'Internal services'],
    },
    {
      id: 'api_auth',
      type: 'select',
      label: 'How should callers prove who they are?',
      help: 'Authentication protects your data from unknown callers.',
      options: ['No authentication', 'API keys', 'User login tokens (OAuth/JWT)', 'Not sure'],
    },
    {
      id: 'data_store',
      type: 'select',
      label: 'What kind of data will it store?',
      options: ['Structured records (tables)', 'Flexible documents', 'Files or media', 'Not sure'],
    },
    {
      id: 'expected_traffic',
      type: 'select',
      label: 'Roughly how much traffic do you expect at first?',
      options: ['Just me / testing', 'Hundreds of requests a day', 'Thousands or more a day'],
    },
    integrations,
    deadline,
  ],
  desktop: [
    {
      id: 'operating_systems',
      type: 'multiselect',
      label: 'Which operating systems should it run on?',
      options: ['Windows', 'macOS', 'Linux'],
    },
    {
      id: 'data_location',
      type: 'select',
      label: 'Where should user data live?',
      options: ['Only on the computer', 'Synced to the cloud', 'Not sure'],
    },
    {
      id: 'auto_update',
      type: 'boolean',
      label: 'Should the app update itself automatically?',
    },
    {
      id: 'distribution',
      type: 'select',
      label: 'How will people install it?',
      options: [
        'Download from a website',
        'App store (Microsoft/Mac)',
        'Internal use only',
        'Not sure',
      ],
    },
    deadline,
  ],
  cli: [
    {
      id: 'operating_systems',
      type: 'multiselect',
      label: 'Which operating systems should it run on?',
      options: ['Windows', 'macOS', 'Linux'],
    },
    {
      id: 'distribution',
      type: 'select',
      label: 'How should people install it?',
      options: ['npm', 'pip', 'Homebrew', 'Single downloadable file', 'Not sure'],
    },
    {
      id: 'output_format',
      type: 'multiselect',
      label: 'What output should it produce?',
      options: ['Human-readable text', 'JSON for scripts', 'Tables', 'Files'],
    },
    {
      id: 'example_usage',
      type: 'textarea',
      label: 'Show an example command you’d like to run',
      help: 'For example: mytool convert input.csv --to json',
    },
    deadline,
  ],
  extension: [
    {
      id: 'browsers',
      type: 'multiselect',
      label: 'Which browsers should it support?',
      options: ['Chrome', 'Firefox', 'Edge', 'Safari'],
    },
    {
      id: 'site_access',
      type: 'textarea',
      label: 'Which websites or browser data does it need to access?',
      help: 'Extensions must ask for permissions; fewer permissions means easier store approval.',
    },
    {
      id: 'needs_server',
      type: 'boolean',
      label: 'Does it need its own server or online account?',
    },
    {
      id: 'store_listing',
      type: 'select',
      label: 'Will you publish it in the browser’s extension store?',
      options: ['Yes, publicly', 'Unlisted / private', 'Not sure'],
    },
    deadline,
  ],
  other: [
    {
      id: 'platform',
      type: 'text',
      label: 'Where will it run?',
      help: 'For example a smartwatch, a game engine, a spreadsheet, a microcontroller…',
    },
    userAccounts,
    savesData,
    integrations,
    deadline,
  ],
};

export function selectFallbackQuestions(projectType: ProjectType): Question[] {
  return BY_TYPE[projectType];
}
