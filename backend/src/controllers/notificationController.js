const { PushSubscription, NotificationLog } = require('../models/Common');
const webpush = require('web-push');

// Configure VAPID
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@forbasi.or.id',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Subscribe to push notifications
exports.subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ success: false, message: 'Data subscription tidak valid' });
    }

    const userType = req.user.user_type === 'user'
      ? (req.user.role_id === 1 ? 'user' : req.user.role_id === 2 ? 'pengcab' : req.user.role_id === 3 ? 'pengda' : 'pb')
      : req.user.user_type;

    await PushSubscription.create({
      user_id: req.user.id,
      user_type: userType,
      endpoint,
      p256dh_key: keys.p256dh,
      auth_key: keys.auth
    });

    return res.json({ success: true, message: 'Subscription berhasil disimpan' });
  } catch (err) {
    console.error('Subscribe error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Send push notification (PB/SuperAdmin)
exports.sendNotification = async (req, res) => {
  try {
    const { title, body, icon, url, target_type } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title dan body wajib diisi' });
    }

    const filters = {};
    if (target_type && target_type !== 'all') {
      filters.user_type = target_type;
    }

    const subscriptions = await PushSubscription.findActive(filters);

    let sent = 0;
    let failed = 0;

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/assets/LOGO-FORBASI.png',
      url: url || '/'
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key
          }
        }, payload);
        await NotificationLog.create(sub.id, 'success');
        sent++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.deactivate(sub.endpoint);
        }
        await NotificationLog.create(sub.id, 'failed');
        failed++;
      }
    }

    return res.json({
      success: true,
      message: `Notifikasi dikirim: ${sent} berhasil, ${failed} gagal`,
      data: { sent, failed, total: subscriptions.length }
    });
  } catch (err) {
    console.error('Send notification error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// Track notification click
exports.trackClick = async (req, res) => {
  try {
    const { subscription_id } = req.body;
    if (subscription_id) {
      await NotificationLog.trackClick(subscription_id);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false });
  }
};

// Get VAPID public key
exports.getVapidKey = async (req, res) => {
  return res.json({
    success: true,
    data: { publicKey: process.env.VAPID_PUBLIC_KEY || '' }
  });
};

// Get notification stats (SuperAdmin/PB)
exports.getStats = async (req, res) => {
  try {
    const db = require('../lib/db-compat');
    const subscriptionStats = await PushSubscription.getStats();
    const recentLogs = await NotificationLog.getRecentLogs(20);

    // Delivery & click-through rate (matching PHP superadmin_dashboard)
    const [logStats] = await db.query(`
      SELECT
        COUNT(*) as total_notifications,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_notifications,
        SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) as clicked_notifications
      FROM notifications_log
    `);
    const s = logStats[0];
    const deliveryRate = s.total_notifications > 0
      ? Math.round((s.successful_notifications / s.total_notifications) * 1000) / 10
      : 0;
    const clickRate = s.successful_notifications > 0
      ? Math.round((s.clicked_notifications / s.successful_notifications) * 1000) / 10
      : 0;

    return res.json({
      success: true,
      data: {
        subscriptions: subscriptionStats,
        notifications: {
          total: s.total_notifications,
          successful: s.successful_notifications,
          clicked: s.clicked_notifications,
          deliveryRate,
          clickRate
        },
        recentLogs
      }
    });
  } catch (err) {
    console.error('Get notification stats error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

