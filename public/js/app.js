// Global state
let currentUser = null;
let currentPage = 'home';

// F1 Drivers for 2026 season with teams
const F1_TEAMS = {
  'Red Bull Racing': ['Max Verstappen', 'Sergio Perez'],
  'Mercedes': ['Lewis Hamilton', 'George Russell'],
  'Ferrari': ['Charles Leclerc', 'Carlos Sainz'],
  'McLaren': ['Lando Norris', 'Oscar Piastri'],
  'Aston Martin': ['Fernando Alonso', 'Lance Stroll'],
  'Alpine': ['Pierre Gasly', 'Esteban Ocon'],
  'Williams': ['Alexander Albon', 'Logan Sargeant'],
  'Kick Sauber': ['Valtteri Bottas', 'Zhou Guanyu'],
  'Haas': ['Kevin Magnussen', 'Nico Hulkenberg'],
  'RB': ['Yuki Tsunoda', 'Daniel Ricciardo'],
  'Cadillac': ['Driver TBA 1', 'Driver TBA 2']
};

// Flat list of all drivers
const F1_DRIVERS = Object.values(F1_TEAMS).flat();

// F1 Points system (top 10)
const F1_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

// Sprint points system (top 8)
const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];

// Qualifying points for exact predictions
const QUALI_POINTS = {
  position1: 3,
  position2: 2,
  position3: 1
};

// Get team for a driver
function getTeamForDriver(driver) {
  for (const [team, drivers] of Object.entries(F1_TEAMS)) {
    if (drivers.includes(driver)) {
      return team;
    }
  }
  return null;
}

