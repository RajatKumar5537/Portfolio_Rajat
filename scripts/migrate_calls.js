const mongoose = require('mongoose');
const crypto = require('crypto');

const uri = 'mongodb+srv://kumarrajatpradhan5537_db_user:urwdzLWzzryqmv2m@cluster0.g8xlcsu.mongodb.net/personal-tracker?retryWrites=true&w=majority';
const secret = '92bc804c869fb8f6c48ad0d524813589b21e8e4db7b80a13';
const SECRET_KEY = crypto.scryptSync(secret, 'personal-tracker-salt', 32);

function encryptMessage(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', SECRET_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return { content: encrypted, iv: iv.toString('hex'), authTag };
}

function decryptMessage(data) {
  try {
    const iv = Buffer.from(data.iv, 'hex');
    const authTag = Buffer.from(data.authTag, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', SECRET_KEY, iv);
    decipher.setAuthTag(authTag);
    let dec = decipher.update(data.content, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  } catch(e) {
    return data.content;
  }
}

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // 1. Check legacy connections
  const oldConns = await db.collection('chatconnections').find({}).toArray();
  console.log('Found old connections:', oldConns.length);

  for (const conn of oldConns) {
    // Check if exists in prime_connections
    const exists = await db.collection('prime_connections').findOne({
      $or: [
        { requesterId: conn.requesterId, recipientId: conn.recipientId },
        { requesterId: conn.recipientId, recipientId: conn.requesterId }
      ]
    });

    if (!exists) {
      await db.collection('prime_connections').insertOne({
        requesterId: conn.requesterId,
        requesterName: conn.requesterName,
        requesterEmail: conn.requesterEmail,
        requesterAvatar: '',
        recipientId: conn.recipientId,
        recipientName: conn.recipientName,
        recipientEmail: conn.recipientEmail,
        recipientAvatar: '',
        status: conn.status || 'accepted',
        createdAt: conn.createdAt || new Date(),
        updatedAt: conn.updatedAt || new Date(),
        __v: 0
      });
      console.log('Migrated connection for', conn.requesterName, '<->', conn.recipientName);
    }

    // Ensure conversation exists in prime_conversations
    let conv = await db.collection('prime_conversations').findOne({
      type: 'direct',
      participants: { $all: [conn.requesterId, conn.recipientId] }
    });

    if (!conv) {
      const newConv = await db.collection('prime_conversations').insertOne({
        type: 'direct',
        name: '',
        icon: '',
        participants: [conn.requesterId, conn.recipientId].sort(),
        participantEmails: [conn.requesterEmail, conn.recipientEmail].filter(Boolean),
        admins: [],
        createdBy: conn.requesterId,
        isPinnedBy: [],
        disappearingHours: 0,
        lastMessage: null,
        customWallpaper: '',
        clearedFor: [],
        createdAt: conn.createdAt || new Date(),
        updatedAt: conn.updatedAt || new Date(),
        __v: 0
      });
      conv = { _id: newConv.insertedId };
      console.log('Created direct conversation:', conv._id.toString());
    }

    const conversationId = conv._id.toString();

    // 2. Migrate legacy messages
    const oldMsgs = await db.collection('chatmessages').find({
      $or: [
        { senderId: conn.requesterId, recipientId: conn.recipientId },
        { senderId: conn.recipientId, recipientId: conn.requesterId },
        { roomId: conn.roomId }
      ]
    }).sort({ createdAt: 1 }).toArray();

    console.log('Found legacy messages for room:', oldMsgs.length);
    for (const om of oldMsgs) {
      const alreadyMigrated = await db.collection('prime_messages').findOne({
        conversationId,
        createdAt: om.createdAt
      });

      if (!alreadyMigrated) {
        let text = decryptMessage({ content: om.content, iv: om.iv, authTag: om.authTag });
        try {
          const parsed = JSON.parse(text);
          if (parsed && typeof parsed.text === 'string') text = parsed.text;
        } catch(_) {}

        const enc = encryptMessage(text);
        await db.collection('prime_messages').insertOne({
          conversationId,
          senderId: om.senderId,
          senderName: om.sender || 'User',
          senderAvatar: '',
          content: enc.content,
          iv: enc.iv,
          authTag: enc.authTag,
          effect: null,
          mediaType: null,
          mediaData: null,
          mediaName: null,
          mediaSize: null,
          audioDuration: 0,
          reactions: [],
          replyTo: null,
          readBy: om.isRead ? [{ userId: om.recipientId, readAt: om.readAt || om.createdAt }] : [],
          isEdited: Boolean(om.isEdited),
          isDeleted: Boolean(om.isDeleted),
          isPinned: false,
          clearedFor: om.clearedFor || [],
          expiresAt: null,
          createdAt: om.createdAt,
          updatedAt: om.updatedAt || om.createdAt,
          __v: 0
        });
        console.log('Migrated message:', text);
      }
    }

    // 3. Migrate legacy calls from chatcalls
    const oldCalls = await db.collection('chatcalls').find({
      $or: [
        { callerId: conn.requesterId, recipientId: conn.recipientId },
        { callerId: conn.recipientId, recipientId: conn.requesterId },
        { roomId: conn.roomId }
      ]
    }).sort({ createdAt: 1 }).toArray();

    console.log('Found legacy calls for room:', oldCalls.length);
    for (const call of oldCalls) {
      const alreadyMigrated = await db.collection('prime_messages').findOne({
        conversationId,
        createdAt: call.createdAt
      });

      if (!alreadyMigrated) {
        const isVideo = call.callType === 'video';
        let text = '';
        if (call.status === 'declined' || call.status === 'missed') {
          text = isVideo ? '🎥 Missed video call' : '📞 Missed audio call';
        } else if (call.status === 'ended') {
          if (call.durationSec && call.durationSec > 0) {
            const mins = Math.floor(call.durationSec / 60);
            const secs = call.durationSec % 60;
            const durText = mins > 0 ? (mins + 'm ' + secs + 's') : (secs + 's');
            text = (isVideo ? '🎥 Video call' : '📞 Audio call') + ' • ' + durText;
          } else {
            text = isVideo ? '🎥 Cancelled video call' : '📞 Cancelled call';
          }
        } else {
          text = (isVideo ? '🎥 Video call' : '📞 Audio call');
        }

        const enc = encryptMessage(text);
        await db.collection('prime_messages').insertOne({
          conversationId,
          senderId: call.callerId,
          senderName: call.callerName || 'User',
          senderAvatar: '',
          content: enc.content,
          iv: enc.iv,
          authTag: enc.authTag,
          effect: null,
          mediaType: 'call',
          mediaData: null,
          mediaName: null,
          mediaSize: null,
          audioDuration: call.durationSec || 0,
          reactions: [],
          replyTo: null,
          readBy: [{ userId: call.recipientId, readAt: call.endedAt || call.createdAt }],
          isEdited: false,
          isDeleted: false,
          isPinned: false,
          clearedFor: [],
          expiresAt: null,
          createdAt: call.createdAt,
          updatedAt: call.endedAt || call.createdAt,
          __v: 0
        });
        console.log('Migrated call to message:', text, 'at', call.createdAt);
      }
    }

    // Update conversation last message
    const latestMsg = await db.collection('prime_messages').find({ conversationId }).sort({ createdAt: -1 }).limit(1).toArray();
    if (latestMsg.length > 0) {
      const lm = latestMsg[0];
      const decText = decryptMessage({ content: lm.content, iv: lm.iv, authTag: lm.authTag });
      await db.collection('prime_conversations').updateOne(
        { _id: conv._id },
        {
          $set: {
            lastMessage: {
              text: decText,
              senderId: lm.senderId,
              senderName: lm.senderName,
              createdAt: lm.createdAt,
              mediaType: lm.mediaType || null,
              effect: lm.effect || null,
            },
            updatedAt: lm.createdAt
          }
        }
      );
      console.log('Updated conversation lastMessage to:', decText);
    }
  }

  console.log('Migration complete!');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
