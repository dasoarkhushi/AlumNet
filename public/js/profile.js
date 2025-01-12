const API_URL = '/api/profile';

export const updateProfile = async (profileData) => {
  console.log('Sending profile data:', profileData);
  try {
    const response = await fetch(`${API_URL}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    const user = JSON.parse(localStorage.getItem('user'));
    const updatedUser = { ...user, ...profileData };
    localStorage.setItem('user', JSON.stringify(updatedUser));

    return data;
  } catch (error) {
    console.error('Profile update error:', error.message);
    throw error;
  }
};

export const searchUsers = async (searchParams) => {
  try {
    const queryString = new URLSearchParams(searchParams).toString();
    const response = await fetch(`${API_URL}/users/search?${queryString}`);
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    return data;
  } catch (error) {
    console.error('User search error:', error);
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const response = await fetch(`${API_URL}`);
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    localStorage.setItem('user', JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

// Display registered events in the profile page
const displayRegisteredEvents = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const eventsList = document.getElementById('events-list');
  eventsList.innerHTML = ''; // Clear existing content

  if (!user || !user.registeredEvents || user.registeredEvents.length === 0) {
    eventsList.innerHTML = '<p>No registered events.</p>';
    return;
  }

  // Create event elements dynamically
  user.registeredEvents.forEach(event => {
    const eventElement = document.createElement('div');
    eventElement.className = 'event-item';
    eventElement.innerHTML = `
      <h4>${event.title}</h4>
      <p>${new Date(event.date).toLocaleString()}</p>
      <p>${event.location}</p>
    `;
    eventsList.appendChild(eventElement);
  });
};

const displayProfileData = async () => {
  try {
    const profileData = await getUserProfile();
    document.getElementById('profile-name').innerText = profileData.name || 'Your Name';
    document.getElementById('profile-title').innerText = profileData.currentPosition || 'Your Position';
    
    document.getElementById('name').value = profileData.name || '';
    document.getElementById('graduationYear').value = profileData.graduationYear || '';
    document.getElementById('degree').value = profileData.degree || '';
    document.getElementById('major').value = profileData.major || '';
    document.getElementById('currentPosition').value = profileData.currentPosition || '';
    document.getElementById('company').value = profileData.company || '';
    document.getElementById('bio').value = profileData.bio || '';
  } catch (error) {
    console.error('Error loading profile data:', error);
  }
};

// Call this function when the profile page loads
document.addEventListener('DOMContentLoaded', () => {
  displayProfileData();
  displayRegisteredEvents();
});