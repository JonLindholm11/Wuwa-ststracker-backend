// routes/stats.js
const express = require('express');
const router = express.Router();
const { statsOperations, userOperations } = require('../database');

// GET /api/user-stats/:userId/:characterId - Get stats for specific user and character
router.get('/user-stats/:userId/:characterId', async (req, res) => {
  try {
    const { userId, characterId } = req.params;
    
    console.log(`Getting stats for user: ${userId}, character: ${characterId}`);
    
    const stats = await statsOperations.getStats(userId, characterId);
    
    if (stats) {
      // Convert database format to frontend format
      const formattedStats = {
        hp: stats.hp?.toString() || '',
        attack: stats.attack?.toString() || '',
        defense: stats.defense?.toString() || '',
        dmgBonus: stats.dmg_bonus?.toString() || '',
        critRate: stats.crit_rate?.toString() || '',
        critDamage: stats.crit_damage?.toString() || ''
      };
      
      res.json({
        success: true,
        stats: formattedStats,
        lastUpdated: stats.updated_at
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No stats found for this user and character'
      });
    }
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// POST /api/user-stats - Save or update stats
router.post('/user-stats', async (req, res) => {
  try {
    const { userId, username, characterId, characterName, stats, timestamp } = req.body;
    
    // Validation
    if (!userId || !username || !characterId || !characterName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, username, characterId, characterName'
      });
    }
    
    if (!stats || typeof stats !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Stats object is required'
      });
    }
    
    console.log(`Saving stats for user: ${username} (${userId}), character: ${characterName} (${characterId})`);
    console.log('Stats:', stats);
    
    // Save user info (for future reference)
    await userOperations.saveUser(userId, username);
    
    // Save character stats
    const result = await statsOperations.saveStats({
      userId,
      username,
      characterId,
      characterName,
      stats
    });
    
    console.log('Save result:', result);
    
    res.json({
      success: true,
      message: 'Stats saved successfully',
      data: {
        userId,
        characterId,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error saving stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save stats',
      error: error.message
    });
  }
});

// DELETE /api/user-stats/:userId/:characterId - Delete stats
router.delete('/user-stats/:userId/:characterId', async (req, res) => {
  try {
    const { userId, characterId } = req.params;
    
    console.log(`Deleting stats for user: ${userId}, character: ${characterId}`);
    
    const result = await statsOperations.deleteStats(userId, characterId);
    
    if (result.changes > 0) {
      res.json({
        success: true,
        message: 'Stats deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No stats found to delete'
      });
    }
    
  } catch (error) {
    console.error('Error deleting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete stats',
      error: error.message
    });
  }
});

// GET /api/user-stats/:userId - Get all characters for a user
router.get('/user-stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`Getting all characters for user: ${userId}`);
    
    const characters = await statsOperations.getUserCharacters(userId);
    
    res.json({
      success: true,
      characters: characters,
      count: characters.length
    });
    
  } catch (error) {
    console.error('Error getting user characters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user characters',
      error: error.message
    });
  }
});

// GET /api/health - Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;