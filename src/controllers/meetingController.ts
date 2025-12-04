import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import meetingService from '../services/meetingService';
import audioService from '../services/audioService';

/**
 * Create a new audio meeting
 * @route POST /api/meetings
 * @param {AuthRequest} req - Express request with authenticated user
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 */
export const createMeeting = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, maxParticipants } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!name) {
      res.status(400).json({ error: 'Meeting name is required' });
      return;
    }

    const meeting = await meetingService.createMeeting(
      name,
      userId,
      maxParticipants || 50
    );

    res.status(201).json({ success: true, meeting });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Error creating meeting' });
  }
};

/**
 * Get meeting details
 * @route GET /api/meetings/:meetingId
 * @param {AuthRequest} req - Express request with meeting ID in params
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 */
export const getMeeting = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { meetingId } = req.params;

    const meeting = await meetingService.getMeeting(meetingId);
    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    res.json({ success: true, meeting });
  } catch (error) {
    console.error('Error getting meeting:', error);
    res.status(500).json({ error: 'Error getting meeting' });
  }
};

/**
 * Join a meeting
 * @route POST /api/meetings/:meetingId/join
 * @param {AuthRequest} req - Express request with meeting ID and authenticated user
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 */
export const joinMeeting = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { meetingId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const meeting = await meetingService.getMeeting(meetingId);
    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    if (!meeting.isActive) {
      res.status(410).json({ error: 'Meeting has ended' });
      return;
    }

    const added = await meetingService.addParticipant(meetingId, userId);
    if (!added) {
      res.status(400).json({ error: 'Could not join meeting' });
      return;
    }

    // Create audio stream
    const audioStream = await audioService.createAudioStream(meetingId, userId, 'high');

    res.json({ success: true, meeting, audioStream });
  } catch (error) {
    console.error('Error joining meeting:', error);
    res.status(500).json({ error: 'Error joining meeting' });
  }
};

/**
 * Leave a meeting
 * @route POST /api/meetings/:meetingId/leave
 * @param {AuthRequest} req - Express request with meeting ID and authenticated user
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 */
export const leaveMeeting = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { meetingId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    await meetingService.removeParticipant(meetingId, userId);

    res.json({ success: true, message: 'Left meeting' });
  } catch (error) {
    console.error('Error leaving meeting:', error);
    res.status(500).json({ error: 'Error leaving meeting' });
  }
};

/**
 * End a meeting
 * @route POST /api/meetings/:meetingId/end
 * @param {AuthRequest} req - Express request with meeting ID and authenticated user
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 * @description Only the meeting creator can end the meeting
 */
export const endMeeting = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { meetingId } = req.params;
    const userId = req.user?.uid;

    const meeting = await meetingService.getMeeting(meetingId);
    if (!meeting) {
      res.status(404).json({ error: 'Meeting not found' });
      return;
    }

    // Only the creator can end the meeting
    if (meeting.creatorId !== userId) {
      res.status(403).json({ error: 'Only the creator can end the meeting' });
      return;
    }

    await meetingService.endMeeting(meetingId);

    res.json({ success: true, message: 'Meeting ended' });
  } catch (error) {
    console.error('Error ending meeting:', error);
    res.status(500).json({ error: 'Error ending meeting' });
  }
};

/**
 * Get meeting participants
 * @route GET /api/meetings/:meetingId/participants
 * @param {AuthRequest} req - Express request with meeting ID in params
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 */
export const getMeetingParticipants = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { meetingId } = req.params;

    const participants = await meetingService.getMeetingParticipants(meetingId);

    res.json({ success: true, participants });
  } catch (error) {
    console.error('Error getting participants:', error);
    res.status(500).json({ error: 'Error getting participants' });
  }
};

/**
 * Get all active meetings
 * @route GET /api/meetings/active
 * @param {AuthRequest} req - Express request
 * @param {Response} res - Express response
 * @returns {Promise<void>}
 */
export const getActiveMeetings = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const meetings = await meetingService.getActiveMeetings();

    res.json({ success: true, meetings });
  } catch (error) {
    console.error('Error getting active meetings:', error);
    res.status(500).json({ error: 'Error getting meetings' });
  }
};
