import java.io.File
import org.apache.tools.ant.taskdefs.condition.Os
import org.gradle.api.DefaultTask
import org.gradle.api.GradleException
import org.gradle.api.logging.LogLevel
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.TaskAction

open class BuildTask : DefaultTask() {
    @Input
    var rootDirRel: String? = null
    @Input
    var target: String? = null
    @Input
    var release: Boolean? = null

    @TaskAction
    fun assemble() {
        val executable = """npm""";
        try {
            runTauriCli(executable)
        } catch (e: Exception) {
            if (Os.isFamily(Os.FAMILY_WINDOWS)) {
                // Try different Windows-specific extensions
                val fallbacks = listOf(
                    "$executable.exe",
                    "$executable.cmd",
                    "$executable.bat",
                )
                
                var lastException: Exception = e
                for (fallback in fallbacks) {
                    try {
                        runTauriCli(fallback)
                        return
                    } catch (fallbackException: Exception) {
                        lastException = fallbackException
                    }
                }
                throw lastException
            } else {
                throw e;
            }
        }
    }

    fun runTauriCli(executable: String) {
        val rootDirRel = rootDirRel ?: throw GradleException("rootDirRel cannot be null")
        val target = target ?: throw GradleException("target cannot be null")
        val release = release ?: throw GradleException("release cannot be null")
        val args = listOf("run", "--", "tauri", "android", "android-studio-script");
        val ndkHome = System.getenv("NDK_HOME") ?: System.getenv("ANDROID_NDK_HOME")
        val ndkBin = ndkHome?.let { File(it, "toolchains/llvm/prebuilt/windows-x86_64/bin") }
        val linker = when (target) {
            "aarch64" -> "aarch64-linux-android28-clang.cmd"
            "armv7" -> "armv7a-linux-androideabi28-clang.cmd"
            "i686" -> "i686-linux-android28-clang.cmd"
            "x86_64" -> "x86_64-linux-android28-clang.cmd"
            else -> null
        }
        val cargoTarget = when (target) {
            "aarch64" -> "AARCH64_LINUX_ANDROID"
            "armv7" -> "ARMV7_LINUX_ANDROIDEABI"
            "i686" -> "I686_LINUX_ANDROID"
            "x86_64" -> "X86_64_LINUX_ANDROID"
            else -> null
        }

        project.exec {
            workingDir(File(project.projectDir, rootDirRel))
            if (Os.isFamily(Os.FAMILY_WINDOWS)) {
                executable("cmd")
                args("/d", "/c", "$executable.cmd")
            } else {
                executable(executable)
            }
            args(args)
            if (ndkBin?.isDirectory == true) {
                environment("PATH", "${ndkBin.absolutePath};${System.getenv("PATH")}")
                if (linker != null && cargoTarget != null) environment("CARGO_TARGET_${cargoTarget}_LINKER", linker)
            }
            if (project.logger.isEnabled(LogLevel.DEBUG)) {
                args("-vv")
            } else if (project.logger.isEnabled(LogLevel.INFO)) {
                args("-v")
            }
            if (release) {
                args("--release")
            }
            args(listOf("--target", target))
        }.assertNormalExitValue()
    }
}
