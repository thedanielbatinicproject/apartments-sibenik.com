// Reviews Management JavaScript
let currentUnit = 1;
let currentReviews = [];
let displayedCount = 6; // Initially show 6 reviews
const REVIEWS_PER_LOAD = 6;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadReviews();
    initializeEventListeners();
});

// Initialize all event listeners
function initializeEventListeners() {
    // Handle form submission
    document.getElementById('reviewForm').addEventListener('submit', handleFormSubmission);
    
    // Remove avatar button functionality
    document.getElementById('removeAvatarBtn').addEventListener('click', handleRemoveAvatar);
    
    // File input change handler
    document.getElementById('avatarFile').addEventListener('change', handleFileChange);
    
    // File preview remove button
    document.getElementById('filePreviewRemove').addEventListener('click', handleFilePreviewRemove);
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('reviewModal');
        if (event.target === modal) {
            closeModal();
        }
    };
}

// Switch between units
function switchUnit(unitId) {
    currentUnit = unitId;
    displayedCount = 6; // Reset displayed count
    
    // Update tab appearance
    document.querySelectorAll('.unit-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-unit="${unitId}"]`).classList.add('active');
    
    // Load reviews for the selected unit
    loadReviews();
}

// Load reviews from server
async function loadReviews() {
    try {
        const response = await fetch(`/management/api/reviews`);
        const data = await response.json();
        
        // Filter reviews by current unit
        currentReviews = data.filter(review => review.unitId == currentUnit) || [];
        displayReviews();
    } catch (error) {
        console.error('Error loading reviews:', error);
        document.getElementById('reviewsGrid').innerHTML = 
            '<p style="color: rgba(255,255,255,0.7); text-align: center; grid-column: 1 / -1;">Error loading reviews</p>';
    }
}

// Display reviews in the grid
function displayReviews() {
    const grid = document.getElementById('reviewsGrid');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    // Remove existing counter
    const existingCounter = document.querySelector('.reviews-counter');
    if (existingCounter) {
        existingCounter.remove();
    }
    
    if (currentReviews.length === 0) {
        grid.innerHTML = '<div class="empty-state"><h3>No Reviews Found</h3><p>No reviews found for this unit. Click "Add New Review" to add the first review.</p></div>';
        loadMoreBtn.style.display = 'none';
        return;
    }

    // Show reviews up to displayedCount
    const reviewsToShow = currentReviews.slice(0, displayedCount);
    
    grid.innerHTML = reviewsToShow.map(review => `
        <div class="review-card" data-review-id="${review.id}">
            <div class="review-header">
                <img src="${review.guestAvatar}" alt="${review.guestName}" class="review-avatar" 
                     onerror="this.src='/images/avatars/default.png'">
                <div class="review-info">
                    <h4>${review.guestName}</h4>
                    <div class="review-meta">
                        <span class="platform-badge platform-${review.platform}">
                            ${review.platform === 'airbnb' ? 'Airbnb' : 'Booking.com'}
                        </span>
                        <span class="rating-stars">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</span>
                        <span>${review.date}</span>
                        ${review.isVerified ? '<span style="color: #4ade80;">✓ Verified</span>' : ''}
                        <span class="upvotes-badge" title="Upvotes">👍 ${review.upvotes || 0}</span>
                    </div>
                </div>
            </div>
            <div class="review-comment">${review.comment}</div>
            <div class="review-actions">
                <button class="btn-edit" onclick="editReview(${review.id})">Edit</button>
                <button class="btn-delete" onclick="deleteReview(${review.id})">Delete</button>
            </div>
        </div>
    `).join('');

    // Show/hide load more button and add counter
    const hasMoreReviews = displayedCount < currentReviews.length;
    loadMoreBtn.style.display = hasMoreReviews ? 'block' : 'none';
    
    // Add review counter
    if (currentReviews.length > 0) {
        const counter = document.createElement('div');
        counter.className = 'reviews-counter';
        counter.textContent = `Showing ${Math.min(displayedCount, currentReviews.length)} of ${currentReviews.length} reviews`;
        loadMoreBtn.insertAdjacentElement('beforebegin', counter);
    }
}

// Load more reviews
function loadMoreReviews() {
    displayedCount += REVIEWS_PER_LOAD;
    displayReviews();
}

// Open add review modal
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add New Review';
    document.getElementById('submitText').textContent = 'Add Review';
    document.getElementById('reviewId').value = '';
    document.getElementById('reviewForm').reset();
    document.getElementById('unitId').value = currentUnit; // Set current unit
    document.getElementById('reviewModal').style.display = 'block';
}

