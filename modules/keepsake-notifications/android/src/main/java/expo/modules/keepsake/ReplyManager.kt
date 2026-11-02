package expo.modules.keepsake

import android.app.Notification
import android.app.RemoteInput
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.service.notification.StatusBarNotification
import android.util.Log
import java.util.concurrent.ConcurrentHashMap

object ReplyManager {
  private const val TAG = "KeepsakeReply"

  // Maps sbnKey -> Notification.Action
  val activeReplyActions = ConcurrentHashMap<String, Notification.Action>()
  // Maps "packageName:title" -> Notification.Action
  val activeReplyByChat = ConcurrentHashMap<String, Notification.Action>()

  @Volatile
  var serviceInstance: KeepsakeListenerService? = null

  fun registerAction(sbn: StatusBarNotification, title: String?) {
    val n = sbn.notification ?: return
    val actions = n.actions ?: return
    for (action in actions) {
      val inputs = action.remoteInputs
      if (inputs != null && inputs.isNotEmpty()) {
        activeReplyActions[sbn.key] = action
        if (!title.isNullOrEmpty()) {
          activeReplyByChat["${sbn.packageName}:$title"] = action
        }
        break
      }
    }
  }

  fun canReply(sbnKey: String?, chatKey: String?): Boolean {
    if (!sbnKey.isNullOrEmpty() && activeReplyActions.containsKey(sbnKey)) return true
    if (!chatKey.isNullOrEmpty() && activeReplyByChat.containsKey(chatKey)) return true
    val listener = serviceInstance ?: return false
    return try {
      val sbns = listener.activeNotifications ?: return false
      sbns.any { sbn ->
        val keyMatch = !sbnKey.isNullOrEmpty() && sbn.key == sbnKey
        val chatMatch = !chatKey.isNullOrEmpty() && "${sbn.packageName}:${sbn.notification?.extras?.getCharSequence(Notification.EXTRA_TITLE)}" == chatKey
        if (keyMatch || chatMatch) {
          val actions = sbn.notification?.actions ?: emptyArray()
          actions.any { it.remoteInputs != null && it.remoteInputs.isNotEmpty() }
        } else false
      }
    } catch (e: Exception) {
      Log.w(TAG, "canReply check failed", e)
      false
    }
  }

  fun sendReply(context: Context, sbnKey: String?, chatKey: String?, text: String): Boolean {
    var action: Notification.Action? = null
    if (!sbnKey.isNullOrEmpty()) {
      action = activeReplyActions[sbnKey]
    }
    if (action == null && !chatKey.isNullOrEmpty()) {
      action = activeReplyByChat[chatKey]
    }
    if (action == null) {
      val listener = serviceInstance
      if (listener != null) {
        try {
          val sbns = listener.activeNotifications ?: emptyArray()
          val matchedSbn = sbns.firstOrNull { sbn ->
            val keyMatch = !sbnKey.isNullOrEmpty() && sbn.key == sbnKey
            val chatMatch = !chatKey.isNullOrEmpty() && "${sbn.packageName}:${sbn.notification?.extras?.getCharSequence(Notification.EXTRA_TITLE)}" == chatKey
            keyMatch || chatMatch
          }
          action = matchedSbn?.notification?.actions?.firstOrNull { it.remoteInputs != null && it.remoteInputs.isNotEmpty() }
        } catch (e: Exception) {
          Log.w(TAG, "Search active notifications failed", e)
        }
      }
    }

    val replyAction = action ?: return false
    val remoteInputs = replyAction.remoteInputs ?: return false
    if (remoteInputs.isEmpty()) return false

    return try {
      val intent = Intent()
      val bundle = Bundle()
      for (input in remoteInputs) {
        bundle.putCharSequence(input.resultKey, text)
      }
      RemoteInput.addResultsToIntent(remoteInputs, intent, bundle)
      replyAction.actionIntent.send(context, 0, intent)
      true
    } catch (e: Exception) {
      Log.e(TAG, "Sending reply failed", e)
      false
    }
  }
}

