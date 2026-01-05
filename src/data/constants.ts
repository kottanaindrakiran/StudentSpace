// Utility data and functions - no mock data

export const branches = ['CSE', 'ECE', 'EEE', 'Civil', 'Mechanical', 'Other'];

export const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear + 4; i >= currentYear - 10; i--) {
    years.push(i);
  }
  return years;
};

export const postCategories = [
  { id: 'academic', label: 'Academic', icon: '📚' },
  { id: 'event', label: 'Event', icon: '🎉' },
  { id: 'campus-life', label: 'Campus Life', icon: '🏫' },
  { id: 'project', label: 'Project', icon: '💻' },
  { id: 'alumni', label: 'Alumni / Old Student', icon: '🎓' },
  { id: 'college-days', label: 'College Days', icon: '📸' },
  { id: 'career-updates', label: 'Career Updates', icon: '🚀' },
  { id: 'mentorship', label: 'Mentorship', icon: '🤝' },
];

export const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh",
  "Lakshadweep", "Puducherry"
];
