package cn.lightyearxizil.lottolab

import android.content.res.Configuration
import android.graphics.Color
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowCompat

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    applySystemBars("system")
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    webView.addJavascriptInterface(ThemeBridge(), "LottoLabAndroid")
  }

  private fun applySystemBars(mode: String) {
    val isSystemDark = resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK == Configuration.UI_MODE_NIGHT_YES
    val isDark = when (mode) {
      "dark" -> true
      "light" -> false
      else -> isSystemDark
    }
    window.statusBarColor = Color.TRANSPARENT
    window.navigationBarColor = Color.TRANSPARENT
    val controller = WindowCompat.getInsetsController(window, window.decorView)
    controller.isAppearanceLightStatusBars = !isDark
    controller.isAppearanceLightNavigationBars = !isDark
  }

  private inner class ThemeBridge {
    @JavascriptInterface
    fun setTheme(mode: String) {
      if (mode != "system" && mode != "light" && mode != "dark") return
      runOnUiThread { applySystemBars(mode) }
    }
  }
}
