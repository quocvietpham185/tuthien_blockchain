const notifications = [];
const MAX_NOTIFICATIONS = 500;

function addNotification(type, payload) {
  const notification = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    payload,
    createdAt: new Date().toISOString(),
    read: false,
  };

  notifications.unshift(notification);
  if (notifications.length > MAX_NOTIFICATIONS) notifications.length = MAX_NOTIFICATIONS;
  return notification;
}

function listNotifications({ address, unreadOnly = false } = {}) {
  const normalized = address?.toLowerCase();
  return notifications.filter((item) => {
    if (unreadOnly && item.read) return false;
    if (!normalized) return true;

    const owner = item.payload?.owner?.toLowerCase();
    const donor = item.payload?.donor?.toLowerCase();
    const actor = item.payload?.actor?.toLowerCase();
    return owner === normalized || donor === normalized || actor === normalized;
  });
}

function markAllRead(address) {
  const items = listNotifications({ address });
  items.forEach((item) => {
    item.read = true;
  });
  return items.length;
}

module.exports = {
  addNotification,
  listNotifications,
  markAllRead,
};
