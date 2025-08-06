const fs = require('fs');
const path = require('path');

// Read user upvotes
function readUserUpvotes() {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'data/user_data/user_upvotes.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading user upvotes:', error);
        return {};
    }
}

// Read reviews database
function readReviewsDB() {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'data/private/reviews.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading reviews database:', error);
        return {};
    }
}

// Write reviews database
function writeReviewsDB(data) {
    try {
        fs.writeFileSync(path.join(__dirname, 'data/private/reviews.json'), JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing reviews database:', error);
        return false;
    }
}

// Count upvotes for a specific review
function countUpvotesForReview(userUpvotes, unitId, reviewIndex) {
    let count = 0;
    const reviewKey = `${unitId}_${reviewIndex}`;
    
    for (const userId in userUpvotes) {
        if (userUpvotes[userId].includes(reviewKey)) {
            count++;
        }
    }
    
    return count;
}

// Sync upvotes from user_upvotes.json to reviews.json
function syncUpvotes() {
    console.log('Starting upvotes synchronization...');
    
    const userUpvotes = readUserUpvotes();
    const reviewsData = readReviewsDB();
    
    let updated = false;
    
    // Go through each unit and platform
    for (const [unitId, unit] of Object.entries(reviewsData)) {
        for (const [platform, platformData] of Object.entries(unit)) {
            if (platformData.reviews && Array.isArray(platformData.reviews)) {
                platformData.reviews.forEach((review, index) => {
                    const actualUpvotes = countUpvotesForReview(userUpvotes, unitId, index);
                    
                    if (review.upvotes !== actualUpvotes) {
                        console.log(`Updating review ${review.id} (${review.guestName}): ${review.upvotes} -> ${actualUpvotes} upvotes`);
                        review.upvotes = actualUpvotes;
                        updated = true;
                    }
                });
            }
        }
    }
    
    if (updated) {
        if (writeReviewsDB(reviewsData)) {
            console.log('✅ Upvotes synchronized successfully!');
        } else {
            console.log('❌ Failed to write synchronized data');
        }
    } else {
        console.log('✅ All upvotes are already in sync');
    }
}

// Run the sync
syncUpvotes();
