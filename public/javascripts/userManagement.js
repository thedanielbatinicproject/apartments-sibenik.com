// Custom Alert Functions
function showCustomAlert(message) {
    document.getElementById('alertMessage').textContent = message;
    document.getElementById('customAlert').style.display = 'block';
}

function closeCustomAlert() {
    document.getElementById('customAlert').style.display = 'none';
}

// Custom Confirm Functions
let confirmCallback = null;

function showCustomConfirm(message, callback) {
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('customConfirm').style.display = 'block';
    confirmCallback = callback;
}

function confirmAction() {
    document.getElementById('customConfirm').style.display = 'none';
    if (confirmCallback) {
        confirmCallback();
        confirmCallback = null;
    }
}

function closeCustomConfirm() {
    document.getElementById('customConfirm').style.display = 'none';
    confirmCallback = null;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const alertModal = document.getElementById('customAlert');
    const confirmModal = document.getElementById('customConfirm');
    if (event.target === alertModal) {
        closeCustomAlert();
    }
    if (event.target === confirmModal) {
        closeCustomConfirm();
    }
}

// User Management Functions (Admin only)
function openUserManagement() {
    document.getElementById('userManagementModal').style.display = 'block';
    loadUsers();
}

function closeUserManagement() {
    document.getElementById('userManagementModal').style.display = 'none';
}

function showAddUserForm() {
    document.getElementById('addUserForm').style.display = 'block';
}

function hideAddUserForm() {
    document.getElementById('addUserForm').style.display = 'none';
    document.getElementById('newUserForm').reset();
}

async function loadUsers() {
    try {
        const response = await fetch('/management/api/users');
        const result = await response.json();
        
        if (result.success) {
            displayUsers(result.users);
        } else {
            showCustomAlert('Error loading users: ' + result.message);
        }
    } catch (error) {
        showCustomAlert('Error loading users: ' + error.message);
    }
}

function displayUsers(users) {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '<h3>Current Users</h3>';
    
    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        userDiv.innerHTML = `
            <div class="user-info">
                <strong>${user.name}</strong> (${user.username})
                <span class="user-role">${user.role}</span>
            </div>
            <div class="user-actions">
                <button onclick="showChangePasswordModal('${user.uuid}', '${user.username}', '${user.role}')" class="btn-warning">Promijeni lozinku</button>
                ${user.username !== 'admin' ? 
                    `<button onclick="removeUser('${user.uuid}')" class="btn-danger">Ukloni korisnika</button>` : 
                    '<span class="protected-user">Ne može se ukloniti</span>'
                }
            </div>
        `;
        usersList.appendChild(userDiv);
    });
}

async function createUser(name, username, password) {
    try {
        const response = await fetch('/management/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showCustomAlert('User created successfully!');
            hideAddUserForm();
            loadUsers();
        } else {
            showCustomAlert('Error: ' + result.message);
        }
    } catch (error) {
        showCustomAlert('Error creating user: ' + error.message);
    }
}

