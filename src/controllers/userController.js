import User from '../models/userModel.js';

export const getCurrentLocation = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user || !user.location || user.location.latitude == null || user.location.longitude == null) {
      return res.status(404).json({ message: 'User location is not available' });
    }
    res.json({ location: user.location });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 