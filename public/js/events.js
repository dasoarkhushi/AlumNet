const API_URL = '/api';

// Get authorization header
const getAuthHeader = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

// Get all events
export const getAllEvents = async () => {
  try {
    const response = await fetch(`${API_URL}/events`, {
      headers: getAuthHeader(),
    });
    const data = await response.json();
    const token = data.token;
    localStorage.setItem('token', token);
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    console.error('Get events error:', error);
    throw error;
  }
};

// Create new event
export const createEvent = async (eventData) => {
  try {
    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(eventData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    
    // Update UI immediately
    displayEvent(data.data);
    return data;
  } catch (error) {
    console.error('Create event error:', error);
    throw error;
  }
};

// Register for event
export const registerForEvent = async (eventId) => {
  try {
    const response = await fetch(`${API_URL}/events/${eventId}/register`, {
      method: 'POST',
      headers: getAuthHeader(),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    // Update localStorage with the new registered event
    const user = JSON.parse(localStorage.getItem('user')) || {};
    user.registeredEvents = user.registeredEvents ? [...user.registeredEvents, data.event] : [data.event];
    localStorage.setItem('user', JSON.stringify(user));
    
    // Update UI to show registration
    updateEventRegistration(eventId, true);
    return data;
  } catch (error) {
    console.error('Event registration error:', error);
    throw error;
  }
};

// Display event in UI
const displayEvent = (event) => {
  const eventsContainer = document.getElementById('events-container');
  const eventElement = document.createElement('div');
  eventElement.id = `event-${event._id}`;
  eventElement.className = 'card event-card';
  
  const eventDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  eventElement.innerHTML = `
    <div class="event-date">${eventDate}</div>
    <h3>${event.title}</h3>
    <p class="location"><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
    <p class="description">${event.description}</p>
    <p class="organizer">Organized by: ${event.organizer.name}</p>
    <button class="btn btn-primary register-event" data-id="${event._id}">
      ${event.attendees.includes(JSON.parse(localStorage.getItem('user'))._id) ? 
        'Registered' : 'Register'}
    </button>
  `;

  eventsContainer.prepend(eventElement);
};

// Update event registration UI
const updateEventRegistration = (eventId, isRegistered) => {
  const registerButton = document.querySelector(`#event-${eventId} .register-event`);
  if (registerButton) {
    registerButton.textContent = isRegistered ? 'Registered' : 'Register';
    registerButton.disabled = isRegistered;
  }
};

// Initialize events page
document.addEventListener('DOMContentLoaded', async () => {
  const { isAuthenticated, user } = checkAuth();
  if (!isAuthenticated) {
    alert('Please log in to view events');
    window.location.href = '/login.html';
    return;
  }

  try {
    const eventsData = await getAllEvents();
    const eventsContainer = document.getElementById('events-container');
    eventsContainer.innerHTML = '';
    eventsData.data.forEach(displayEvent);

    // Event form handler
    const eventForm = document.getElementById('event-form');
    if (eventForm) {
      eventForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const eventData = {
          title: document.getElementById('title').value,
          date: document.getElementById('date').value,
          location: document.getElementById('location').value,
          description: document.getElementById('description').value,
        };
        try {
          await createEvent(eventData);
          eventForm.reset();
          alert('Event created successfully!');
        } catch (error) {
          alert('Error creating event: ' + error.message);
        }
      });
    }

    // Event registration handlers
    eventsContainer.addEventListener('click', async (e) => {
      if (e.target.classList.contains('register-event') && !e.target.disabled) {
        const eventId = e.target.dataset.id;
        try {
          await registerForEvent(eventId);
          alert('Successfully registered for event!');
        } catch (error) {
          alert('Error registering for event: ' + error.message);
        }
      }
    });
  } catch (error) {
    console.error('Error initializing events page:', error);
  }
});

// Function to check if the user is authenticated
const checkAuth = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    return { isAuthenticated: false, user: null };
  }

  try {
    // Decode token payload (JWT tokens are base64 encoded)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Check token expiration
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token'); // Remove expired token
      return { isAuthenticated: false, user: null };
    }

    // Return user data
    return { isAuthenticated: true, user: payload };
  } catch (error) {
    console.error('Error decoding token:', error);
    localStorage.removeItem('token'); // Remove invalid token
    return { isAuthenticated: false, user: null };
  }
};
