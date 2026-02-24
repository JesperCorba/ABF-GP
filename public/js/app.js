// Global state
let currentUser = null;
let currentPage = 'home';

// F1 Drivers for 2024 season
const F1_DRIVERS = [
  'Max Verstappen',
  'Sergio Perez',
  'Lewis Hamilton',
  'George Russell',
  'Charles Leclerc',
  'Carlos Sainz',
  'Lando Norris',
  'Oscar Piastri',
  'Fernando Alonso',
  'Lance Stroll',
  'Pierre Gasly',
  'Esteban Ocon',
  'Alexander Albon',
  'Logan Sargeant',
  'Valtteri Bottas',
  'Zhou Guanyu',
  'Kevin Magnussen',
  'Nico Hulkenberg',
  'Yuki Tsunoda',
  'Daniel Ricciardo'
];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupNavigation();
});

// Check authentication
async function checkAuth() {
  try {
    const response = await fetch('/api/auth/me');
    if (response.ok) {
      const data = await response.json();
      currentUser = data;
      renderNav();
      showPage('home');
    } else {
      currentUser = null;
      renderNav();
      showPage('login');
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    currentUser = null;
    renderNav();
    showPage('login');
  }
}

// Render navigation
function renderNav() {
  const nav = document.getElementById('nav');
  
  if (currentUser) {
    nav.innerHTML = `
      <span class="user-info">👤 ${currentUser.username}</span>
      <a href="#" onclick="showPage('home')">Home</a>
      <a href="#" onclick="showPage('predictions')">My Predictions</a>
      <a href="#" onclick="showPage('leaderboard')">Leaderboard</a>
      ${currentUser.is_admin ? '<a href="#" onclick="showPage(\'admin\')">Admin</a>' : ''}
      <button onclick="logout()">Logout</button>
    `;
  } else {
    nav.innerHTML = `
      <a href="#" onclick="showPage('login')">Login</a>
      <a href="#" onclick="showPage('register')">Register</a>
    `;
  }
}

// Setup navigation
function setupNavigation() {
  window.addEventListener('hashchange', () => {
    const page = window.location.hash.slice(1) || 'home';
    showPage(page);
  });
}

// Show page
function showPage(page) {
  currentPage = page;
  const app = document.getElementById('app');
  
  if (!currentUser && page !== 'login' && page !== 'register') {
    page = 'login';
  }
  
  switch (page) {
    case 'login':
      renderLoginPage(app);
      break;
    case 'register':
      renderRegisterPage(app);
      break;
    case 'home':
      renderHomePage(app);
      break;
    case 'predictions':
      renderPredictionsPage(app);
      break;
    case 'leaderboard':
      renderLeaderboardPage(app);
      break;
    case 'admin':
      if (currentUser && currentUser.is_admin) {
        renderAdminPage(app);
      } else {
        renderHomePage(app);
      }
      break;
    default:
      renderHomePage(app);
  }
}

// Login page
function renderLoginPage(app) {
  app.innerHTML = `
    <div class="auth-container">
      <div class="card">
        <h2>Login</h2>
        <div id="loginMessage"></div>
        <form onsubmit="handleLogin(event)">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" required>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%">Login</button>
        </form>
        <div class="auth-toggle">
          <p>Don't have an account? <a href="#" onclick="showPage('register')">Register</a></p>
        </div>
      </div>
    </div>
  `;
}

// Handle login
async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentUser = data;
      renderNav();
      showPage('home');
    } else {
      showMessage('loginMessage', data.error, 'error');
    }
  } catch (error) {
    showMessage('loginMessage', 'Login failed. Please try again.', 'error');
  }
}

// Register page
function renderRegisterPage(app) {
  app.innerHTML = `
    <div class="auth-container">
      <div class="card">
        <h2>Register</h2>
        <div id="registerMessage"></div>
        <form onsubmit="handleRegister(event)">
          <div class="form-group">
            <label for="regUsername">Username</label>
            <input type="text" id="regUsername" required>
          </div>
          <div class="form-group">
            <label for="regPassword">Password</label>
            <input type="password" id="regPassword" required minlength="6">
          </div>
          <div class="form-group">
            <label for="regPasswordConfirm">Confirm Password</label>
            <input type="password" id="regPasswordConfirm" required minlength="6">
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%">Register</button>
        </form>
        <div class="auth-toggle">
          <p>Already have an account? <a href="#" onclick="showPage('login')">Login</a></p>
        </div>
      </div>
    </div>
  `;
}

