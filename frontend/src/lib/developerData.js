/**
 * Developer profile data for the landing page "Meet the Developer" section.
 * Kept in a single module so content can be edited without touching components.
 *
 * @typedef {Object} SocialLink
 * @property {string} label      - Short identifier used as React key.
 * @property {string} href       - Fully-qualified URL (or mailto:).
 * @property {string} iconName   - lucide-react icon name.
 * @property {string} ariaLabel  - Accessible label for screen readers.
 */

/** @type {SocialLink[]} */
const socialLinks = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/kobkoon-janngam-10ba81329/',
    iconName: 'Linkedin',
    ariaLabel: 'Kobkoon Janngam on LinkedIn',
  },
  {
    label: 'Scopus',
    href: 'https://www.scopus.com/authid/detail.uri?authorId=57226162122',
    iconName: 'BookMarked',
    ariaLabel: 'Kobkoon Janngam on Scopus',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/ol_zxcv',
    iconName: 'Instagram',
    ariaLabel: 'Kobkoon Janngam on Instagram',
  },
  {
    label: 'Email',
    href: 'mailto:kobkoon.j@cmu.ac.th',
    iconName: 'AtSign',
    ariaLabel: 'Email Kobkoon Janngam',
  },
  {
    label: 'Portfolio',
    href: 'https://personal-portfolio-pi-murex-30.vercel.app/',
    iconName: 'Globe',
    ariaLabel: 'Personal portfolio website',
  },
]

export const DEVELOPER_PROFILE = Object.freeze({
  initials: 'KJ',
  name: 'Dr. Kobkoon Janngam',
  role: 'Proactive Researcher',
  affiliation: 'Chiang Mai University',
  bio: 'Bridging mathematics and machine learning to create accessible research tools for the academic community.',
  avatarGradient: 'linear-gradient(135deg, #6366F1, #06B6D4)',
  socialLinks,
})
