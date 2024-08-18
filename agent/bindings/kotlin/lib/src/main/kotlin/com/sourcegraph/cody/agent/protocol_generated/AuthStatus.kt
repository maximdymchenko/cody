@file:Suppress("FunctionName", "ClassName", "unused", "EnumEntryName", "UnusedImport")
package com.sourcegraph.cody.agent.protocol_generated;

data class AuthStatus(
  val username: String,
  val endpoint: String,
  val isDotCom: Boolean,
  val isLoggedIn: Boolean,
  val showInvalidAccessTokenError: Boolean,
  val authenticated: Boolean,
  val siteHasCodyEnabled: Boolean,
  val siteVersion: String,
  val codyApiVersion: Long,
  val configOverwrites: CodyLLMSiteConfiguration? = null,
  val showNetworkError: Boolean? = null,
  val primaryEmail: String,
  val displayName: String? = null,
  val avatarURL: String,
  val isOfflineMode: Boolean? = null,
)