// Edit review
function editReview(reviewId) {
    const review = currentReviews.find(r => r.id === reviewId);
    if (!review) return;

    document.getElementById('modalTitle').textContent = 'Edit Review';
    document.getElementById('submitText').textContent = 'Update Review';
    document.getElementById('reviewId').value = reviewId;
    document.getElementById('unitId').value = review.unitId;
    document.getElementById('platform').value = review.platform;
    document.getElementById('guestName').value = review.guestName;
    
    // Parse the date - handle different date formats
    let dateValue = '';
    if (review.date) {
        try {
            // Handle formats like "5. October, 2024" or "16. August, 2024"
            const dateParts = review.date.match(/(\d{1,2})\.\s*(\w+),?\s*(\d{4})/);
            if (dateParts) {
                const months = {
                    'January': '01', 'February': '02', 'March': '03', 'April': '04',
                    'May': '05', 'June': '06', 'July': '07', 'August': '08',
                    'September': '09', 'October': '10', 'November': '11', 'December': '12'
                };
                const day = dateParts[1].padStart(2, '0');
                const month = months[dateParts[2]];
                const year = dateParts[3];
                if (month) {
                    dateValue = `${year}-${month}-${day}`;
                }
            } else {
                // Try other formats
                const altParts = review.date.match(/(\d{1,2})\s+(\w+),?\s*(\d{4})/);
                if (altParts) {
                    const months = {
                        'January': '01', 'February': '02', 'March': '03', 'April': '04',
                        'May': '05', 'June': '06', 'July': '07', 'August': '08',
                        'September': '09', 'October': '10', 'November': '11', 'December': '12'
                    };
                    const day = altParts[1].padStart(2, '0');
                    const month = months[altParts[2]];
                    const year = altParts[3];
                    if (month) {
                        dateValue = `${year}-${month}-${day}`;
                    }
                }
            }
        } catch (e) {
            console.log('Date parsing error:', e);
        }
    }
    
    document.getElementById('reviewDate').value = dateValue;
    document.getElementById('rating').value = review.rating;
    document.getElementById('comment').value = review.comment;
    document.getElementById('upvotes').value = review.upvotes || 0;
    document.getElementById('isVerified').checked = review.isVerified;
    
    // Show/hide remove avatar button based on whether review has custom avatar
    const avatarActions = document.getElementById('avatarActions');
    const removeAvatarInput = document.getElementById('removeAvatar');
    
    if (review.guestAvatar && !review.guestAvatar.includes('/default-avatar.png')) {
        avatarActions.style.display = 'block';
    } else {
        avatarActions.style.display = 'none';
    }
    
    // Reset remove avatar flag
    removeAvatarInput.value = 'false';
    
    document.getElementById('reviewModal').style.display = 'block';
}

// Delete review
async function deleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
        const response = await fetch(`/management/api/reviews/${reviewId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadReviews(); // Reload reviews
        } else {
            alert('Error deleting review');
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        alert('Error deleting review');
    }
}

// Close modal
function closeModal() {
    document.getElementById('reviewModal').style.display = 'none';
    
    // Reset file preview
    document.getElementById('avatarFile').value = '';
    document.getElementById('filePreview').classList.remove('active');
    
    // Reset avatar actions
    document.getElementById('avatarActions').style.display = 'none';
    document.getElementById('removeAvatar').value = 'false';
    
    // Reset remove avatar button appearance
    const removeBtn = document.getElementById('removeAvatarBtn');
    removeBtn.textContent = '🗑️ Remove Current Avatar';
    removeBtn.style.background = '';
    removeBtn.style.color = '';
    removeBtn.style.borderColor = '';
}

// Handle form submission
async function handleFormSubmission(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const reviewId = document.getElementById('reviewId').value;
    
    const url = reviewId ? 
        `/management/api/reviews/${reviewId}` : 
        '/management/api/reviews';
    
    const method = reviewId ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            body: formData
        });

        if (response.ok) {
            closeModal();
            loadReviews(); // Reload reviews
        } else {
            const error = await response.json();
            alert('Error: ' + (error.message || 'Failed to save review'));
        }
    } catch (error) {
        console.error('Error saving review:', error);
        alert('Error saving review');
    }
}

// Remove avatar button functionality
function handleRemoveAvatar() {
    if (confirm('Are you sure you want to remove the current avatar? This will set the avatar to default.')) {
        document.getElementById('removeAvatar').value = 'true';
        document.getElementById('avatarActions').style.display = 'none';
        
        // Visual feedback
        const btn = this;
        btn.textContent = '✓ Avatar will be removed';
        btn.style.background = 'rgba(34, 197, 94, 0.2)';
        btn.style.color = '#22c55e';
        btn.style.borderColor = 'rgba(34, 197, 94, 0.3)';
    }
}

// File input change handler
function handleFileChange(e) {
    const file = e.target.files[0];
    const filePreview = document.getElementById('filePreview');
    const fileName = document.getElementById('filePreviewName');
    const fileSize = document.getElementById('filePreviewSize');
    
    if (file) {
        // Show file preview
        filePreview.classList.add('active');
        fileName.textContent = `Selected image: ${file.name}`;
        fileSize.textContent = formatFileSize(file.size);
        
        // Hide avatar actions if they were visible
        document.getElementById('avatarActions').style.display = 'none';
        document.getElementById('removeAvatar').value = 'false';
    } else {
        // Hide file preview
        filePreview.classList.remove('active');
    }
}

// File preview remove button
function handleFilePreviewRemove() {
    document.getElementById('avatarFile').value = '';
    document.getElementById('filePreview').classList.remove('active');
}

// Format file size helper function
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
