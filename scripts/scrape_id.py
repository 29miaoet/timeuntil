import re
import requests

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

def get_site_info(school: str):
    school = school.strip().lower()

    url = f"https://www.lrsd.net/{school}/calendar"
    
    print("Fetching site ID...")
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()

    html = response.text

    site_id = re.search(r"_ci\.siteId\s*=\s*(\d+)", html)
    site_title = re.search(r"_ci\.siteTitle='([^']+)'", html)
    url_name = re.search(r"_ci\.urlName='([^']+)'", html)

    if not site_id:
        raise RuntimeError("Could not find _ci.siteId")

    print("Site ID fetched.")
    return {
        "site_id": int(site_id.group(1)),
        "title": site_title.group(1) if site_title else None,
        "url_name": url_name.group(1) if url_name else school,
    }


if __name__ == "__main__":
    info = get_site_info("gci")
    print(info)
    input()
