// Indian states with coordinates for Leaflet map
export const INDIAN_STATES = [
  { name: 'Andhra Pradesh',        code: 'AP', lat: 15.9129,  lng: 79.7400,  zoom: 7 },
  { name: 'Arunachal Pradesh',     code: 'AR', lat: 28.2180,  lng: 94.7278,  zoom: 7 },
  { name: 'Assam',                 code: 'AS', lat: 26.2006,  lng: 92.9376,  zoom: 7 },
  { name: 'Bihar',                 code: 'BR', lat: 25.0961,  lng: 85.3131,  zoom: 7 },
  { name: 'Chhattisgarh',          code: 'CG', lat: 21.2787,  lng: 81.8661,  zoom: 7 },
  { name: 'Goa',                   code: 'GA', lat: 15.2993,  lng: 74.1240,  zoom: 9 },
  { name: 'Gujarat',               code: 'GJ', lat: 22.2587,  lng: 71.1924,  zoom: 7 },
  { name: 'Haryana',               code: 'HR', lat: 29.0588,  lng: 76.0856,  zoom: 8 },
  { name: 'Himachal Pradesh',      code: 'HP', lat: 31.1048,  lng: 77.1734,  zoom: 8 },
  { name: 'Jharkhand',             code: 'JH', lat: 23.6102,  lng: 85.2799,  zoom: 7 },
  { name: 'Karnataka',             code: 'KA', lat: 15.3173,  lng: 75.7139,  zoom: 7 },
  { name: 'Kerala',                code: 'KL', lat: 10.8505,  lng: 76.2711,  zoom: 8 },
  { name: 'Madhya Pradesh',        code: 'MP', lat: 22.9734,  lng: 78.6569,  zoom: 7 },
  { name: 'Maharashtra',           code: 'MH', lat: 19.7515,  lng: 75.7139,  zoom: 7 },
  { name: 'Manipur',               code: 'MN', lat: 24.6637,  lng: 93.9063,  zoom: 8 },
  { name: 'Meghalaya',             code: 'ML', lat: 25.4670,  lng: 91.3662,  zoom: 8 },
  { name: 'Mizoram',               code: 'MZ', lat: 23.1645,  lng: 92.9376,  zoom: 8 },
  { name: 'Nagaland',              code: 'NL', lat: 26.1584,  lng: 94.5624,  zoom: 8 },
  { name: 'Odisha',                code: 'OD', lat: 20.9517,  lng: 85.0985,  zoom: 7 },
  { name: 'Punjab',                code: 'PB', lat: 31.1471,  lng: 75.3412,  zoom: 8 },
  { name: 'Rajasthan',             code: 'RJ', lat: 27.0238,  lng: 74.2179,  zoom: 7 },
  { name: 'Sikkim',                code: 'SK', lat: 27.5330,  lng: 88.5122,  zoom: 9 },
  { name: 'Tamil Nadu',            code: 'TN', lat: 11.1271,  lng: 78.6569,  zoom: 7 },
  { name: 'Telangana',             code: 'TS', lat: 18.1124,  lng: 79.0193,  zoom: 7 },
  { name: 'Tripura',               code: 'TR', lat: 23.9408,  lng: 91.9882,  zoom: 9 },
  { name: 'Uttar Pradesh',         code: 'UP', lat: 26.8467,  lng: 80.9462,  zoom: 7 },
  { name: 'Uttarakhand',           code: 'UK', lat: 30.0668,  lng: 79.0193,  zoom: 8 },
  { name: 'West Bengal',           code: 'WB', lat: 22.9868,  lng: 87.8550,  zoom: 7 },
  { name: 'Delhi',                 code: 'DL', lat: 28.7041,  lng: 77.1025,  zoom: 10 },
  { name: 'Jammu and Kashmir',     code: 'JK', lat: 33.7782,  lng: 76.5762,  zoom: 7 },
  { name: 'Ladakh',                code: 'LA', lat: 34.1526,  lng: 77.5770,  zoom: 7 },
];

export const STATE_STORIES = {
  'Rajasthan':    { color: '#D4660A', famous: ['Bhangarh Fort', 'Kuldhara Ghost Village', 'Rana Sanga Spirit'] },
  'West Bengal':  { color: '#8B1A1A', famous: ['Rabindranath\'s Ghost', 'Sundarbans Spirits', 'Medinipur Witch Tales'] },
  'Kerala':       { color: '#1E8449', famous: ['Padmanabhaswamy Vault', 'Kodungallur Kali', 'Theyyam Spirits'] },
  'Karnataka':    { color: '#4A0E8F', famous: ['Nale Ba Legend', 'Hampi Spirits', 'Murudeshwara Demons'] },
  'Nagaland':     { color: '#5D4E37', famous: ['Naga Serpent Ancestors', 'Morung Spirits', 'Warrior Ghosts'] },
  'Madhya Pradesh': { color: '#B78C3E', famous: ['Vetala of Ujjain', 'Orchha Ghost', 'Khajuraho Spirits'] },
};

export const getStateColor = (stateName) => {
  return STATE_STORIES[stateName]?.color || '#B78C3E';
};
