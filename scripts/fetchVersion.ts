function fetchVersion() {
  const version = fetch("https://api.github.com/repos/29miaoet/timeuntil/releases/latest")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      return response.json();
    })
    .then((release) => {
      if (
        typeof release === "object" &&
        release !== null &&
        "tag_name" in release &&
        typeof release.tag_name === "string"
      ) {
        return release.tag_name;
      }
    })
    .catch((error: unknown) => {
      console.warn("Could not fetch latest release version:", error);
      return null;
    });
  return version;
}

(async function () {
  console.log(await fetchVersion());
})();
