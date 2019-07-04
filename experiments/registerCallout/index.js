export default {
  name: 'register-form',
  experimentID: 'aG4JuellQJOj3rssKR716g',
  isEligible: ({ route }) => route.path.includes('register'),
  variants: [
    { name: 'original', weight: 9 },
    { name: 'alternative', weight: 1 },
  ],
};
