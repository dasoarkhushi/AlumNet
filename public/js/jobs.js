const API_URL = '/api';

// Get authorization header
const getAuthHeader = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

// Get all jobs
export const getAllJobs = async () => {
  try {
    const response = await fetch(`${API_URL}/jobs`, {
      headers: getAuthHeader(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    return data;
  } catch (error) {
    console.error('Get jobs error:', error);
    throw error;
  }
};

// Create new job
export const createJob = async (jobData) => {
  try {
    const response = await fetch(`${API_URL}/jobs`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(jobData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    
    // Update UI immediately
    displayJob(data.data);
    return data;
  } catch (error) {
    console.error('Create job error:', error);
    throw error;
  }
};

// Delete job
export const deleteJob = async (jobId) => {
  try {
    const response = await fetch(`${API_URL}/jobs/${jobId}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message);
    }

    // Remove job from UI
    document.getElementById(`job-${jobId}`).remove();
  } catch (error) {
    console.error('Delete job error:', error);
    throw error;
  }
};

// Display job in UI
const displayJob = (job) => {
  const jobsContainer = document.getElementById('jobs-container');
  const jobElement = document.createElement('div');
  jobElement.id = `job-${job._id}`;
  jobElement.className = 'card job-card';
  
  jobElement.innerHTML = `
    <h3 class="job-title">${job.title}</h3>
    <p class="company">${job.company}</p>
    <p class="location">${job.location}</p>
    <p class="type">${job.type}</p>
    <p class="description">${job.description}</p>
    ${job.postedBy._id === JSON.parse(localStorage.getItem('user'))._id ? 
      `<button class="btn btn-outline delete-job" data-id="${job._id}">Delete</button>` : ''}
  `;

  jobsContainer.prepend(jobElement);
};

// Initialize jobs page
document.addEventListener('DOMContentLoaded', async () => {
  const { isAuthenticated, user } = checkAuth();
  if (!isAuthenticated) {
    alert('Please log in to view jobs');
    window.location.href = '/login.html';
    return;
  }

  try {
    const jobsData = await getAllJobs();
    const jobsContainer = document.getElementById('jobs-container');
    jobsContainer.innerHTML = '';
    jobsData.data.forEach(displayJob);

    // Job form handler
    const jobForm = document.getElementById('job-form');
    if (jobForm) {
      jobForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const jobData = {
          title: document.getElementById('title').value,
          company: document.getElementById('company').value,
          location: document.getElementById('location').value,
          type: document.getElementById('type').value,
          description: document.getElementById('description').value,
        };
        try {
          await createJob(jobData);
          jobForm.reset();
          alert('Job posted successfully!');
        } catch (error) {
          alert('Error posting job: ' + error.message);
        }
      });
    }

    // Delete job handlers
    jobsContainer.addEventListener('click', async (e) => {
      if (e.target.classList.contains('delete-job')) {
        const jobId = e.target.dataset.id;
        if (confirm('Are you sure you want to delete this job?')) {
          try {
            await deleteJob(jobId);
          } catch (error) {
            alert('Error deleting job: ' + error.message);
          }
        }
      }
    });
  } catch (error) {
    console.error('Error initializing jobs page:', error);
  }
});

// Function to check if the user is authenticated
const checkAuth = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    return { isAuthenticated: false, user: null };
  }

  try {
    // Decode the JWT token payload
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Check if the token has expired
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token'); // Remove expired token
      return { isAuthenticated: false, user: null };
    }

    // Return user information if token is valid
    return { isAuthenticated: true, user: payload };
  } catch (error) {
    console.error('Error decoding token:', error);
    localStorage.removeItem('token'); // Remove invalid token
    return { isAuthenticated: false, user: null };
  }
};