// Get available drivers (excluding selected teams)
function getAvailableDrivers(selectedDrivers) {
  const selectedTeams = selectedDrivers
    .filter(d => d)
    .map(d => getTeamForDriver(d))
    .filter(t => t);
  
  return F1_DRIVERS.filter(driver => {
    const team = getTeamForDriver(driver);
    return !selectedTeams.includes(team);
  });
}

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
          <h3>🏎️ Select Your Team (4 Drivers)</h3>
          <p>Choose 4 drivers from different teams. You can only pick one driver per team.</p>
          <div class="driver-selection" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
            <div class="form-group">
              <label for="driver1">Driver 1</label>
              <select id="driver1" required onchange="updateDriverOptions()">
                <option value="">Select driver...</option>
                ${F1_DRIVERS.map(d => `<option value="${d}">${d} (${getTeamForDriver(d)})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="driver2">Driver 2</label>
              <select id="driver2" required onchange="updateDriverOptions()">
                <option value="">Select driver...</option>
                ${F1_DRIVERS.map(d => `<option value="${d}">${d} (${getTeamForDriver(d)})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="driver3">Driver 3</label>
              <select id="driver3" required onchange="updateDriverOptions()">
                <option value="">Select driver...</option>
                ${F1_DRIVERS.map(d => `<option value="${d}">${d} (${getTeamForDriver(d)})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="driver4">Driver 4</label>
              <select id="driver4" required onchange="updateDriverOptions()">
                <option value="">Select driver...</option>
                ${F1_DRIVERS.map(d => `<option value="${d}">${d} (${getTeamForDriver(d)})</option>`).join('')}
              </select>
            </div>
          </div>
          <p class="info-text">💡 Your selected drivers will earn you points if they finish in the top 10 (F1 points: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1)</p>
        </div>
        
        <div class="prediction-section">
          <h3>🏁 Predict Qualifying Top 3</h3>
          <p>Predict which drivers will qualify in the top 3 positions (bonus points: 3, 2, 1 for exact matches).</p>
          <div class="position-prediction">
            <div class="form-group">
              <label for="quali_pos1">🥇 P1</label>
              <select id="quali_pos1">
                <option value="">Select driver...</option>
                ${F1_DRIVERS.map(d => `<option value="${d}">${d}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="quali_pos2">🥈 P2</label>
              <select id="quali_pos2">
                <option value="">Select driver...</option>
                ${F1_DRIVERS.map(d => `<option value="${d}">${d}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="quali_pos3">🥉 P3</label>
              <select id="quali_pos3">
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
  
  // Initialize driver options
  updateDriverOptions();
}

// Update driver selection options to prevent same team selection
function updateDriverOptions() {
  const driver1 = document.getElementById('driver1')?.value || '';
  const driver2 = document.getElementById('driver2')?.value || '';
  const driver3 = document.getElementById('driver3')?.value || '';
  const driver4 = document.getElementById('driver4')?.value || '';
  
  const selectedDrivers = [driver1, driver2, driver3, driver4];
  const selectedTeams = selectedDrivers
    .filter(d => d)
    .map(d => getTeamForDriver(d))
    .filter(t => t);
  
  // Update each dropdown
  ['driver1', 'driver2', 'driver3', 'driver4'].forEach(fieldId => {
    const select = document.getElementById(fieldId);
    if (!select) return;
    
    const currentValue = select.value;
    const currentTeam = currentValue ? getTeamForDriver(currentValue) : null;
    
    // Rebuild options
    const options = Array.from(select.options);
    options.forEach(option => {
      if (!option.value) return; // Skip placeholder
      
      const driverTeam = getTeamForDriver(option.value);
      // Disable if team is already selected (unless it's the current selection)
      if (selectedTeams.includes(driverTeam) && driverTeam !== currentTeam) {
        option.disabled = true;
        option.style.color = '#ccc';
      } else {
        option.disabled = false;
        option.style.color = '';
      }
    });
  });
}

// Submit prediction
async function submitPrediction(event, raceId) {
  event.preventDefault();
  
  const driver1 = document.getElementById('driver1').value;
  const driver2 = document.getElementById('driver2').value;
  const driver3 = document.getElementById('driver3').value;
  const driver4 = document.getElementById('driver4').value;
  const quali_pos1 = document.getElementById('quali_pos1').value || null;
  const quali_pos2 = document.getElementById('quali_pos2').value || null;
  const quali_pos3 = document.getElementById('quali_pos3').value || null;
  
  // Validate 4 different drivers from different teams
  const selectedDrivers = [driver1, driver2, driver3, driver4];
  const selectedTeams = selectedDrivers.map(d => getTeamForDriver(d));
  
  if (new Set(selectedDrivers).size !== 4) {
    showMessage('predictionMessage', 'Please select 4 different drivers', 'error');
    return;
  }
  
  if (new Set(selectedTeams).size !== 4) {
    showMessage('predictionMessage', 'Please select drivers from 4 different teams', 'error');
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
        driver4,
        quali_pos1,
        quali_pos2,
        quali_pos3
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
        const totalPoints = pred.total_points || 0;
        const racePoints = pred.race_points || 0;
        const qualiPoints = pred.quali_points || 0;
        const sprintPoints = pred.sprint_points || 0;
        
        list.innerHTML += `
          <div class="prediction-card">
            <div style="display: flex; justify-content: space-between; align-items: center">
              <div>
                <h3>${pred.race_name}${pred.has_sprint ? ' 🏁 (Sprint Weekend)' : ''}</h3>
                <p>📍 ${pred.location} | 📅 ${raceDate.toLocaleDateString()}</p>
              </div>
              ${pred.is_completed ? `
                <div style="text-align: right">
                  <span class="points-badge">${totalPoints} total points</span>
                  <p style="font-size: 0.85rem; margin-top: 0.25rem">
                    Race: ${racePoints} | Quali: ${qualiPoints}${pred.has_sprint ? ` | Sprint: ${sprintPoints}` : ''}
                  </p>
                </div>
              ` : ''}
            </div>
            
            <div class="prediction-details">
              <div class="prediction-group">
                <h4>Your Team (4 Drivers)</h4>
                <p>🏎️ ${pred.driver1}</p>
                <p>🏎️ ${pred.driver2}</p>
                <p>🏎️ ${pred.driver3}</p>
                <p>🏎️ ${pred.driver4}</p>
              </div>
              
              ${pred.quali_pos1 ? `
                <div class="prediction-group">
                  <h4>Qualifying Predictions</h4>
                  <p>🥇 ${pred.quali_pos1}</p>
                  <p>🥈 ${pred.quali_pos2 || 'N/A'}</p>
                  <p>🥉 ${pred.quali_pos3 || 'N/A'}</p>
                </div>
              ` : ''}
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
              <th>Race</th>
              <th>Quali</th>
              <th>Sprint</th>
              <th>Races</th>
            </tr>
          </thead>
          <tbody id="leaderboardBody"></tbody>
        </table>
      </div>
    `;
    
    const tbody = document.getElementById('leaderboardBody');
    
    if (leaderboard.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center">No data yet</td></tr>';
    } else {
      leaderboard.forEach((user, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? 'top-3' : '';
        
        tbody.innerHTML += `
          <tr>
            <td class="rank ${rankClass}">#${rank}</td>
            <td>${user.username}</td>
            <td><strong>${user.total_points || 0}</strong></td>
            <td>${user.race_points || 0}</td>
            <td>${user.quali_points || 0}</td>
            <td>${user.sprint_points || 0}</td>
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
          <div class="form-group">
            <label>
              <input type="checkbox" id="hasSprint" style="width: auto; margin-right: 0.5rem">
              Sprint Weekend
            </label>
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
        const isCompleted = race.is_completed;
        const qualiCompleted = race.quali_completed;
        const sprintCompleted = race.sprint_completed;
        const hasSprint = race.has_sprint;
        
        adminRaceList.innerHTML += `
          <div class="race-item" style="margin-bottom: 1rem; border: 2px solid ${hasSprint ? '#ff6b35' : '#ddd'}">
            <div class="race-info">
              <h4>${race.name}${hasSprint ? ' 🏁 (Sprint Weekend)' : ''}</h4>
              <p>📍 ${race.location} | 📅 ${raceDate.toLocaleDateString()}</p>
              <p>
                Qualifying: ${qualiCompleted ? '✓' : '⏰'} |
                ${hasSprint ? `Sprint: ${sprintCompleted ? '✓' : '⏰'} | ` : ''}
                Race: ${isCompleted ? '✓' : '⏰'}
              </p>
            </div>
            <div class="admin-actions">
              ${!qualiCompleted ? `<button class="btn btn-primary" onclick="showQualiResultsForm(${race.id}, '${race.name}')">Enter Qualifying</button>` : ''}
              ${hasSprint && !sprintCompleted ? `<button class="btn btn-primary" onclick="showSprintResultsForm(${race.id}, '${race.name}')">Enter Sprint</button>` : ''}
              ${!isCompleted ? `<button class="btn btn-success" onclick="showRaceResultsForm(${race.id}, '${race.name}')">Enter Race Results</button>` : '<span class="race-status completed">Completed</span>'}
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
  const has_sprint = document.getElementById('hasSprint').checked;
  
  try {
    const response = await fetch('/api/races', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, location, race_date, has_sprint })
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
// Show qualifying results form
function showQualiResultsForm(raceId, raceName) {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="card">
      <h2>Enter Qualifying Results: ${raceName}</h2>
      <div id="resultsMessage"></div>
      
      <form onsubmit="submitQualiResults(event, ${raceId})">
        <h3>Top 3 Qualifying Positions</h3>
        <div class="position-prediction">
          <div class="form-group">
            <label for="result1">🥇 P1</label>
            <select id="result1" required>
              <option value="">Select driver...</option>
              ${F1_DRIVERS.map(d => `<option value="${d}">${d}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="result2">🥈 P2</label>
            <select id="result2" required>
              <option value="">Select driver...</option>
              ${F1_DRIVERS.map(d => `<option value="${d}">${d}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="result3">🥉 P3</label>
            <select id="result3" required>
              <option value="">Select driver...</option>
              ${F1_DRIVERS.map(d => `<option value="${d}">${d}</option>`).join('')}
            </select>
          </div>
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 2rem">
          <button type="submit" class="btn btn-success">Submit Qualifying Results</button>
          <button type="button" class="btn btn-secondary" onclick="showPage('admin')">Cancel</button>
        </div>
      </form>
    </div>
  `;
}

// Submit qualifying results
async function submitQualiResults(event, raceId) {
  event.preventDefault();
  
  const position1 = document.getElementById('result1').value;
  const position2 = document.getElementById('result2').value;
  const position3 = document.getElementById('result3').value;
  
  if (new Set([position1, position2, position3]).size !== 3) {
    showMessage('resultsMessage', 'Please select 3 different drivers', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/results/qualifying', {
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
      showMessage('resultsMessage', 'Qualifying results saved and points calculated!', 'success');
      setTimeout(() => showPage('admin'), 2000);
    } else {
      showMessage('resultsMessage', data.error, 'error');
    }
  } catch (error) {
    showMessage('resultsMessage', 'Failed to save qualifying results', 'error');
  }
}

// Show sprint results form
function showSprintResultsForm(raceId, raceName) {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="card">
      <h2>Enter Sprint Results: ${raceName}</h2>
      <div id="resultsMessage"></div>
      
      <form onsubmit="submitSprintResults(event, ${raceId})">
        <h3>Top 8 Sprint Positions (Points: 8, 7, 6, 5, 4, 3, 2, 1)</h3>
        <div class="driver-selection" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
          ${[1,2,3,4,5,6,7,8].map(i => `
            <div class="form-group">
              <label for="result${i}">P${i}</label>
              <select id="result${i}" required>
                <option value="">Select driver...</option>
                ${F1_DRIVERS.map(d => `<option value="${d}">${d}</option>`).join('')}
              </select>
            </div>
          `).join('')}
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 2rem">
          <button type="submit" class="btn btn-success">Submit Sprint Results</button>
          <button type="button" class="btn btn-secondary" onclick="showPage('admin')">Cancel</button>
        </div>
      </form>
    </div>
  `;
}

// Submit sprint results
async function submitSprintResults(event, raceId) {
  event.preventDefault();
  
  const positions = [];
  for (let i = 1; i <= 8; i++) {
    positions.push(document.getElementById(`result${i}`).value);
  }
  
  if (new Set(positions).size !== 8) {
    showMessage('resultsMessage', 'Please select 8 different drivers', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/results/sprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        race_id: raceId,
        positions
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showMessage('resultsMessage', 'Sprint results saved and points calculated!', 'success');
      setTimeout(() => showPage('admin'), 2000);
    } else {
      showMessage('resultsMessage', data.error, 'error');
    }
  } catch (error) {
    showMessage('resultsMessage', 'Failed to save sprint results', 'error');
  }
}

// Show race results form
function showRaceResultsForm(raceId, raceName) {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="card">
      <h2>Enter Race Results: ${raceName}</h2>
      <div id="resultsMessage"></div>
      
      <form onsubmit="submitRaceResults(event, ${raceId})">
        <h3>Top 10 Race Positions (F1 Points: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1)</h3>
        <div class="driver-selection" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
          ${[1,2,3,4,5,6,7,8,9,10].map(i => `
            <div class="form-group">
              <label for="result${i}">P${i}</label>
              <select id="result${i}" required>
                <option value="">Select driver...</option>
                ${F1_DRIVERS.map(d => `<option value="${d}">${d}</option>`).join('')}
              </select>
            </div>
          `).join('')}
        </div>
        
        <div style="display: flex; gap: 1rem; margin-top: 2rem">
          <button type="submit" class="btn btn-success">Submit Race Results</button>
          <button type="button" class="btn btn-secondary" onclick="showPage('admin')">Cancel</button>
        </div>
      </form>
    </div>
  `;
}

// Submit race results
async function submitRaceResults(event, raceId) {
  event.preventDefault();
  
  const positions = [];
  for (let i = 1; i <= 10; i++) {
    positions.push(document.getElementById(`result${i}`).value);
  }
  
  if (new Set(positions).size !== 10) {
    showMessage('resultsMessage', 'Please select 10 different drivers', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/results/race', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        race_id: raceId,
        positions
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showMessage('resultsMessage', 'Race results saved and points calculated!', 'success');
      setTimeout(() => showPage('admin'), 2000);
    } else {
      showMessage('resultsMessage', data.error, 'error');
    }
  } catch (error) {
    showMessage('resultsMessage', 'Failed to save race results', 'error');
  }
}

// Show message
function showMessage(elementId, message, type) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `<div class="message ${type}">${message}</div>`;
  }
}
