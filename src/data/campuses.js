export const CAMPUSES = [
  {
    id: 'cgc-landran',
    name: 'CGC Landran',
    fullName: 'Chandigarh Group of Colleges, Landran',
    shortName: 'CGC',
    color: '#ffffff',
    location: 'Landran, Mohali',
    online: 0,
  },
  {
    id: 'chandigarh-campus',
    name: 'Chandigarh Campus',
    fullName: 'Chandigarh Campus',
    shortName: 'CHD',
    color: '#d4d4d4',
    location: 'Chandigarh',
    online: 0,
  },
  {
    id: 'chitkara',
    name: 'Chitkara University',
    fullName: 'Chitkara University, Punjab',
    shortName: 'CU',
    color: '#a3a3a3',
    location: 'Rajpura, Punjab',
    online: 0,
  },
  {
    id: 'chandigarh-university',
    name: 'Chandigarh University',
    fullName: 'Chandigarh University, Gharuan',
    shortName: 'CU',
    color: '#737373',
    location: 'Gharuan, Mohali',
    online: 0,
  },
  {
    id: 'lpu',
    name: 'LPU',
    fullName: 'Lovely Professional University',
    shortName: 'LPU',
    color: '#525252',
    location: 'Phagwara, Punjab',
    online: 0,
  },
  {
    id: 'thapar',
    name: 'Thapar University',
    fullName: 'Thapar Institute of Engineering & Technology',
    shortName: 'TIET',
    color: '#ffffff',
    location: 'Patiala, Punjab',
    online: 0,
  },
  {
    id: 'pec',
    name: 'PEC Chandigarh',
    fullName: 'Punjab Engineering College',
    shortName: 'PEC',
    color: '#d4d4d4',
    location: 'Chandigarh',
    online: 0,
  },
  {
    id: 'uiet',
    name: 'UIET Chandigarh',
    fullName: 'University Institute of Engineering & Technology',
    shortName: 'UIET',
    color: '#a3a3a3',
    location: 'Chandigarh',
    online: 0,
  },
]

export function getCampusById(id) {
  return CAMPUSES.find(c => c.id === id) || CAMPUSES[0]
}

export function generateUserId() {
  return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
}

export function generateDisplayName() {
  const adjectives = ['Chill', 'Epic', 'Vibing', 'Cool', 'Dope', 'Lit', 'Fresh', 'Rad', 'Stellar', 'Bold']
  const nouns = ['Coder', 'Hacker', 'Gamer', 'Artist', 'Thinker', 'Dreamer', 'Explorer', 'Creator', 'Rebel', 'Wizard']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 99) + 1
  return `${adj}${noun}${num}`
}