// Handle register
async function handleRegister(event) {
  event.preventDefault();
  const username = document.getElementById('regUsername').value;
  const password = document.getElementById('regPassword').value;
  const passwordConfirm = document.getElementById('regPasswordConfirm').value;
  
  if (password !== passwordConfirm) {
    showMessage('registerMessage', 'Passwords do not match', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentUser = data;
      renderNav();
      showPage('home');
    } else {
      showMessage('registerMessage', data.error, 'error');
    }
  } catch (error) {
    showMessage('registerMessage', 'Registration failed. Please try again.', 'error');
  }
}

// Logout
async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    currentUser = null;
    renderNav();
    showPage('login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

// Home page
async function renderHomePage(app) {
  app.innerHTML = '<div class="loading">Loading races...</div>';
  
  try {
    const response = await fetch('/api/races');
    const races = await response.json();
    
    app.innerHTML = `
      <div class="card">
        <h2>Upcoming Races</h2>
        <div class="race-list" id="raceList"></div>
      </div>
    `;
    
    const raceList = document.getElementById('raceList');
    
    if (races.length === 0) {
      raceList.innerHTML = '<p>No races scheduled yet.</p>';
    } else {
      races.forEach(race => {
        const raceDate = new Date(race.race_date);
        const isCompleted = race.is_completed;
        
        raceList.innerHTML += `
          <div class="race-item">
            <div class="race-info">
              <h3>${race.name}</h3>
              <p>📍 ${race.location}</p>
              <p>📅 ${raceDate.toLocaleDateString()}</p>
            </div>
            <div>
              <span class="race-status ${isCompleted ? 'completed' : 'upcoming'}">
                ${isCompleted ? '✓ Completed' : '⏰ Upcoming'}
              </span>
              ${!isCompleted ? `<button class="btn btn-primary" onclick="showPredictionForm(${race.id}, '${race.name}')" style="margin-left: 1rem">Make Prediction</button>` : ''}
            </div>
          </div>
        `;
      });
    }
  } catch (error) {
    app.innerHTML = '<div class="card"><p class="message error">Failed to load races</p></div>';
  }
}

// Show prediction form
function showPredictionForm(raceId, raceName) {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="card">
      <h2>Predict: ${raceName}</h2>
      <div id="predictionMessage"></div>
      
      <form onsubmit="submitPrediction(event, ${raceId})">
        <div class="prediction-section">
          <h3>Select Your 3 Drivers</h3>
          <p>Choose 3 drivers you think will finish in the top 3 positions.</p>
          <div class="driver-selection">
            <div class="form-group">
              <label for="driver1">Driver 1</label>
              <select id="driver1" required>
                <option value="">Select driver...</option>
                ${F1_DRIVERS.map(d => `<option value="${d}">${d}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="driver2">Driver 2</label>
              <select id="driver2" required>
                <option value="">Select driver...</option>
                ${F1_DRIVERS.map(d => `<option value="${d}">${d}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="driver3">Driver 3</label>
              <select id="driver3" required>
                <option value="">Select driver...</option>
                ${F1_DRIVERS.map(d => `<option value="${d}">${d}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
        
        <div class="prediction-section">
          <h3>Predict Top 3 Positions</h3>
          <p>Now predict which drivers will finish 1st, 2nd, and 3rd.</p>
          <div class="position-prediction">
            <div class="form-group">
              <label for="position1">🥇 1st Place</label>
              <select id="position1" required>
                <option value="">Select driver...</option>
                ${F1_DRIVERS.map(d => `<option value="${d}">${d}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="position2">🥈 2nd Place</label>
              <select id="position2" required>
                <option value="">Select driver...</option>
                ${F1_DRIVERS.map(d => `<option value="${d}">${d}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="position3">🥉 3rd Place</label>
              <select id="position3" required>
                <option value="">Select driver...</option>
                ${F1_DRIVERS.map(d => `<option value="${d}">${d}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 2rem">
          <button type="submit" class="btn btn-success">Submit Prediction</button>
          <button type="button" class="btn btn-secondary" onclick="showPage('home')">Cancel</button>
        </div>
      </form>
    </div>
  `;
}

// Submit prediction
async function submitPrediction(event, raceId) {
  event.preventDefault();
  
  const driver1 = document.getElementById('driver1').value;
  const driver2 = document.getElementById('driver2').value;
  const driver3 = document.getElementById('driver3').value;
  const position1 = document.getElementById('position1').value;
  const position2 = document.getElementById('position2').value;
  const position3 = document.getElementById('position3').value;
  
  // Validate unique drivers
  const selectedDrivers = [driver1, driver2, driver3];
  const positions = [position1, position2, position3];
  
  if (new Set(selectedDrivers).size !== 3) {
    showMessage('predictionMessage', 'Please select 3 different drivers', 'error');
    return;
  }
  
  if (new Set(positions).size !== 3) {
    showMessage('predictionMessage', 'Please select 3 different drivers for positions', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        race_id: raceId,
        driver1,
        driver2,
        driver3,
        position1,
        position2,
        position3
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showMessage('predictionMessage', 'Prediction saved successfully!', 'success');
      setTimeout(() => showPage('home'), 2000);
    } else {
      showMessage('predictionMessage', data.error, 'error');
    }
  } catch (error) {
    showMessage('predictionMessage', 'Failed to save prediction', 'error');
  }
}

// Predictions page
async function renderPredictionsPage(app) {
  app.innerHTML = '<div class="loading">Loading your predictions...</div>';
  
  try {
    const response = await fetch('/api/predictions/user');
    const predictions = await response.json();
    
    app.innerHTML = `
      <div class="card">
        <h2>My Predictions</h2>
        <div class="predictions-list" id="predictionsList"></div>
      </div>
    `;
    
    const list = document.getElementById('predictionsList');
    
    if (predictions.length === 0) {
      list.innerHTML = '<p>You haven\'t made any predictions yet.</p>';
    } else {
      predictions.forEach(pred => {
        const raceDate = new Date(pred.race_date);
        
        list.innerHTML += `
          <div class="prediction-card">
            <div style="display: flex; justify-content: space-between; align-items: center">
              <div>
                <h3>${pred.race_name}</h3>
                <p>📍 ${pred.location} | 📅 ${raceDate.toLocaleDateString()}</p>
              </div>
              ${pred.is_completed ? `<span class="points-badge">${pred.points} points</span>` : ''}
            </div>
            
            <div class="prediction-details">
              <div class="prediction-group">
                <h4>Selected Drivers</h4>
                <p>🏎️ ${pred.driver1}</p>
                <p>🏎️ ${pred.driver2}</p>
                <p>🏎️ ${pred.driver3}</p>
              </div>
              
              <div class="prediction-group">
                <h4>Position Predictions</h4>
                <p>🥇 ${pred.position1}</p>
                <p>🥈 ${pred.position2}</p>
                <p>🥉 ${pred.position3}</p>
              </div>
            </div>
          </div>
        `;
      });
    }
  } catch (error) {
    app.innerHTML = '<div class="card"><p class="message error">Failed to load predictions</p></div>';
  }
}

// Leaderboard page
async function renderLeaderboardPage(app) {
  app.innerHTML = '<div class="loading">Loading leaderboard...</div>';
  
  try {
    const response = await fetch('/api/leaderboard');
    const leaderboard = await response.json();
    
    app.innerHTML = `
      <div class="card">
        <h2>🏆 Leaderboard</h2>
        <table class="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Username</th>
              <th>Total Points</th>
              <th>Races Predicted</th>
            </tr>
          </thead>
          <tbody id="leaderboardBody"></tbody>
        </table>
      </div>
    `;
    
    const tbody = document.getElementById('leaderboardBody');
    
    if (leaderboard.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center">No data yet</td></tr>';
    } else {
      leaderboard.forEach((user, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? 'top-3' : '';
        
        tbody.innerHTML += `
          <tr>
            <td class="rank ${rankClass}">#${rank}</td>
            <td>${user.username}</td>
            <td><strong>${user.total_points || 0}</strong></td>
            <td>${user.races_predicted || 0}</td>
          </tr>
        `;
      });
    }
  } catch (error) {
    app.innerHTML = '<div class="card"><p class="message error">Failed to load leaderboard</p></div>';
  }
}

// Admin page
async function renderAdminPage(app) {
  app.innerHTML = '<div class="loading">Loading admin panel...</div>';
  
  try {
    const response = await fetch('/api/races');
    const races = await response.json();
    
    app.innerHTML = `
      <div class="card">
        <h2>Admin Panel</h2>
        
        <h3>Create New Race</h3>
        <div id="createRaceMessage"></div>
        <form onsubmit="createRace(event)">
          <div class="form-group">
            <label for="raceName">Race Name</label>
            <input type="text" id="raceName" required>
          </div>
          <div class="form-group">
            <label for="raceLocation">Location</label>
            <input type="text" id="raceLocation" required>
          </div>
          <div class="form-group">
            <label for="raceDate">Date</label>
            <input type="date" id="raceDate" required>
          </div>
          <button type="submit" class="btn btn-success">Create Race</button>
        </form>
      </div>
      
      <div class="card">
        <h3>Manage Races</h3>
        <div id="adminRaceList"></div>
      </div>
    `;
    
    const adminRaceList = document.getElementById('adminRaceList');
    
    if (races.length === 0) {
      adminRaceList.innerHTML = '<p>No races yet.</p>';
    } else {
      races.forEach(race => {
        const raceDate = new Date(race.race_date);
        
        adminRaceList.innerHTML += `
          <div class="race-item" style="margin-bottom: 1rem">
            <div class="race-info">
              <h4>${race.name}</h4>
              <p>📍 ${race.location} | 📅 ${raceDate.toLocaleDateString()}</p>
              <p>Status: ${race.is_completed ? '✓ Completed' : '⏰ Upcoming'}</p>
            </div>
            <div class="admin-actions">
              ${!race.is_completed ? `<button class="btn btn-primary" onclick="showResultsForm(${race.id}, '${race.name}')">Enter Results</button>` : '<span class="race-status completed">Results Entered</span>'}
              <button class="btn btn-danger" onclick="deleteRace(${race.id})">Delete</button>
            </div>
          </div>
        `;
      });
    }
  } catch (error) {
    app.innerHTML = '<div class="card"><p class="message error">Failed to load admin panel</p></div>';
  }
}

// Create race
async function createRace(event) {
  event.preventDefault();
  
  const name = document.getElementById('raceName').value;
  const location = document.getElementById('raceLocation').value;
  const race_date = document.getElementById('raceDate').value;
  
  try {
    const response = await fetch('/api/races', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, location, race_date })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showMessage('createRaceMessage', 'Race created successfully!', 'success');
      setTimeout(() => renderAdminPage(document.getElementById('app')), 1500);
    } else {
      showMessage('createRaceMessage', data.error, 'error');
    }
  } catch (error) {
    showMessage('createRaceMessage', 'Failed to create race', 'error');
  }
}

// Delete race
async function deleteRace(raceId) {
  if (!confirm('Are you sure you want to delete this race?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/races/${raceId}`, { method: 'DELETE' });
    
    if (response.ok) {
      renderAdminPage(document.getElementById('app'));
    } else {
      alert('Failed to delete race');
    }
  } catch (error) {
    alert('Failed to delete race');
  }
}

// Show results form
function showResultsForm(raceId, raceName) {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="card">
      <h2>Enter Results: ${raceName}</h2>
      <div id="resultsMessage"></div>
      
      <form onsubmit="submitResults(event, ${raceId})">
        <div class="position-prediction">
          <div class="form-group">
            <label for="result1">🥇 1st Place</label>
            <select id="result1" required>
              <option value="">Select driver...</option>
              ${F1_DRIVERS.map(d => `<option value="${d}">${d}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="result2">🥈 2nd Place</label>
            <select id="result2" required>
              <option value="">Select driver...</option>
              ${F1_DRIVERS.map(d => `<option value="${d}">${d}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="result3">🥉 3rd Place</label>
            <select id="result3" required>
              <option value="">Select driver...</option>
              ${F1_DRIVERS.map(d => `<option value="${d}">${d}</option>`).join('')}
            </select>
          </div>
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 2rem">
          <button type="submit" class="btn btn-success">Submit Results</button>
          <button type="button" class="btn btn-secondary" onclick="showPage('admin')">Cancel</button>
        </div>
      </form>
    </div>
  `;
}

// Submit results
async function submitResults(event, raceId) {
  event.preventDefault();
  
  const position1 = document.getElementById('result1').value;
  const position2 = document.getElementById('result2').value;
  const position3 = document.getElementById('result3').value;
  
  if (new Set([position1, position2, position3]).size !== 3) {
    showMessage('resultsMessage', 'Please select 3 different drivers', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        race_id: raceId,
        position1,
        position2,
        position3
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showMessage('resultsMessage', 'Results saved and points calculated!', 'success');
      setTimeout(() => showPage('admin'), 2000);
    } else {
      showMessage('resultsMessage', data.error, 'error');
    }
  } catch (error) {
    showMessage('resultsMessage', 'Failed to save results', 'error');
  }
}

// Show message
function showMessage(elementId, message, type) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<div class="message ${type}">${message}</div>`;
  }
}
