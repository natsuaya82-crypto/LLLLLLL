package com.tokinets.lingua

import android.app.PendingIntent
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/*
 * A notification that arrives WHILE THE APP IS IN FRONT.
 *
 * With the app closed or behind another, Android draws push-send's
 * `notification` itself and a tap opens MainActivity with `data` on the
 * intent -- LinguaPushPlugin takes it from there. With the app in front,
 * Firebase draws nothing and calls this instead. iOS shows a banner in that
 * case (LinguaPushTaps.willPresent in LinguaPush.swift), so this draws the same
 * notification the same way, carrying the same two keys, so a tap on it is the
 * same tap.
 *
 * WHAT IT SAYS is the server's: the title and body push-send wrote, nothing
 * made up here. A message with neither is drawn as nothing.
 *
 * The token is not kept here (onNewToken is not overridden): the phone keeps
 * no copy of its address (www/push.js), and pushAsk() asks Firebase for the
 * current one at every session arrival.
 */
class LinguaPushService : FirebaseMessagingService() {

  override fun onMessageReceived(msg: RemoteMessage) {
    val n = msg.notification ?: return
    val title = n.title ?: ""
    val body = n.body ?: ""
    if (title.isEmpty() && body.isEmpty()) return
    if (!NotificationManagerCompat.from(this).areNotificationsEnabled()) return
    LinguaPushPlugin.channel(this)

    val open = Intent(this, MainActivity::class.java)
      .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    msg.data["kind"]?.let { open.putExtra("kind", it) }
    msg.data["post"]?.let { open.putExtra("post", it) }
    val tap = PendingIntent.getActivity(this, msg.messageId?.hashCode() ?: 0, open,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    val note = NotificationCompat.Builder(this, LinguaPushPlugin.CHANNEL)
      .setSmallIcon(applicationInfo.icon)
      .setContentTitle(title)
      .setContentText(body)
      .setAutoCancel(true)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setContentIntent(tap)
      .build()
    try {
      NotificationManagerCompat.from(this).notify(msg.messageId?.hashCode() ?: 0, note)
    } catch (e: SecurityException) {
      // The permission was taken away between the check and here: nothing to draw.
    }
  }
}