async function removeUser(userUuid) {
    showCustomConfirm('Are you sure you want to remove this user?', async function() {
        try {
            const response = await fetch(`/management/api/users/${userUuid}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                showCustomAlert('User removed successfully!');
                loadUsers();
            } else {
                showCustomAlert('Error: ' + result.message);
            }
        } catch (error) {
            showCustomAlert('Error removing user: ' + error.message);
        }
    });
}

// Change Password Functions
function showChangePasswordModal(userUuid, username, userRole) {
    // Determine if this is the current user changing their own password
    const currentUser = getCurrentUser(); // We'll need to implement this
    const isOwnPassword = currentUser && currentUser.uuid === userUuid;
    const isAdmin = currentUser && currentUser.role === 'admin';
    
    const modalHtml = `
        <div id="changePasswordModal" class="modal" style="display: block;">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Promijeni lozinku za ${username}</h2>
                    <span class="close" onclick="closeChangePasswordModal()">&times;</span>
                </div>
                <div class="modal-body">
                    <form id="changePasswordForm">
                        ${(isOwnPassword || (isAdmin && isOwnPassword)) ? `
                            <div class="form-group">
                                <label for="currentPassword">Trenutna lozinka:</label>
                                <input type="password" id="currentPassword" required>
                            </div>
                        ` : ''}
                        <div class="form-group">
                            <label for="newPassword">Nova lozinka:</label>
                            <input type="password" id="newPassword" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label for="confirmPassword">Potvrdi novu lozinku:</label>
                            <input type="password" id="confirmPassword" required minlength="6">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Promijeni lozinku</button>
                            <button type="button" onclick="closeChangePasswordModal()" class="btn-secondary">Odustani</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('changePasswordModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Add form submit listener
    document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await handleChangePassword(userUuid, isOwnPassword || (isAdmin && isOwnPassword));
    });
}

function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.remove();
    }
}

async function handleChangePassword(userUuid, requireCurrentPassword) {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const currentPassword = requireCurrentPassword ? document.getElementById('currentPassword').value : null;
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
        showCustomAlert('Nova lozinka i potvrda se ne slažu!');
        return;
    }
    
    // Validate password length
    if (newPassword.length < 6) {
        showCustomAlert('Nova lozinka mora imati najmanje 6 znakova!');
        return;
    }
    
    try {
        const requestBody = { newPassword };
        if (requireCurrentPassword) {
            requestBody.currentPassword = currentPassword;
        }
        
        const response = await fetch(`/management/api/users/${userUuid}/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showCustomAlert('Lozinka je uspješno promijenjena!');
            closeChangePasswordModal();
        } else {
            showCustomAlert('Greška: ' + result.message);
        }
    } catch (error) {
        showCustomAlert('Greška pri mijenjanju lozinke: ' + error.message);
    }
}

// Helper function to get current user info (we'll need this from session)
function getCurrentUser() {
    // This should be populated from server-side rendered data
    // We'll implement this when we update the HTML template
    return window.currentUser || null;
}

// Relay Management Functions
let relayStates = {};

async function toggleRelay(relayNumber) {
    try {
        const relayCard = document.querySelector(`[data-relay="${relayNumber}"]`);
        
        // Add loading state
        relayCard.classList.add('loading');
        
        const response = await fetch(`/management/api/relay-toggle/${relayNumber}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update local state
            relayStates = result.relayStates;
            updateRelayUI();
        }
    } catch (error) {
        console.error('Error toggling relay:', error.message);
    } finally {
        // Remove loading state
        const relayCard = document.querySelector(`[data-relay="${relayNumber}"]`);
        if (relayCard) {
            relayCard.classList.remove('loading');
        }
    }
}

function updateRelayUI() {
    for (let i = 1; i <= 4; i++) {
        const relayKey = `relay${i}`;
        const relayCard = document.querySelector(`[data-relay="${i}"]`);
        const statusText = relayCard.querySelector('.relay-status-text');
        const actionText = relayCard.querySelector('.relay-action-text');
        const isOn = relayStates[relayKey];
        
        // Update card classes
        relayCard.classList.remove('powered-on', 'powered-off');
        relayCard.classList.add(isOn ? 'powered-on' : 'powered-off');
        
        // Update text content
        statusText.textContent = isOn ? 'Powered ON' : 'Powered OFF';
        actionText.textContent = isOn ? 'Press to TURN OFF' : 'Press to TURN ON';
    }
}

// Load current relay states from server
async function loadRelayStates() {
    try {
        console.log('Loading relay states from server...');
        const response = await fetch('/management/api/relay-states');
        const result = await response.json();
        
        if (result.success) {
            relayStates = result.relayStates;
            updateRelayUI();
            console.log('Relay states loaded from server:', relayStates);
        } else {
            console.error('Failed to load relay states:', result.message);
        }
    } catch (error) {
        console.error('Error loading relay states:', error);
    }
}

// Initialize relay states from server-side rendered data
function initializeRelayStates(serverRelayStates) {
    relayStates = serverRelayStates;
}

// Socket.IO and initialization functions
function initializeSocketIO() {
    const socket = io();
    
    socket.on('connect', function() {
        console.log('Socket.IO connected');
        // Load current states when connected
        loadRelayStates();
    });
    
    socket.on('relayStatesUpdate', function(data) {
        relayStates = data;
        updateRelayUI();
        console.log('Relay states updated via Socket.IO:', data);
    });
    
    socket.on('disconnect', function() {
        console.log('Socket.IO disconnected');
    });
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Socket.IO
    initializeSocketIO();
    
    // Load relay states
    loadRelayStates();
    
    // Set up form event listener for user creation (if admin)
    const newUserForm = document.getElementById('newUserForm');
    if (newUserForm) {
        newUserForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('newUserName').value;
            const username = document.getElementById('newUserUsername').value;
            const password = document.getElementById('newUserPassword').value;
            
            await createUser(name, username, password);
        });
    }
});
