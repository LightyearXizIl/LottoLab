param(
  [switch]$Debug
)

$ErrorActionPreference = 'Stop'
$sdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { $env:ANDROID_SDK_ROOT }
if ([string]::IsNullOrWhiteSpace($sdkRoot)) { throw 'ANDROID_HOME or ANDROID_SDK_ROOT is required.' }
$ndkRoot = if ($env:NDK_HOME) { $env:NDK_HOME } else { Join-Path $sdkRoot 'ndk/29.0.14206865' }
$ndkBin = Join-Path $ndkRoot 'toolchains/llvm/prebuilt/windows-x86_64/bin'
if (-not (Test-Path -LiteralPath $ndkBin)) { throw "Android NDK clang directory not found: $ndkBin" }

$env:NDK_HOME = $ndkRoot
$env:ANDROID_NDK_HOME = $ndkRoot
$env:PATH = "$ndkBin;$env:PATH"
$linkers = @{
  CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER = 'aarch64-linux-android28-clang.cmd'
  CARGO_TARGET_ARMV7_LINUX_ANDROIDEABI_LINKER = 'armv7a-linux-androideabi28-clang.cmd'
  CARGO_TARGET_I686_LINUX_ANDROID_LINKER = 'i686-linux-android28-clang.cmd'
  CARGO_TARGET_X86_64_LINUX_ANDROID_LINKER = 'x86_64-linux-android28-clang.cmd'
}
foreach ($entry in $linkers.GetEnumerator()) { Set-Item -Path "Env:$($entry.Key)" -Value $entry.Value }

$tauriArgs = @('run', 'tauri', '--', 'android', 'build', '--apk')
if ($Debug) { $tauriArgs += '--debug' }
& npm.cmd @tauriArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
