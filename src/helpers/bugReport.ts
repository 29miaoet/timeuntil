export default function bugReportListen() {
  const bugReport = document.getElementById("bug-report");

  if (!bugReport) {
    console.error("Could not find bug report option.");
  } else {
    bugReport.addEventListener("click", () => {
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      const screenRes = `${window.innerWidth}x${window.innerHeight}`;

      const subject = encodeURIComponent("Bug Report");
      const body = encodeURIComponent(
        `--- System Info --- (Do not edit):\n` +
          `- Platform: ${platform}\n` +
          `- Screen Resolution: ${screenRes}\n` +
          `- User Agent: ${userAgent}\n\n` +
          `Please summarize the issue below:\n`
      );

      window.location.href = `mailto:ethan.miao2011@gmail.com?subject=${subject}&body=${body}`;
    });
  }
}
