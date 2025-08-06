const fs = require('fs');
const path = require('path');

console.log('🔄 Starting Review ID migration...');

// Read current files
function readJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        return null;
    }
}

function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error.message);
        return false;
    }
}

// Get review ID from unitId and index position
function getReviewIdFromPosition(reviewsData, unitId, index) {
    for (const [unit, unitData] of Object.entries(reviewsData)) {
        if (unit === unitId) {
            let currentIndex = 0;
            for (const [platform, platformData] of Object.entries(unitData)) {
                if (platformData.reviews) {
                    for (const review of platformData.reviews) {
                        if (currentIndex === index) {
                            return review.id;
                        }
                        currentIndex++;
                    }
                }
            }
        }
    }
    return null;
}

// Main migration function
function migrateReviewIds() {
    const reviewsData = readJsonFile('./data/private/reviews.json');
    const upvotesData = readJsonFile('./data/public_data/upvotes.json');
    const userUpvotesData = readJsonFile('./data/user_data/user_upvotes.json');
    
    if (!reviewsData || !upvotesData || !userUpvotesData) {
        console.error('❌ Failed to read required files');
        return false;
    }
    
    console.log('📊 Current upvotes.json format: unitId_reviewIndex');
    console.log('🎯 Target format: reviewId');
    
    // Convert upvotes.json from "unitId_index" to "reviewId"
    const newUpvotesData = {};
    
    for (const [key, upvotes] of Object.entries(upvotesData)) {
        const [unitId, indexStr] = key.split('_');
        const index = parseInt(indexStr);
        
        const reviewId = getReviewIdFromPosition(reviewsData, unitId, index);
        
        if (reviewId) {
            newUpvotesData[reviewId] = upvotes;
            console.log(`✅ Migrated: ${key} (unit ${unitId}, index ${index}) -> review ID ${reviewId} (${upvotes} upvotes)`);
        } else {
            console.log(`❌ Could not find review for ${key}`);
        }
    }
    
    // Convert user_upvotes.json from "unitId_index" to "reviewId"
    const newUserUpvotesData = {};
    
    for (const [userId, reviewKeys] of Object.entries(userUpvotesData)) {
        newUserUpvotesData[userId] = [];
        
        for (const reviewKey of reviewKeys) {
            const [unitId, indexStr] = reviewKey.split('_');
            const index = parseInt(indexStr);
            
            const reviewId = getReviewIdFromPosition(reviewsData, unitId, index);
            
            if (reviewId) {
                newUserUpvotesData[userId].push(reviewId.toString());
                console.log(`✅ User ${userId}: ${reviewKey} -> review ID ${reviewId}`);
            } else {
                console.log(`❌ Could not find review for user upvote ${reviewKey}`);
            }
        }
    }
    
    // Save the updated files
    console.log('\n💾 Saving migrated data...');
    
    if (writeJsonFile('./data/public_data/upvotes.json', newUpvotesData)) {
        console.log('✅ upvotes.json migrated successfully');
    } else {
        console.log('❌ Failed to save upvotes.json');
        return false;
    }
    
    if (writeJsonFile('./data/user_data/user_upvotes.json', newUserUpvotesData)) {
        console.log('✅ user_upvotes.json migrated successfully');
    } else {
        console.log('❌ Failed to save user_upvotes.json');
        return false;
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 New system:');
    console.log('• upvotes.json: reviewId -> upvote_count');
    console.log('• user_upvotes.json: userId -> [reviewId1, reviewId2, ...]');
    console.log('• reviews.json: unchanged (already uses unique review IDs)');
    
    return true;
}

// Run migration
if (migrateReviewIds()) {
    console.log('\n✨ Review ID system is now consistent across all files!');
} else {
    console.log('\n💥 Migration failed!');
}
